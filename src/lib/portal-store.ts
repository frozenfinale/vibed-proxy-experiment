import { useCallback, useEffect, useState } from "react";

export type Bookmark = { url: string; title: string };

export type PortalSettings = {
  searchEngine: string;
  cloakTitle: string;
  cloakIcon: string;
  openAboutBlank: boolean;
};

export const SEARCH_ENGINES: { label: string; template: string }[] = [
  { label: "DuckDuckGo", template: "https://duckduckgo.com/?q=%s" },
  { label: "Bing", template: "https://www.bing.com/search?q=%s" },
  { label: "Google", template: "https://www.google.com/search?q=%s" },
  { label: "Wikipedia", template: "https://en.wikipedia.org/w/index.php?search=%s" },
];

export const DEFAULT_SETTINGS: PortalSettings = {
  searchEngine: SEARCH_ENGINES[0]!.template,
  cloakTitle: "",
  cloakIcon: "",
  openAboutBlank: false,
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...(fallback as object), ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useLocalState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValue(read<T>(key, fallback));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
    },
    [key],
  );

  return { value, update, hydrated };
}

export function useSettings() {
  return useLocalState<PortalSettings>("tundra.settings", DEFAULT_SETTINGS);
}

export function useBookmarks() {
  const [items, setItems] = useState<Bookmark[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("tundra.bookmarks");
      if (raw) setItems(JSON.parse(raw) as Bookmark[]);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: Bookmark[]) => {
    setItems(next);
    try {
      window.localStorage.setItem("tundra.bookmarks", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  return {
    items,
    add: (b: Bookmark) => persist([b, ...items.filter((i) => i.url !== b.url)].slice(0, 50)),
    remove: (url: string) => persist(items.filter((i) => i.url !== url)),
  };
}
