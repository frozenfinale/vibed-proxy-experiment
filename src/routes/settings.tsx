import { createFileRoute } from "@tanstack/react-router";

import { PortalChrome } from "@/components/PortalChrome";
import { SEARCH_ENGINES, useSettings } from "@/lib/portal-store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Tundra Network" },
      {
        name: "description",
        content: "Choose your search engine, set a cloaked tab title and icon, and enable about:blank launching.",
      },
      { property: "og:title", content: "Settings — Tundra Network" },
      { property: "og:description", content: "Search engine, tab cloaking and about:blank launch options." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { value, update } = useSettings();

  function openInAboutBlank() {
    const win = window.open("about:blank", "_blank");
    if (!win) return;
    const frame = win.document.createElement("iframe");
    frame.style.cssText = "position:fixed;inset:0;border:none;width:100%;height:100%";
    frame.src = window.location.origin;
    win.document.body.style.margin = "0";
    win.document.body.appendChild(frame);
    if (value.cloakTitle) win.document.title = value.cloakTitle;
  }

  return (
    <PortalChrome>
      <section className="mx-auto max-w-3xl space-y-6 px-4 pb-16 pt-10">
        <div>
          <h1 className="text-3xl font-semibold">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Stored locally in this browser.</p>
        </div>

        <div className="panel space-y-3 p-5">
          <h2 className="text-sm font-semibold">Search engine</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {SEARCH_ENGINES.map((engine) => (
              <button
                key={engine.template}
                onClick={() => update({ ...value, searchEngine: engine.template })}
                className={`rounded-lg border px-4 py-2.5 text-left text-sm ${
                  value.searchEngine === engine.template
                    ? "border-primary bg-secondary"
                    : "border-border bg-card hover:bg-secondary"
                }`}
              >
                {engine.label}
              </button>
            ))}
          </div>
        </div>

        <div className="panel space-y-4 p-5">
          <h2 className="text-sm font-semibold">Tab cloak</h2>
          <label className="block text-xs text-muted-foreground">
            Tab title
            <input
              value={value.cloakTitle}
              onChange={(e) => update({ ...value, cloakTitle: e.target.value })}
              placeholder="Google Classroom"
              className="mt-1 w-full rounded-lg bg-input px-3 py-2 text-sm text-foreground outline-none"
            />
          </label>
          <label className="block text-xs text-muted-foreground">
            Favicon URL
            <input
              value={value.cloakIcon}
              onChange={(e) => update({ ...value, cloakIcon: e.target.value })}
              placeholder="https://ssl.gstatic.com/classroom/favicon.png"
              className="mt-1 w-full rounded-lg bg-input px-3 py-2 font-mono text-xs text-foreground outline-none"
            />
          </label>
        </div>

        <div className="panel flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-sm font-semibold">about:blank launch</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Opens the portal inside a blank tab so history stays clean.
            </p>
          </div>
          <button
            onClick={openInAboutBlank}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Open now
          </button>
        </div>
      </section>
    </PortalChrome>
  );
}
