---
name: build-app
description: Run Project 100's build flow for one Labs app. Writes the build brief, gets it reviewed, has the implementation built and reviewed in PRs, checks launch readiness, and opens the launch packet (or discards the prototype). Use when the owner asks to build a promoted app.
argument-hint: "<slug> [notes: constraints or where to pick up]"
disable-model-invocation: true
---

# Build a Labs app

You hold the Opus roles in the build flow: Builder (design), final Reviewer, and the one who decides which findings matter. Take one Labs app from promotion to either an open launch packet or a discarded prototype, following the [build flow](../../../docs/AI_ROLES.md#model-assignments), [Gate 4](../../../docs/APP_ACCEPTANCE.md#gate-4-launch-readiness), and [LIFECYCLE.md](../../../docs/LIFECYCLE.md). The docs are the rules. This skill only sets the goal and the order. If they disagree, the docs win; fix the skill.

Arguments: `$ARGUMENTS`. The first word is the app's slug. The rest, if any, is extra direction from the owner. If the slug is missing, use the only `labs` app without a build brief. If there are none, or several, list them and stop.

## Before starting

Read AGENTS.md and the docs it points to, especially PROJECT_CHARTER.md, AI_ROLES.md, APP_ACCEPTANCE.md (Gate 4 and the launch packet), LIFECYCLE.md, ARCHITECTURE.md, DEPENDENCIES.md, PRIVACY_AND_DATA.md, DESIGN_AND_ASSETS.md, and CLOUDFLARE.md. Then read the app's `APP.md`, `PRIVACY.md`, `PROPOSAL.md` (including the critique), `README.md`, and `app.json`.

Check the current state yourself; don't assume it:

- `pnpm p100 status` and `pnpm p100 list`: the app exists with status `labs`
- open and closed issues and PRs for this slug: an existing build brief, earlier build PRs, reviews, pending owner approval requests, and anything labelled `stuck` or `disagreement`
- any gate or discard rule already recorded in `APP.md` (for example, a feasibility test that must come first)

If work has already started, pick up from the first step that isn't done. Don't redo finished steps.

## Steps

1. **Write the build brief.** Open a GitHub issue titled `Build brief: <slug>`: the problem, UX and UI direction, architecture, and acceptance criteria. Plan the work as a short sequence of PRs, one concern each. Put any gate recorded in `APP.md` first. Resolve open questions from `APP.md` and `PROPOSAL.md` here, and record the durable decisions in `APP.md` in a PR.
2. **Brief review.** Launch the Reviewer, a separate session using the model and effort in [AI_ROLES.md](../../../docs/AI_ROLES.md#model-assignments), launched as [described there](../../../docs/AI_ROLES.md#launching-another-model). Give it the brief issue, not your private reasoning. Post its output verbatim as an issue comment. Respond to every finding in the brief: what changed, or why it was dismissed. Don't start implementation until the review is resolved.
3. **Implement, one PR at a time.** For each PR in the plan:
   - Launch the implementation model from the table on its own branch or worktree, with the brief, the scope of this PR, and the docs to follow. It writes code, tests, and docs. You open the PR (referencing the brief), and make sure `pnpm verify` passes.
   - Launch the Reviewer on the PR. Post its review verbatim as a PR comment. Decide which findings matter; the implementer fixes them.
   - Security- or privacy-relevant PRs also need your review and then the adversarial review from the table.
   - Keep `APP.md`, `PRIVACY.md`, `README.md`, and `app.json` true in the same PR. Smoke-test the preview URL as [CLOUDFLARE.md](../../../docs/CLOUDFLARE.md) describes. Merge once CI passes and the reviews are resolved.
4. **Stop to discard if it fails.** If a gate in `APP.md` fails, or the app turns out not to be worth a live slot, [discard the prototype](../../../docs/LIFECYCLE.md#discarding-a-labs-prototype) in its own PR with a real `RETRO.md`, and stop. Discarding is your decision; record why.
5. **Stop for owner approval if an escalation appears.** If an [escalation](../../../docs/AI_ROLES.md#escalation) comes up, open the owner approval request and don't build that part. Continue with the parts that don't need it, or stop if nothing is left.
6. **Launch readiness.** Check every [Gate 4](../../../docs/APP_ACCEPTANCE.md#gate-4-launch-readiness) item against the real app on its preview or Labs URL, on mobile and desktop. Do your final product, UI, and architecture review. Then launch the adversarial review from the table on the whole app. Resolve or explain every finding, and fix gaps in their own PRs.
7. **Launch packet.** Open a "Launch approval" issue from the template, filling every section from `APP.md` and `PRIVACY.md` and linking both reviews. Then stop. Launch is the owner's decision: never set `live`, never add a `launch` approval, and never merge owner-gated PRs.

Use each author-and-reviewer pair for at most two review-and-fix rounds. After that, follow [When stuck](../../../docs/AI_ROLES.md#when-stuck). If you dismiss a High or Critical finding and the reviewer still objects, follow [Disagreements](../../../docs/AI_ROLES.md#disagreements-between-agents).

## Stop and report

Stop after the launch packet, a discard, or a block. Don't start another app; each app gets its own build session.

Report:
- **Outcome:** launch packet opened, discarded, or blocked, with links
- **Built:** the brief, each merged PR with one line on what it did, and the reviews
- **Gates:** any gate from `APP.md`, with its measured result
- **Blocked:** anything waiting on the owner, with links to the approval requests
- **Process problems:** anything the process got wrong or made unclear. Fix docs that aren't owner-gated in their own PR. Flag owner-gated ones for the owner.
