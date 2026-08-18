# Use SearXNG (priv.au) as default search engine

## What we'll do
1. Add SearXNG to the search engine list in `src/lib/portal-store.ts` using `https://priv.au/search?q=%s`.
2. Make SearXNG the default selected engine in `DEFAULT_SETTINGS`.
3. Verify the settings page still shows the engine selected and the home search bar uses it.

## Files changed
- `src/lib/portal-store.ts`
