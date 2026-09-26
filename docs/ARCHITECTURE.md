# Architecture

The repository is designed to stay understandable to a much weaker model years from now. When in doubt, choose the boring option.

## Repository layout

```
apps/<slug>/            One directory per app that has reached Labs (labs, live, archived, discarded)
candidates/<slug>/      Recorded candidates and rejected candidates (app.json + PROPOSAL.md)
packages/registry/      @project-100/registry: app.json schema, loading, validation
packages/web/           @project-100/web: head tags, disclosure footer, sitemap/robots, Vite plugin
scripts/p100.ts         The `pnpm p100` CLI (validate, status, list, candidate, promote)
templates/app/          Starting point for new apps (built in CI so it cannot rot)
templates/candidate/    PROPOSAL.md template
docs/                   Canonical policy and conventions
```

## Toolchain

| Tool | Why |
|---|---|
| **pnpm workspaces** | One lockfile, strict dependency isolation, and the same tool `ajj-design` uses. |
| **Node 24** | Runs TypeScript scripts directly (`node scripts/p100.ts`) through built-in type stripping, with no build step and no `tsx`. |
| **TypeScript** (strict, `erasableSyntaxOnly`) | Types without runtime magic. Packages ship `.ts` source; nothing in `packages/` is compiled. |
| **Biome** | One tool and one config for linting and formatting. |
| **Vitest** | Tests for scripts, packages, and apps from the root: `pnpm test`. |
| **Vite** | Builds each app to static files. |

Root commands: `pnpm check`, `pnpm fix`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm verify` (everything CI runs).

`erasableSyntaxOnly` means no `enum`, `namespace`, or constructor parameter properties. Use `as const` arrays and union types instead (see `packages/registry/src/schema.ts`).

## Anatomy of an app

Created by `pnpm p100 promote <slug>` from `templates/app/`:

```
apps/<slug>/
  app.json        Registry metadata (see below)
  README.md       Developer notes
  APP.md          Problem, scope, decisions, architecture, dependencies, assets, tradeoffs, launch packet
  PRIVACY.md      Data behavior, always explicit
  RETRO.md        Retrospective (incomplete until warranted)
  PROPOSAL.md     The original candidate proposal (history)
  package.json    @project-100/app-<slug>
  index.html      No <title> (generated); must contain <!-- p100:footer -->
  vite.config.ts  plugins: [project100()]
  src/            Code and *.test.ts
