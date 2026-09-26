# AGENTS.md

Instructions for AI coding agents (Codex, Claude Code, and others) working in this repository.

Project 100 aims to have 100 useful web apps live at the same time, conceived, built, and maintained primarily by AI under owner oversight. Policy lives in `docs/`. This file only points to it.

## Read before working

- Always: [docs/PROJECT_CHARTER.md](docs/PROJECT_CHARTER.md) and [docs/AI_ROLES.md](docs/AI_ROLES.md) (decision rights and escalation).
- Ideas, candidates, or promotion to Labs: [docs/APP_ACCEPTANCE.md](docs/APP_ACCEPTANCE.md) (the step-by-step idea-to-Labs workflow).
- Status changes: [docs/LIFECYCLE.md](docs/LIFECYCLE.md).
- Code: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), plus [DEPENDENCIES](docs/DEPENDENCIES.md), [PRIVACY_AND_DATA](docs/PRIVACY_AND_DATA.md), and [DESIGN_AND_ASSETS](docs/DESIGN_AND_ASSETS.md) as relevant.
- Deployment or Cloudflare: [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md).
- An app's own `README.md` and `APP.md` before changing it.

## Hard rules (details in the docs)

- Stop and get owner approval before touching sensitive subjects, external APIs, personal data, accounts, public user content, recurring costs, or unusual infrastructure. Launching and archiving always need owner approval.
- Never generate images, icons, logos, SVG artwork, audio, or video. Use licensed assets, or ask the owner.
- Every app uses `ajj-design`, keeps the `<!-- p100:footer -->` disclosure, and keeps `app.json`, `APP.md`, and `PRIVACY.md` accurate.
- Labs is hidden, noindex, and never monetized.
- Never commit secrets or private configuration. The repository is public.
- Never apply the `owner-approved` label or merge owner-gated PRs.
- Don't add speculative infrastructure, dependencies, or abstractions.
- Don't escalate ordinary implementation decisions. Decide, and record why.

## Commands

```bash
pnpm install
pnpm verify                         # run before every PR (same as CI)
pnpm fix                            # auto-format and fix lint
pnpm test                           # vitest
pnpm p100 validate | status | list
pnpm p100 check-changes origin/main  # history + owner-gated check CI runs on PRs
pnpm p100 candidate <slug> "<Name>"
pnpm p100 promote <slug>
pnpm --filter @project-100/app-<slug> dev
```

## Workflow

- Branch from `main` and open a PR. Never push to `main`. Merge your own PR once CI passes, **except** the owner-merged changes listed in [docs/AI_ROLES.md](docs/AI_ROLES.md#merging).
- Keep each PR to one app or one concern, and fill in the PR template.
- Model responsibilities and required reviews: [docs/AI_ROLES.md](docs/AI_ROLES.md#model-assignments).
- Report results honestly. Never weaken tests or checks to get green.
- If you are stuck or in disagreement, follow docs/AI_ROLES.md.
- If a doc is wrong or missing something, fix the doc in the same PR.

## Code style

- TypeScript, strict. Node runs `.ts` scripts directly, so use only erasable syntax (no `enum` or `namespace`) and `.ts` import extensions in scripts and packages.
- Plain, explicit code over clever code. Could a weaker model maintain this in five years?
- Tests sit next to the code as `*.test.ts`.
