import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { PortalChrome } from "@/components/PortalChrome";
import { normalizeInput, prettyHost, toProxyPath } from "@/lib/proxy-url";
import { useBookmarks, useSettings } from "@/lib/portal-store";

type BrowseSearch = { url?: string | undefined };

export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>): BrowseSearch => ({
    url: typeof search["url"] === "string" ? search["url"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse — Tundra Network" },
      {
        name: "description",
        content: "Proxied browser shell with an address bar, tabs, reload and bookmarking for any website.",
      },
      { property: "og:title", content: "Browse — Tundra Network" },
      { property: "og:description", content: "Proxied browser shell with address bar, tabs and bookmarking." },
    ],
  }),
  component: Browse,
});

type Tab = { id: string; url: string; title: string };

function Browse() {
  const { url } = Route.useSearch();
  const navigate = useNavigate();
  const { value: settings } = useSettings();
  const bookmarks = useBookmarks();
  const frameRef = useRef<HTMLIFrameElement>(null);

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [address, setAddress] = useState(url ?? "");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setAddress(url ?? "");
    if (!url) return;
    setTabs((prev) => {
      const existing = prev.find((t) => t.url === url);
      if (existing) {
        setActiveId(existing.id);
        return prev;
      }
      const tab: Tab = { id: `${Date.now()}`, url, title: prettyHost(url) };
      setActiveId(tab.id);
      return [...prev, tab].slice(-8);
    });
  }, [url]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data as { __proxy?: string; url?: string; title?: string } | null;
      if (!data || data.__proxy !== "location" || !data.url) return;
      setTabs((prev) => prev.map((t) => (t.url === url ? { ...t, title: data.title || t.title } : t)));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [url]);

  function open(raw: string) {
    const next = normalizeInput(raw, settings.searchEngine);
    if (!next) return;
    void navigate({ to: "/browse", search: { url: next } });
  }

  const active = tabs.find((t) => t.id === activeId) ?? null;
  const bookmarked = url ? bookmarks.items.some((b) => b.url === url) : false;

  return (
    <PortalChrome>
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-6">
        {tabs.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${
                  tab.id === activeId ? "border-primary bg-secondary" : "border-border bg-card"
                }`}
              >
                <button onClick={() => open(tab.url)} className="max-w-[10rem] truncate">
                  {tab.title}
                </button>
                <button
                  aria-label={`Close ${tab.title}`}
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setTabs((prev) => prev.filter((t) => t.id !== tab.id))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          className="panel flex flex-wrap items-center gap-2 p-2"
          onSubmit={(e) => {
            e.preventDefault();
            open(address);
          }}
        >
          <button
            type="button"
            aria-label="Back"
            onClick={() => window.history.back()}
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Forward"
            onClick={() => window.history.forward()}
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            →
          </button>
          <button
            type="button"
            aria-label="Reload"
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            ⟳
          </button>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Search or enter a URL"
            aria-label="Address bar"
            className="min-w-0 flex-1 rounded-lg bg-input px-3 py-2 font-mono text-xs outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            disabled={!url}
            onClick={() =>
              url &&
              (bookmarked
                ? bookmarks.remove(url)
                : bookmarks.add({ url, title: active?.title ?? prettyHost(url) }))
            }
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            {bookmarked ? "★" : "☆"}
          </button>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Go
          </button>
        </form>

        <div className="panel mt-3 overflow-hidden">
          {url ? (
            <iframe
              key={`${url}-${reloadKey}`}
              ref={frameRef}
              src={toProxyPath(url)}
              title="Proxied page"
              className="h-[70vh] w-full bg-background"
              sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
            />
          ) : (
            <div className="flex h-[70vh] items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Enter a URL above to start browsing through the proxy.
            </div>
          )}
        </div>

        {url && (
          <p className="mt-3 truncate font-mono text-xs text-muted-foreground">Proxying {url}</p>
        )}
      </section>
    </PortalChrome>
  );
}
