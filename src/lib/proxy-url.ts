/**
 * Shared helpers for encoding/decoding proxied URLs.
 * Browser-safe: no server-only imports here.
 */

export const PROXY_PREFIX = "/api/public/proxy";

export function toProxyPath(absoluteUrl: string): string {
  return `${PROXY_PREFIX}?url=${encodeURIComponent(absoluteUrl)}`;
}

/** Turn arbitrary user input ("wikipedia.org", "how to cook") into a real URL. */
export function normalizeInput(raw: string, searchTemplate = "https://duckduckgo.com/?q=%s"): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const looksLikeHost = /^[\w-]+(\.[\w-]+)+(\/|$|:\d)/.test(value) && !/\s/.test(value);
  if (looksLikeHost) return `https://${value}`;
  return searchTemplate.replace("%s", encodeURIComponent(value));
}

export function prettyHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
