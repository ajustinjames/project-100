# Project 100

An experiment in autonomous software: AI originates, researches, scopes, designs, builds, reviews, maintains, and archives small, useful web applications, with a human owner providing approvals and oversight.

**Goal: 100 applications live and maintained at the same time.** Archived apps don't count, and archiving frees a slot.

**Status:** bootstrapped. No applications yet. Run `pnpm p100 status` for the live count.

## How it works

```
idea → screen (most ideas die here) → candidate → Labs (hidden prototype) → owner approval → live → … → archived
```

- **AI** does roughly 90% of the work: ideas, research, design, code, tests, review, maintenance, and archive recommendations.
- **The project owner** approves launches and archives, and anything involving external APIs, costs, personal data, accounts, user content, or sensitive subjects.
- Every app uses the [`ajj-design`](https://github.com/ajustinjames/ajj-design) design system, runs on free Cloudflare infrastructure, and discloses in its footer that it is built primarily by AI under human oversight.

## Repository

```
apps/          Applications (Labs, live, archived), one directory each
candidates/    Proposed and rejected ideas
packages/      Shared packages: registry (app metadata), web (SEO, disclosure, analytics, site assembly rules)
site/          The home page and directory, the hidden Labs index, and 404
scripts/       The `pnpm p100` CLI and site assembly
templates/     App and proposal templates
docs/          Policy and conventions
```

## Getting started

Requires Node 24+ and pnpm.

```bash
pnpm install
pnpm verify          # lint, typecheck, test, validate registry, build: same as CI
pnpm build:site      # build everything and assemble the deployable site into dist/
pnpm p100 status     # Project 100 counter
pnpm p100 list       # every registered candidate and app
pnpm p100 candidate <slug> "<Name>"   # record a screened idea
pnpm p100 promote <slug>              # turn a candidate into a Labs app
```

## Documentation

| Document | Covers |
|---|---|
| [Project Charter](docs/PROJECT_CHARTER.md) | Mission, principles, and hard rules (canonical) |
| [App Acceptance](docs/APP_ACCEPTANCE.md) | The idea-to-Labs workflow (generate, screen, research, critique, promote), launch readiness, and the launch packet |
| [AI Roles](docs/AI_ROLES.md) | Roles, decision rights, escalation, disagreements, and getting unstuck |
| [Lifecycle](docs/LIFECYCLE.md) | Statuses, transitions, Labs, launching, archiving, and revival |
| [Architecture](docs/ARCHITECTURE.md) | Repository layout, toolchain, app anatomy, `app.json`, registry, and SEO |
| [Cloudflare](docs/CLOUDFLARE.md) | Deployment model, routing, bindings, env vars, analytics, robots, and sitemap |
| [Privacy and Data](docs/PRIVACY_AND_DATA.md) | Data classes, accounts, user content, analytics, and browser storage |
| [Dependencies](docs/DEPENDENCIES.md) | Dependency policy, external APIs, and updates |
| [Design and Assets](docs/DESIGN_AND_ASSETS.md) | `ajj-design` usage and the media asset policy |
| [Monetization](docs/MONETIZATION.md) | Rules for ads and revenue |
| [Owner Runbook](docs/OWNER_RUNBOOK.md) | One-time GitHub and Cloudflare setup for the owner |

Agent instructions: [AGENTS.md](AGENTS.md).

## Contributing

This is public source, but for now only the project owner contributes. External pull requests aren't expected. Report security issues as described in [SECURITY.md](SECURITY.md).

## License

[Apache-2.0](LICENSE)
