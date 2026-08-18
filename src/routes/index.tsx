import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { PortalChrome } from "@/components/PortalChrome";
import { normalizeInput } from "@/lib/proxy-url";
import { useSettings } from "@/lib/portal-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tundra Network — Fast Web Proxy Portal" },
      {
        name: "description",
        content:
          "Tundra Network is a rewriting web proxy portal: open any site through a clean browser shell with bookmarks, search and tab cloaking.",
      },
      { property: "og:title", content: "Tundra Network — Fast Web Proxy Portal" },
      {
        property: "og:description",
        content: "Open any site through a rewriting server proxy with bookmarks, search and tab cloaking.",
      },
    ],
  }),
  component: Home,
});

const shortcuts = [
  { label: "Wikipedia", url: "https://en.wikipedia.org" },
  { label: "Hacker News", url: "https://news.ycombinator.com" },
  { label: "DuckDuckGo", url: "https://duckduckgo.com" },
  { label: "Example.com", url: "https://example.com" },
  { label: "MDN", url: "https://developer.mozilla.org" },
  { label: "Lobsters", url: "https://lobste.rs" },
];

function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { value: settings } = useSettings();

  function go(raw: string) {
    const url = normalizeInput(raw, settings.searchEngine);
    if (!url) return;
    void navigate({ to: "/browse", search: { url } });
  }

  return (
    <PortalChrome>
      <section className="mx-auto max-w-3xl px-4 pb-16 pt-20 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground">
          server-side rewriting proxy
        </p>
        <h1 className="mt-5 text-5xl font-semibold sm:text-6xl">
          <span className="aurora-text">Tundra</span> Network
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
          Type a site or a search. We fetch it, rewrite its links and styles, and hand it back through our own origin.
        </p>

        <form
          className="aurora-ring mt-10 flex items-center gap-2 rounded-2xl bg-card p-2"
          onSubmit={(e) => {
            e.preventDefault();
            go(query);
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or enter a URL"
            aria-label="Search or enter a URL"
            className="min-w-0 flex-1 bg-transparent px-4 py-3 font-mono text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Launch
          </button>
        </form>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shortcuts.map((s) => (
            <button
              key={s.url}
              onClick={() => go(s.url)}
              className="panel px-4 py-4 text-left text-sm transition-colors hover:bg-secondary"
            >
              <span className="block font-medium">{s.label}</span>
              <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                {s.url.replace("https://", "")}
              </span>
            </button>
          ))}
        </div>
      </section>
    </PortalChrome>
  );
}
