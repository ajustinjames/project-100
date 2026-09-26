# Cloudflare Conventions

Project 100 runs on the free Cloudflare plan. **Nothing is provisioned yet.** This document defines the conventions that deployment will follow, so the first app to need a deploy can set it up without re-deciding the shape.

Check current free-plan limits in the Cloudflare docs before relying on them. At the time of writing, one account on the free Workers plan allows a limited number of Worker scripts (100), and static asset requests are free. That limit is why apps do **not** each get their own Worker by default.

## Deployment model

**One site, one deployment, path-based routing.**

A single static Cloudflare project named `project-100`, with no server code, serves everything from **`hundred.ajustinjames.com`**:

| Path | Content | Indexed |
|---|---|---|
| `/` | Public directory and counter (future) | yes |
| `/<slug>/` | Live app | yes |
| `/labs/` | Hidden Labs index (future) | no |
| `/labs/<slug>/` | Labs app | no |
| `/robots.txt`, `/sitemap.xml` | Generated from the registry | n/a |

### Deploys: Cloudflare Git integration

Cloudflare builds and deploys straight from this GitHub repository (dashboard Git integration, the same setup as `ajustinjames-v2`). There is no deploy workflow, no Wrangler management, and no Cloudflare credentials in GitHub or anywhere agents can reach.

- **Production:** every push to `main` deploys to `hundred.ajustinjames.com`. Branch protection requires CI before merge, so `main` is always green.
- **Previews:** every other branch gets a preview URL. Use it to check Labs work and PRs before merge.
- **Rollback:** one click in the Cloudflare dashboard.
- **Build settings** live in the dashboard and are kept trivial: one command, one output folder (see [OWNER_RUNBOOK.md](OWNER_RUNBOOK.md#cloudflare-domain-and-deploy)). Everything else is in the repo.

The build (to be implemented with the first deploy) is one root script, `pnpm build:site`:

1. It builds each app to `apps/<slug>/dist/`. The Vite plugin has already set the right base path from `app.json`.
2. A small `scripts/assemble-site.ts` copies each `labs` and `live` app's `dist/` to its path, and writes `sitemap.xml`, `robots.txt`, and `_headers` using `@project-100/web`.

If the Cloudflare project type needs a minimal `wrangler.jsonc` (a name and an assets directory), it is a static file committed to the repo, not something agents run.

Preview URLs must not be indexed. On the first deploy, check whether Cloudflare adds `X-Robots-Tag: noindex` to previews itself. If not, `build:site` adds it to `_headers` for non-production builds.

### Smoke tests

Agents smoke-test with the Playwright CLI: against the PR's preview URL before merging, and against `hundred.ajustinjames.com` after a production deploy. They check that pages load without console errors or failed requests and that the core flow works. See issue #2.

Archived apps are left out of the assembled site, except during the local-data grace period described in [LIFECYCLE.md](LIFECYCLE.md#archiving).

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

- The `project100()` Vite plugin injects the beacon into **live** apps with `"analytics": "standard"`, and only when `P100_CF_ANALYTICS_TOKEN` is set at build time. Local builds and Labs get no beacon.
- The token is visible in page source by design, but is still kept out of git.
- Don't also enable Cloudflare's automatic beacon injection for the same site, or visits are counted twice.

## Robots, indexing, and sitemap

- `sitemap.xml` lists the home page and live apps only (`renderSitemap`).
- `robots.txt` allows everything and points to the sitemap. It doesn't mention `/labs/`, which would advertise it and stop crawlers from seeing the noindex (`renderRobots`).
- Labs pages carry `<meta name="robots" content="noindex, nofollow">`. The assembled `_headers` file should also send `X-Robots-Tag: noindex` for `/labs/*`.

## Labs

- Labs apps are served under `/labs/<slug>/` and are never linked from public pages.
- The Labs index (`/labs/`, noindex) will be reachable from the home page only through a deliberate easter egg (for example, typing a key sequence). The exact mechanism is decided when the home page is built.
- During development, run any app locally with `pnpm --filter @project-100/app-<slug> dev`.

## Security headers (to add with site assembly)

Start from a strict baseline in `_headers`, and loosen per app only with a documented reason:

- `Content-Security-Policy` allowing only `'self'` plus `static.cloudflareinsights.com` (beacon) and `cloudflareinsights.com` (reporting)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` denying unused powerful features