```

### Default app stack

- A static site built by Vite, written in plain TypeScript, HTML, and CSS.
- `ajj-design` Web Components and tokens for UI foundations (see [DESIGN_AND_ASSETS.md](DESIGN_AND_ASSETS.md)).
- Lit is acceptable for an app's own components, since it is already an `ajj-design` dependency.
- Browser storage (`localStorage` or IndexedDB) for persistence, with keys namespaced as described in [PRIVACY_AND_DATA.md](PRIVACY_AND_DATA.md#browser-storage).

Heavier choices (a UI framework such as Preact, React, or Svelte; a router; a state library; server code) are allowed when the problem needs them. Justify them in `APP.md`. Don't mix frameworks within one app.

## app.json

The single source of truth for an app's metadata. Types are in `packages/registry/src/schema.ts`, and rules are in `validate.ts`.

| Field | Meaning |
|---|---|
| `schemaVersion` | Always `1` for now. |
| `id` | Permanent number assigned when entering Labs; `null` for candidates. |
| `slug` | Lowercase kebab-case; equals the directory name and the URL path. |
| `name` | Display name. |
| `status` | `candidate`, `rejected`, `labs`, `live`, or `archived`. This is also the Labs/live state. |
| `description` | One public sentence; used for the meta description and the directory. |
| `problem` | The problem statement. |
| `category` | Free-form kebab-case, e.g. `productivity`. |
| `dates` | `created`, `launched`, and `archived` (YYYY-MM-DD or `null`). |
| `design.system` | The `ajj-design` system used (`hardline`, `glassline`, …). |
| `dependencies` | Third-party runtime dependencies. Must match `package.json`. |
| `sharedPackages` | `@project-100/*` packages used. Must match `package.json`. |
| `privacy` | `none`, `local-only`, `server-anonymous`, or `personal-data` (see [PRIVACY_AND_DATA.md](PRIVACY_AND_DATA.md)). |
| `analytics` | `none`, `standard`, or `custom`. |
| `monetization.eligible` | Only ever `true` for live apps. |
| `approvals` | Owner approvals: `{ kind, date, ref }`, where `ref` links to the approval. |
| `rejection` | `{ date, reason }` when rejected, otherwise `null`. |

Derived values are not stored: the URL path comes from `status` + `slug`, and the counter comes from counting statuses.

## Registry

There is no separate registry file. The registry is the set of all `apps/*/app.json` and `candidates/*/app.json` files, loaded by `loadRegistry()` in `@project-100/registry`. The same loader will power the public directory, the counter, sitemaps, and audits once those exist.

CI runs three registry checks:

- **`pnpm p100 validate`** checks each snapshot: shape, lifecycle rules, required approvals (linked to this repository), completed retrospectives, unique ids and slugs, the 100-live cap, and that `app.json` agrees with `package.json`. Labs and live apps must also use `@project-100/web` and have `build` and `typecheck` scripts.
- **`pnpm p100 check-builds`** checks every built page of every Labs and live app (and the template) for the title, disclosure footer, and noindex/no-analytics on non-live pages. It checks the output, so it holds however the page was built.
- **`pnpm p100 check-changes <base>`** compares a PR with `main`: history is preserved and transitions are legal, and it flags owner-merged changes ([AI_ROLES.md](AI_ROLES.md#merging)).

## @project-100/web

Project-wide web standards that every app must follow, so they live in one place instead of 100:

- `project100()` Vite plugin: sets `base` to `/<slug>/` (live) or `/labs/<slug>/` (everything else), injects head tags, and replaces `<!-- p100:footer -->` with the disclosure footer. The build fails if the placeholder is missing or the page hard-codes a `<title>`. In multi-page apps, each page gets its own canonical URL but shares the app's title and description. Add per-page metadata when an app needs it.
- `renderHead`, `renderFooter`, `renderSitemap`, and `renderRobots`: pure functions, unit-tested.
- `site.ts`: site constants, including `SITE_ORIGIN` (`https://hundred.ajustinjames.com`).

## SEO

Handled by `@project-100/web`, driven by `app.json`:

- `<title>` and meta description come from `name` and `description`.
- Live pages get a canonical URL and Open Graph tags. No `og:image` (no generated images).
- Every non-live page gets `noindex, nofollow`.
- The sitemap lists only live apps. `robots.txt` doesn't mention Labs.
- Add structured data (JSON-LD) only when it is genuinely accurate and useful for a specific app.

## Shared packages

Create a shared package when **two or more** apps need the same non-design capability, not before. Required project-wide standards (like `@project-100/web`) are the exception. Design capabilities go to `ajj-design` instead (see [DESIGN_AND_ASSETS.md](DESIGN_AND_ASSETS.md)).

A shared package is `packages/<name>/` with `package.json` named `@project-100/<name>`, `"private": true`, source exported directly from `src/index.ts`, and tests next to the code. Keep them small and dependency-free where possible.

## Testing

- Pure logic gets Vitest unit tests (`*.test.ts` next to the code).
- Add DOM tests only when they earn their keep. Set `// @vitest-environment happy-dom` per file and add the dependency then, not before.
- CI runs `pnpm verify` on every PR, including Dependabot PRs.

## Not built yet (deliberately)

These wait for a real need. See [CLOUDFLARE.md](CLOUDFLARE.md) for the planned shape.

- The public directory, home page, and Labs index
- Site assembly (combining app `dist/` folders into one deploy) and deployment workflow
- Wrangler configuration and any Cloudflare resources
- Shared storage, testing, or accessibility helpers
