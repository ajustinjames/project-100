---
name: screen-apps
description: Run Project 100's idea-to-Labs gates for a batch. Generates and screens ideas, records candidates, gets them critiqued, selects N, and promotes them to Labs. Use when the owner asks to find or start new apps.
argument-hint: "<N> [focus: a theme, audience, or constraints]"
disable-model-invocation: true
---

# Screen and select apps

You are the Originator. Take a batch from nothing to N apps promoted to Labs, following [docs/APP_ACCEPTANCE.md](../../../docs/APP_ACCEPTANCE.md) Gates 1–3. The docs are the rules. This skill only sets the goal and the order. If they disagree, the docs win; fix the skill.

Arguments: `$ARGUMENTS`. The first word is N, the number of apps to promote. If it's missing, use 1. The rest, if any, is the focus for this batch. With no focus, pick freely within the charter.

## Before starting

Read AGENTS.md and the docs it points to, especially PROJECT_CHARTER.md, AI_ROLES.md, APP_ACCEPTANCE.md, and LIFECYCLE.md. Then check the current state yourself; don't assume it:

- `pnpm p100 status` and `pnpm p100 list`
- existing `candidates/*/PROPOSAL.md` and `apps/*/APP.md`, including rejection reasons, so you don't repeat a recorded idea (use [Revival](../../../docs/LIFECYCLE.md#revival) instead)
- open issues and PRs, especially pending owner approval requests

## Steps

1. **Screen privately (Gate 1, steps 1–3).** Generate at least ten ideas per app wanted, spread across areas and shapes as [step 1](../../../docs/APP_ACCEPTANCE.md#1-generate-ideas) describes, screen them, and research the survivors. Record nothing, and don't show the killed ideas to the owner.
2. **Record candidates (step 4).** Record the strongest, at most N + 2, each in its own `Candidate: <slug>` PR. Don't merge them yet.
3. **Critique (step 5).** For each candidate PR, launch the Critic, a separate session using the model and effort in [AI_ROLES.md](../../../docs/AI_ROLES.md#model-assignments), launched as [described there](../../../docs/AI_ROLES.md#launching-another-model). Give it the PR, not your private reasoning.
4. **Select or reject (step 6).**
   - Respond to every finding in `PROPOSAL.md`.
   - Send any dismissed Critical or High finding back to the Critic.
   - Select up to N, reject the rest with reasons, and merge every candidate PR.
   - Prefer candidates that need no escalation.
5. **Owner approvals (step 7).** For each selected candidate that needs an escalation, open the owner approval request and treat it as blocked. Don't promote it, and carry on with the others.
6. **Promote (step 8).** For each selected candidate with nothing pending, open its own `Promote: <slug> (#<id>)` PR. Fill in `APP.md` and `PRIVACY.md`, and merge once CI passes. Promote one at a time, and rebase before each, so ids don't collide.

## Stop and report

Stop after promoting. Don't write build briefs or start building; each app gets its own build session.

Report:
- **Promoted:** slug, id, and one line on what it is, for each app
- **Rejected:** slug and the one-line reason, for each candidate
- **Blocked:** anything waiting on the owner, with links to the approval requests
- **Process problems:** anything the process got wrong or made unclear. Fix docs that aren't owner-gated in their own PR. Flag owner-gated ones for the owner.
