import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PortalChrome } from "@/components/PortalChrome";
import { useBookmarks } from "@/lib/portal-store";
import { prettyHost } from "@/lib/proxy-url";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks — Tundra Network" },
      { name: "description", content: "Your saved proxied sites, stored locally in this browser." },
      { property: "og:title", content: "Bookmarks — Tundra Network" },
      { property: "og:description", content: "Your saved proxied sites, stored locally in this browser." },
    ],
  }),
  component: Bookmarks,
});

function Bookmarks() {
  const { items, remove } = useBookmarks();
  const navigate = useNavigate();

  return (
    <PortalChrome>
      <section className="mx-auto max-w-3xl px-4 pb-16 pt-10">
        <h1 className="text-3xl font-semibold">Bookmarks</h1>
        <p className="mt-2 text-sm text-muted-foreground">Saved on this device only — nothing leaves your browser.</p>

        {items.length === 0 ? (
          <div className="panel mt-8 px-6 py-12 text-center text-sm text-muted-foreground">
            No bookmarks yet. Star a page while browsing to keep it here.
          </div>
        ) : (
          <ul className="mt-8 space-y-2">
            {items.map((b) => (
              <li key={b.url} className="panel flex items-center gap-3 px-4 py-3">
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => void navigate({ to: "/browse", search: { url: b.url } })}
                >
                  <span className="block truncate text-sm font-medium">{b.title || prettyHost(b.url)}</span>
                  <span className="block truncate font-mono text-xs text-muted-foreground">{b.url}</span>
                </button>
                <button
                  onClick={() => remove(b.url)}
                  className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-destructive"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PortalChrome>
  );
}
