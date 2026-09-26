# Dependencies

Every dependency is code that someone must understand, update, and trust for years. Add them deliberately.

## Order of preference

1. Browser and platform APIs
2. Code already in this repository
3. Shared packages (`@project-100/*`) and `ajj-design`
4. Mature, actively maintained, widely used libraries

Don't install a package for something that a small amount of clear code can do: a debounce, a date format, a UUID (`crypto.randomUUID()`), deep clone (`structuredClone`), or a class-name joiner. Do use an established library when the problem is really hard: parsing complex formats, cryptography, rich text editing, charting, or date/time-zone arithmetic.

## Criteria for a new dependency

Before adding one, confirm:

- **Needed:** the problem is genuinely hard, or the library is substantially better than a few dozen lines of our own code.
- **Healthy:** it is actively maintained, widely used, and has a responsive security history.
- **Light:** few transitive dependencies, reasonable bundle size, and tree-shakeable if it is big.
- **Licensed:** MIT, Apache-2.0, BSD, ISC, or similar permissive licenses. Anything else needs review.
- **Stable:** no install scripts unless unavoidable. pnpm blocks them by default, and allowing one is a deliberate decision.
- **Non-overlapping:** it doesn't duplicate something already in the repo (for example, a second icon set, date library, or UI framework).

Anything the browser bundle imports belongs in `dependencies` (not `devDependencies`), so the registry's dependency list stays true. Reviewers check this.

Record each third-party runtime dependency and its reason in the app's `APP.md`. `pnpm p100 validate` ensures `app.json` `dependencies` matches `package.json`.

## Baseline dependencies

| Package | Where | Why |
|---|---|---|
| `typescript` | root (dev) | Type checking. |
| `@biomejs/biome` | root (dev) | Lint and format in one tool, instead of ESLint + Prettier + plugins. |
| `vitest` | root (dev) | Fast tests that understand TypeScript natively and share Vite's config model. |
| `@types/node` | root (dev) | Types for scripts. Version tracks the Node major in `.node-version`. |
| `vite` | apps and `@project-100/web` (dev) | Builds static apps with minimal configuration. |
| `@ajustinjames/<system>-tokens`, `@ajustinjames/<system>-components` | apps | `ajj-design`, required. It brings in `lit`. |

Nothing else is installed. Add DOM test environments, icon libraries, fonts, or frameworks when an app actually needs them.

## Icons and fonts

- **Icons:** when the first app needs icons, choose **one** established, permissively licensed icon library for the whole project, record the choice here, and use it everywhere. Adding a second icon library needs a written justification.
- **Fonts:** self-host fonts from permissively licensed packages (e.g. Fontsource) rather than loading them from third-party CDNs. See [PRIVACY_AND_DATA.md](PRIVACY_AND_DATA.md#third-party-requests).

## External APIs

Third-party APIs need owner approval (`external-api`) before becoming a meaningful dependency, and should be rare. External AI APIs are unavailable by default. No app's normal operation may depend on paid AI inference without separate approval.

The approval request must document:

- why the API is needed
- the alternatives considered, including doing without it
- expected usage (requests per day or month)
- free-tier limits and what happens when they are exceeded
- privacy implications (what user data is sent)
- reliability risk
- **what happens if the service disappears**, and how the app degrades

Calls to external APIs should go through a Worker only when needed to protect a key or to cache. Never ship an API key to the browser.

## Updates

- **Dependabot** opens weekly grouped PRs for npm (minor and patch grouped; majors separate) and monthly PRs for GitHub Actions. It waits 7 days after a release before proposing it.
- **pnpm** refuses to install versions published less than 24 hours ago (`minimumReleaseAge` in `pnpm-workspace.yaml`).
- **pnpm stays on a major version that Dependabot supports** (currently 10). Newer pnpm majors change the lockfile format, and Dependabot can't update what it can't parse. Check GitHub's supported-ecosystems list before upgrading pnpm.
- Every update goes through CI (`pnpm verify`). Nothing auto-merges.
- The Maintainer reviews major updates for breaking changes, fixes breakage in the same PR, and doesn't merge red PRs.
- Keep the lockfile committed. CI installs with `--frozen-lockfile`.
