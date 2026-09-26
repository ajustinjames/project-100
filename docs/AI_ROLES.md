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

**Independent review** means a separate session that didn't write the work, whether that is code, a design brief, or a proposal. Launch reviews and security- or privacy-relevant changes **require** a reviewer from a different model family than the author's.

## Model assignments

Current as of 2026-09-26. Roles stay model-neutral; only this table changes when models change.

| Model | Roles | Responsibilities |
|---|---|---|
| **Opus 5.5** | Originator, Builder (design), final Reviewer, Steward | Selects ideas; frames the product; sets UX/UI direction and architecture; writes the implementation brief; does the final product, UI, and architecture review; decides which findings matter; escalates to the owner only when needed; recommends archives and writes retrospectives. |
| **Luna 6 Max** | Builder (implementation) | Implements, iterates, writes tests, refactors. |
| **Sol 6** | Critic, Reviewer, Maintainer | Critiques candidates adversarially before selection; does economical independent review of every build PR; maintains live apps; runs regression and dependency passes. |
| **Astra** | Adversarial Reviewer, Arbiter | Strong but expensive, so used only where it matters most: adversarial review before each launch request, of owner-gated changes (the checks, CI, the charter), and of security- or privacy-relevant changes; and arbitration of agent disagreements. |

**Build flow:**

1. Opus screens ideas. Sol critiques the survivors. Opus selects and records the candidates.
2. Opus writes the implementation brief as a GitHub issue ("Build brief: `<slug>`"): the problem, UX/UI direction, architecture, and acceptance criteria. Sol reviews the brief before building starts, so Opus's design decisions get an independent check. Durable decisions from it go into `APP.md`.
3. Luna implements in PRs that reference the brief. Sol reviews each PR.
4. Before a launch request, and for any security- or privacy-relevant change, Opus does the final review, then Astra does an adversarial review.
5. Opus opens the launch packet, linking both reviews.

**Maintenance:** Sol handles it. Routine dependency updates that pass CI need no further review. Other maintenance PRs by Sol are reviewed by a separate session (Luna by default, or Opus for security- or privacy-relevant changes). Non-trivial fixes go to Luna, and archive questions go to Opus. If Sol struggles to maintain an app, flag the app as too complex: it is failing the [maintainability test](PROJECT_CHARTER.md#maintainability-test).

**Handoff limits:** each author-and-reviewer pair gets at most two review-and-fix rounds; after that, follow [When stuck](#when-stuck). Opus decides which findings matter, but if Opus dismisses a reviewer's High or Critical finding and the reviewer still objects, it becomes a [disagreement](#disagreements-between-agents) for Astra to arbitrate.

## Decision rights

| AI decides alone | AI decides and records the reason | Owner decides |
|---|---|---|
| Implementation details, code structure, and naming | Rejecting ideas at the screen (no record needed) | Launch (Labs → live) |
| Visual design within `ajj-design` | Recording candidates | Archive |
| Tests, refactors, and bug fixes | Promoting a candidate to Labs (when no escalation applies) | Everything in [Escalation](#escalation) |
| Routine dependency updates that pass CI | Discarding a Labs prototype | Changes to the charter or these decision rights |
| Docs updates | Adding a dependency (recorded in APP.md) | Disagreements Astra's arbitration doesn't settle |
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
| Any recurring cost beyond the baseline budget. The charter's revenue exception applies only once the owner has confirmed the revenue evidence. | `recurring-cost` |
| Unusual infrastructure (anything beyond static assets plus modest Workers, KV, D1, or R2 on the free plan) | `infrastructure` |
| Launching an app | `launch` |
| Archiving an app | `archive` |

Also escalate security or privacy incidents (immediately), app ideas that need owner-created media, and anything where you notice yourself arguing that a rule doesn't quite apply.

**Don't escalate** ordinary implementation decisions. Pick the simpler option and record why.

While waiting on the owner, continue other work. Don't build the part that needs approval.

## Disagreements between agents

1. Each agent states its position and evidence in the PR or issue. Keep it short.
2. If still unresolved after one round, label the issue `disagreement`, and Astra arbitrates, deciding with reasons.
3. The owner decides only if an agent still disputes Astra's ruling with new evidence, or the question is in the owner's [decision rights](#decision-rights) anyway.
4. Until it is resolved, take the more conservative option: less scope, less data, fewer dependencies, no launch.

## When stuck

If an agent has made two serious attempts without progress, or is going in circles:

1. Stop changing code.
2. Write up the goal, what was tried, what failed, and the best current hypothesis.
3. Open or update an issue labelled `stuck`, and move on to other work.

Don't paper over problems. Don't disable tests or checks, and don't claim success without evidence.

## Merging

All changes go through PRs; never push directly to `main`. PRs exist for the CI gate, the audit trail, and easy reverts, not for human review.

**Agents merge their own PRs** (squash, e.g. `gh pr merge --auto --squash`) once CI passes and any review required above is done.

**Owner-merged PRs:** CI (`pnpm p100 check-changes`) flags these, and fails until the owner applies the `owner-approved` label:

- a status change to `live` or `archived`
- any change to an `approvals` list or to `monetization.eligible`
- `.github/` (workflows, CODEOWNERS, Dependabot, templates)
- `scripts/` and `packages/registry/` (the checks themselves)
- `docs/PROJECT_CHARTER.md` and this file
- any `wrangler` config (deploy configuration and bindings)

For these, open the PR, request review from `@ajustinjames`, and stop. **Agents never apply `owner-approved` and never merge these PRs.**

The same check also enforces history: registry entries are never deleted, ids never change or get reused, and status changes follow [LIFECYCLE.md](LIFECYCLE.md#transitions).

**Limits:** agents use the owner's GitHub identity, and a PR can edit the check itself, so this stops careless mistakes, not a deliberately misbehaving agent. The owner-merged list is how that edge is watched. If stronger enforcement is ever needed, give agents a separate GitHub identity without merge rights to gated paths.

## Working norms

- Keep each PR to one app or one concern.
- `pnpm verify` must pass. Report failures honestly.
- Keep docs true: update `APP.md`, `PRIVACY.md`, and `app.json` in the same PR as the change they describe.
- Leave the repository easier for the next agent, possibly a much weaker model.
