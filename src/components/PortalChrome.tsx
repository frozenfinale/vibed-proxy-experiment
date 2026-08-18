import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Browse" },
  { to: "/bookmarks", label: "Bookmarks" },
  { to: "/settings", label: "Settings" },
] as const;

export function PortalChrome({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-block h-6 w-6 rounded-md" style={{ backgroundImage: "var(--gradient-aurora)" }} />
            <span className="font-display text-base font-semibold tracking-tight">Tundra</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "rounded-lg px-3 py-1.5 bg-secondary text-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-muted-foreground">
        Tundra Network routes pages through a rewriting server proxy. Use it responsibly and only where permitted.
      </footer>
    </div>
  );
}
