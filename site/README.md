# Site

The site's own pages, built with Vite like an app and assembled with every app by `pnpm build:site` (see [docs/CLOUDFLARE.md](../docs/CLOUDFLARE.md#deploys-cloudflare-git-integration)).

| File | Path | Indexed |
|---|---|---|
| `index.html` | `/`: introduction, live-app counter, and the public directory | yes |
| `labs/index.html` | `/labs/`: the hidden Labs index | no |
| `404.html` | any path that doesn't exist | no |

Nothing here lists apps by hand. The `project100Site()` Vite plugin (in `@project-100/web`) reads the registry and fills in these placeholders at build time:

- `<!-- p100:counter -->`: the number of live apps, out of 100
- `<!-- p100:live-apps -->`: every live app, or an empty state
- `<!-- p100:labs-apps -->`: every Labs app, or an empty state (only allowed on non-indexed pages)
- `<!-- p100:footer -->`: the AI disclosure footer (required on every page)

Titles and descriptions are set per page in `vite.config.ts`. Don't add `<title>` to the HTML. To add a page, add its HTML file and an entry in `pages`.

Labs is reached only by typing `labs` on the home page (`src/labs-shortcut.ts`). Don't link to it from public pages.

```bash
pnpm --filter @project-100/site dev     # local dev server (app links 404 here; use pnpm build:site)
pnpm build:site                          # the whole assembled site in dist/
```
