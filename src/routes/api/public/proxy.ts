import { createFileRoute } from "@tanstack/react-router";

import { rewriteCss, rewriteHtml } from "@/lib/proxy-rewrite.server";

const BLOCKED_HOST = /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|.*\.local)$/i;

function isBlocked(host: string): boolean {
  const h = host.toLowerCase().replace(/:\d+$/, "");
  return BLOCKED_HOST.test(h) || h.startsWith("10.") || h.startsWith("192.168.");
}

const HOP_BY_HOP = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
  "content-security-policy",
  "content-security-policy-report-only",
  "x-frame-options",
  "strict-transport-security",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
  "permissions-policy",
  "set-cookie",
  "report-to",
]);

async function handle(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("url");

  if (!target) {
    return new Response("Missing ?url parameter", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response("Invalid target URL", { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return new Response("Only http(s) targets are allowed", { status: 400 });
  }
  if (isBlocked(parsed.host)) {
    return new Response("Target host is not allowed", { status: 403 });
  }

  const outboundHeaders = new Headers();
  outboundHeaders.set(
    "user-agent",
    request.headers.get("user-agent") ??
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
  );
  const accept = request.headers.get("accept");
  if (accept) outboundHeaders.set("accept", accept);
  const lang = request.headers.get("accept-language");
  if (lang) outboundHeaders.set("accept-language", lang);
  outboundHeaders.set("referer", parsed.origin + "/");

  let upstream: Response;
  try {
    upstream = await fetch(parsed.toString(), {
      method: request.method,
      headers: outboundHeaders,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? null
          : new Uint8Array(await request.arrayBuffer()),
      redirect: "follow",
    });
  } catch (error) {
    return new Response(
      `Could not reach ${parsed.host}: ${error instanceof Error ? error.message : "network error"}`,
      { status: 502, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  const finalUrl = upstream.url || parsed.toString();
  const contentType = upstream.headers.get("content-type") ?? "";

  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set("cache-control", "no-store");
  headers.set("x-proxy-final-url", finalUrl);
  headers.set("access-control-allow-origin", "*");

  if (/text\/html/i.test(contentType)) {
    const body = rewriteHtml(await upstream.text(), finalUrl);
    headers.set("content-type", "text/html; charset=utf-8");
    return new Response(body, { status: upstream.status, headers });
  }

  if (/text\/css/i.test(contentType)) {
    const body = rewriteCss(await upstream.text(), finalUrl);
    headers.set("content-type", "text/css; charset=utf-8");
    return new Response(body, { status: upstream.status, headers });
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}

export const Route = createFileRoute("/api/public/proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET,POST,OPTIONS",
            "access-control-allow-headers": "*",
          },
        }),
    },
  },
});
