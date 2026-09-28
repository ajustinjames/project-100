# Cloudflare Conventions

Project 100 runs on the free Cloudflare plan. The only resource is the Workers Builds project `project-100`, connected to this repository, which builds with `pnpm build:site`. The custom domain and Web Analytics are owner setup ([OWNER_RUNBOOK.md](OWNER_RUNBOOK.md#cloudflare-domain-and-deploy)). This document defines the conventions deployment follows.

Check current free-plan limits in the Cloudflare docs before relying on them. At the time of writing, one account on the free Workers plan allows a limited number of Worker scripts (100), and static asset requests are free. That limit is why apps do **not** each get their own Worker by default.

## Deployment model

**One site, one deployment, path-based routing.**

A single static Cloudflare Worker named `project-100` (static assets only, no server code) serves everything from **`hundred.ajustinjames.com`**:

| Path | Content | Indexed |
|---|---|---|
| `/` | Home page: introduction, live-app counter, and directory (`site/index.html`) | yes |
| `/<slug>/` | Live app, or an archived app during its grace period, then its tombstone | live only |
| `/labs/` | Hidden Labs index (`site/labs/index.html`) | no |
| `/labs/<slug>/` | Labs app | no |
| any missing path | `404.html` (`site/404.html`) | no |
| `/robots.txt`, `/sitemap.xml`, `/_headers` | Generated from the registry and `@project-100/web` | n/a |

Candidates, rejected apps, archived apps without user data, and the app template are never published. `publications()` in `packages/web/src/publish.ts` is the single rule for this.

### Deploys: Cloudflare Git integration

Cloudflare builds and deploys straight from this GitHub repository (dashboard Git integration, the same setup as `ajustinjames-v2`). There is no deploy workflow, no Wrangler management, and no Cloudflare credentials in GitHub or anywhere agents can reach.

- **Production:** every push to `main` deploys to `hundred.ajustinjames.com`. Branch protection requires CI before merge, so `main` is always green.
- **Previews:** every other branch gets a preview URL. Use it to check Labs work and PRs before merge.
- **Rollback:** one click in the Cloudflare dashboard.
- **Build settings** live in the dashboard and are kept trivial. Everything else is in the repo:

  | Setting | Value |
  |---|---|
  | Root directory | `/` (the repository root, where `wrangler.jsonc` and `pnpm-workspace.yaml` are) |
  | Build command | `pnpm build:site` |
  | Deploy command | `npx wrangler deploy` (the default) |
  | Non-production branch deploy command | `npx wrangler preview` (the default), which creates a Preview on the preview domain (`<branch>.hundred.dev.ajustinjames.com`, see below) |
  | Preview domain | `hundred.dev.ajustinjames.com` |
  | Production branch | `main` |

  The output folder, `dist`, is set in the committed [`wrangler.jsonc`](../wrangler.jsonc), not the dashboard.

The build is one root script, `pnpm build:site`:

1. `pnpm build` builds every workspace package: each app to `apps/<slug>/dist/` (the Vite plugin sets the base path from `app.json`), and the site's own pages to `site/dist/` (the `project100Site()` plugin fills in the counter and app lists from the registry).
2. `scripts/assemble-site.ts` validates the registry and assembles a fresh `dist/`: `site/dist/` at the root, then each published app's `dist/` at its path (`publications()`), then `sitemap.xml`, `robots.txt`, and `_headers` from `@project-100/web`. Before writing anything, it checks every page it will publish with the same checks as `pnpm p100 check-builds`, and fails if an app or a site page (`index.html`, `labs/index.html`, `404.html`) is missing. It writes to `dist.staging/` and replaces `dist/` only when everything succeeded, so nothing stale survives and a failed build never leaves a partial `dist/`. `pnpm verify` runs it, so CI exercises the assembly on every PR.

The project is a Workers Builds project, so the root [`wrangler.jsonc`](../wrangler.jsonc) is required. Without it, `wrangler deploy` tries to detect the app automatically and fails at a pnpm workspace root. It is minimal and static: the Worker name, a compatibility date, `assets.directory: "./dist"`, `not_found_handling: "404-page"` (unknown paths get `404.html` with status 404), and an empty `previews` block (required by `wrangler preview`; previews use the same top-level settings), and `workers_dev: false` plus `preview_urls: false`. Production builds include the analytics beacon, so they must be served only at `hundred.ajustinjames.com`, never at a `workers.dev` alias or version URL. It has no Worker code and no bindings. Changing it is owner-gated ([AI_ROLES.md](AI_ROLES.md#merging)). To check it locally without credentials, run `pnpm build:site`, then `npx wrangler deploy --dry-run` or `npx wrangler dev` (which applies `_headers` and 404 handling the way Cloudflare does).

Preview URLs must not be indexed. Branch previews are served at `<branch>.hundred.dev.ajustinjames.com` (and per-commit `<id>.hundred.dev.ajustinjames.com`), the preview domain set in the Cloudflare dashboard, which is also behind a Cloudflare challenge. `_headers` sends `X-Robots-Tag: noindex` for that domain and for every Cloudflare-hosted hostname (`*.pages.dev`, `*.<project>.pages.dev`, and `*.*.workers.dev`), whether or not Cloudflare adds the header itself. If the preview domain changes, update `PREVIEW_URL_PATTERNS` in `packages/web/src/headers.ts`. The custom domain never matches these rules, so production is never noindexed by mistake. Confirm it on the first preview ([OWNER_RUNBOOK.md](OWNER_RUNBOOK.md#cloudflare-domain-and-deploy)).

### Smoke tests

Agents smoke-test with the Playwright CLI: against the PR's preview URL before merging, and against `hundred.ajustinjames.com` after a production deploy. They check that pages load without console errors or failed requests and that the core flow works. See issue #2.

Archived apps are left out of the assembled site, except for apps that may keep user data in the browser (`privacy` other than `none`). Those keep being served at `/<slug>/` for 90 days after `dates.archived`, then get a tombstone page there. See [LIFECYCLE.md](LIFECYCLE.md#archiving). The site is rebuilt only when `main` changes, so the switch happens on the first deploy after the grace period ends.

**Why one origin:** it's the smallest setup, uses one project, needs one domain and one deploy, and has no per-app DNS or certificates. **The cost:** every app shares one browser origin, so apps share storage space and one app's XSS bug could read another app's local data. Mitigations are in [PRIVACY_AND_DATA.md](PRIVACY_AND_DATA.md#browser-storage).

## Domain

`hundred.ajustinjames.com` is a custom domain on the existing `ajustinjames.com` Cloudflare zone. The one-time setup is owner work: see [OWNER_RUNBOOK.md](OWNER_RUNBOOK.md#cloudflare-domain-and-deploy).

**Why paths instead of per-app subdomains:** Cloudflare's free Universal SSL covers `*.ajustinjames.com`, one level deep. A wildcard like `*.hundred.ajustinjames.com` needs a paid certificate product, so per-app subdomains would cost money or need per-app setup.

## Apps that need server code

Only when an app proves it needs server-side logic:

- It gets its own Worker named `p100-<slug>`, configured by `apps/<slug>/wrangler.jsonc`, with its code in `apps/<slug>/worker/`. Deploy it the same way, through a Git-connected Cloudflare project rooted at `apps/<slug>/`, so agents never need Cloudflare credentials.
- It is routed on the same zone at `/<slug>/api/*` (or `/labs/<slug>/api/*` while in Labs).
- Its `APP.md` explains why client-side code was not enough.
- The app's `PRIVACY.md` must cover whatever the Worker receives.

## Bindings and resources

- Add a binding (KV, D1, R2, Durable Objects, Queues, and so on) only when the app needs it, never "for later".
- Resource names: `p100-<slug>-<purpose>` (e.g. `p100-tide-table-cache`).
- Binding names: `SCREAMING_SNAKE_CASE`, describing purpose (`CACHE`, `DB`).
- Declare everything in the app's `wrangler.jsonc`. No dashboard-only configuration.
- Anything beyond modest free-plan usage of these services needs `infrastructure` approval. Anything that costs money needs `recurring-cost` approval.

## Environment variables and secrets

| Kind | Where | Example |
|---|---|---|
| Build-time project config | Cloudflare project build variables (dashboard), read in Node code | `P100_CF_ANALYTICS_TOKEN` |
| Client-side config | `VITE_*` env vars. **Always public:** they are compiled into the bundle | `VITE_FEATURE_X` |
| Worker secrets (only if an app has a Worker) | Set by the owner in the Cloudflare dashboard; locally in git-ignored `.dev.vars` | `SOME_API_KEY` |

Never commit secrets. Never put secrets in `VITE_*` variables. There are no deploy credentials: Cloudflare pulls from GitHub.

## Analytics

Project standard: **Cloudflare Web Analytics** (no cookies, no cross-site tracking).

- The `project100()` Vite plugin injects the beacon into **live** apps with `"analytics": "standard"`, and only when `P100_CF_ANALYTICS_TOKEN` is set at build time. The `project100Site()` plugin does the same for the home page only. Local builds, previews (the token is production-only), Labs, the Labs index, 404, and archived apps get no beacon.
- The token is visible in page source by design, but is still kept out of git.
- Don't also enable Cloudflare's automatic beacon injection for the same site, or visits are counted twice.

## Robots, indexing, and sitemap

- `sitemap.xml` lists the home page and live apps only (`renderSitemap`), generated by `pnpm build:site`.
- `robots.txt` allows everything and points to the sitemap. It doesn't mention `/labs/`, which would advertise it and stop crawlers from seeing the noindex (`renderRobots`).
- Labs pages, the Labs index, 404, archived apps, and tombstones carry `<meta name="robots" content="noindex, nofollow">`. The assembled `_headers` file also sends `X-Robots-Tag: noindex` for `/labs/*` and for every Cloudflare preview hostname.

## Labs

- Labs apps are served under `/labs/<slug>/` and are never linked from public pages.
- The Labs index (`/labs/`, noindex, no analytics) lists every `labs` app from the registry. It is reachable from the home page only by typing `labs` on the keyboard (`site/src/labs-shortcut.ts`), or by entering the URL. It is not in the sitemap, robots.txt, or any public link.
- During development, run any app locally with `pnpm --filter @project-100/app-<slug> dev`.

## Security headers

`_headers` (generated by `renderHeaders()` in `packages/web/src/headers.ts`) sends a strict baseline on every response. Changing it is owner-gated ([AI_ROLES.md](AI_ROLES.md#merging)). Loosen it only with a documented reason, here and in the code:

- `Content-Security-Policy` allowing only `'self'` plus `static.cloudflareinsights.com` (beacon script) and `cloudflareinsights.com` (reporting). Two documented exceptions:
  - `img-src data:`, for the empty favicon (`data:,`) every app uses until the owner provides one
  - `style-src-attr 'unsafe-inline'`: `ajj-design` components render inline `style="..."` attributes in their templates (for example `hl-btn`), which a strict policy blocks. Only style attributes are allowed. `<style>` elements, inline scripts, and `eval` stay blocked. If `ajj-design` stops using style attributes, remove this.
- Not allowed, pending an owner decision: the `ajustinjames.com` zone injects Cloudflare's Bot Management "JavaScript detections" inline script. It only works with per-response CSP nonces, which a static site can't produce (a fixed nonce in `_headers` would be public and about as weak as `'unsafe-inline'`). So the CSP blocks it, which logs one CSP console error per page and means detections don't run on this site. Smoke tests ignore that one error until the owner turns detections off for the zone or accepts this.
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` denying unused powerful features (camera, microphone, geolocation, sensors, payment, USB). An app that needs one removes it with a reason.
