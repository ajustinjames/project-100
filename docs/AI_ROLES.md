# AI Roles

Who does what, who decides what, and when to involve the project owner.

## Roles

Any agent (Claude Code, Codex, or another) may take any role. One session may hold several roles, **except** that a reviewer must be independent of the work being reviewed.

| Role | Responsibility |
|---|---|
| **Originator** | Generates ideas, screens them privately, and records the survivors as candidates. |
| **Critic** | Challenges candidates: researches alternatives, looks for kill criteria, and argues against weak ideas. |
| **Builder** | Scopes, designs, and implements Labs prototypes and launches. Writes tests and docs. |
| **Reviewer** | Independently reviews another agent's work for correctness, UX, accessibility, privacy, security, and policy compliance. |
| **Maintainer** | Keeps live apps healthy: dependency updates, bug fixes, and improvements to shared packages and `ajj-design`. |
| **Steward** | Audits the registry and live apps, recommends archives, and writes retrospectives. |

**Independent review** means a separate session that didn't write the code. Launch reviews and security- or privacy-relevant changes need a model from a different family than the builder's; the final review below provides that.

## Model assignments

Current as of 2026-09-26. Roles stay model-neutral; only this table changes when models change.

| Model | Roles | Responsibilities |
|---|---|---|
| **Opus 5.5** | Originator, Builder (design), final Reviewer, Steward | Selects ideas; frames the product; sets UX/UI direction and architecture; writes the implementation brief; does the final product, UI, and architecture review; decides which findings matter; escalates to the owner only when needed; recommends archives and writes retrospectives. |
| **Luna 6 Max** | Builder (implementation) | Implements, iterates, writes tests, refactors. |
| **Sol 6** | Critic, Reviewer, Maintainer | Critiques candidates adversarially before selection; does economical independent review of every build PR; maintains live apps; runs regression and dependency passes. |

**Build flow:**

1. Opus screens ideas. Sol critiques the survivors. Opus selects and records the candidates.
2. Opus writes the implementation brief as a GitHub issue ("Build brief: `<slug>`"): the problem, UX/UI direction, architecture, and acceptance criteria. Durable decisions from it go into `APP.md`.
3. Luna implements in PRs that reference the brief. Sol reviews each PR.
4. Before a launch request, and for any security- or privacy-relevant change, Opus does the final review. Allow at most two review-and-fix rounds; after that, follow [When stuck](#when-stuck).
5. Opus opens the launch packet.

**Maintenance:** Sol handles it. Non-trivial fixes go to Luna, and archive questions go to Opus. If Sol struggles to maintain an app, flag the app as too complex: it is failing the [maintainability test](PROJECT_CHARTER.md#maintainability-test).

## Decision rights

| AI decides alone | AI decides and records the reason | Owner decides |
|---|---|---|
| Implementation details, code structure, and naming | Rejecting ideas at the screen (no record needed) | Launch (Labs → live) |
| Visual design within `ajj-design` | Recording candidates | Archive |
| Tests, refactors, and bug fixes | Promoting a candidate to Labs (when no escalation applies) | Everything in [Escalation](#escalation) |
| Routine dependency updates that pass CI | Discarding a Labs prototype | Changes to the charter or these decision rights |
| Docs updates | Adding a dependency (recorded in APP.md) | Resolving agent disagreements |
| | Changes to shared packages and `ajj-design` | |

"Records the reason" means in the PR description and the relevant APP.md or doc.

## Escalation

Get explicit owner approval **before** implementing any of these. Use the "Owner approval request" issue template. Once approved, add the approval to the app's `app.json` `approvals` list, with a link to the owner's approval.

| Trigger | Approval kind |
|---|---|
| Anything near medicine, health, politics, elections, misinformation-sensitive, or other high-stakes factual domains | `sensitive-subject` |
| A third-party API becoming a meaningful dependency | `external-api` |
| Handling any personal data | `personal-data` |
| Accounts or login | `accounts` |
| Public user-generated content or anything needing moderation | `user-generated-content` |
| Any recurring cost beyond the baseline budget | `recurring-cost` |
| Unusual infrastructure (anything beyond static assets plus modest Workers, KV, D1, or R2 on the free plan) | `infrastructure` |
| Launching an app | `launch` |
| Archiving an app | `archive` |

Also escalate security or privacy incidents (immediately), app ideas that need owner-created media, and anything where you notice yourself arguing that a rule doesn't quite apply.

**Don't escalate** ordinary implementation decisions. Pick the simpler option and record why.

While waiting on the owner, continue other work. Don't build the part that needs approval.

## Disagreements between agents

1. Each agent states its position and evidence in the PR or issue. Keep it short.
2. If still unresolved after one round, label the issue `disagreement` and ask the owner.
3. Until the owner decides, take the more conservative option: less scope, less data, fewer dependencies, no launch.

## When stuck

If an agent has made two serious attempts without progress, or is going in circles:

1. Stop changing code.
2. Write up the goal, what was tried, what failed, and the best current hypothesis.
3. Open or update an issue labelled `stuck`, and move on to other work.

Don't paper over problems. Don't disable tests or checks, and don't claim success without evidence.

## Merging

All changes go through PRs; never push directly to `main`. PRs exist for the CI gate, the audit trail, and easy reverts, not for human review.

**Agents merge their own PRs** (squash, e.g. `gh pr merge --auto --squash`) once the `verify` check passes and any review required above is done.

**Owner-merged PRs:** for the changes below, open the PR, request review from `@ajustinjames`, and don't merge it yourself:

- a status change to `live` or `archived`
- adding an entry to any `approvals` list
- changes to `docs/PROJECT_CHARTER.md` or to this file's decision rights, escalation, or merging rules
- anything under `.github/` (workflows, CODEOWNERS, Dependabot, templates)
- deploy configuration (deploy workflow, `wrangler.jsonc`) or secrets handling

Agents use the owner's GitHub identity, so this rule is enforced by convention, not by GitHub. Following it exactly is a condition of agents' merge rights.

## Working norms

- Keep each PR to one app or one concern.
- `pnpm verify` must pass. Report failures honestly.
- Keep docs true: update `APP.md`, `PRIVACY.md`, and `app.json` in the same PR as the change they describe.
- Leave the repository easier for the next agent, possibly a much weaker model.
