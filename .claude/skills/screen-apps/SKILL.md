---
name: screen-apps
description: Run Project 100's idea-to-Labs gates for a batch. Generates ideas on two tracks, screens and ranks them, records the strongest as candidates, has them scored, selects N, and promotes them to Labs. Use when the owner asks to find or start new apps.
argument-hint: "<N> [focus: a theme, audience, or constraints]"
disable-model-invocation: true
---

# Screen and select apps

You are the Originator. Take a batch from nothing to N apps promoted to Labs, following [docs/APP_ACCEPTANCE.md](../../../docs/APP_ACCEPTANCE.md) Gates 1–3. The docs are the rules. This skill only sets the goal and the order. If they disagree, the docs win; fix the skill.

Arguments: `$ARGUMENTS`. The first word is N, the number of apps to promote. If it's missing, use 1. The rest, if any, is the focus for this batch. With no focus, pick freely within the charter.

**The goal is apps in Labs.** The gates choose the best ideas and stop clear failures; they don't try to prove an idea right before it exists. Similar tools are never a reason to drop an idea. If you notice yourself rejecting most of a batch, you're applying the old pass/fail screen: rank instead.

## Before starting

Read AGENTS.md, PROJECT_CHARTER.md, and APP_ACCEPTANCE.md Gates 1–3. Skim AI_ROLES.md (model assignments and launching) and LIFECYCLE.md (transitions). Then check the current state yourself; don't assume it:

- `pnpm p100 status` and `pnpm p100 list`
- benched candidates: `candidates/*/` with status `candidate` whose latest Decision line is `Benched`. They compete in this batch on their recorded scores. Candidates whose latest line is `Blocked` are waiting on the owner; check whether their approval has arrived.
- the rejection reasons in `candidates/*/app.json`, so you don't repeat a recorded idea (use [Revival](../../../docs/LIFECYCLE.md#revival) to retry one)
- the private idea ledger, `.ideas/ledger.md`. If it's missing, start one and note that in the report.
- open issues and PRs, especially pending owner approval requests
- [docs/BATCHES.md](../../../docs/BATCHES.md), for how earlier batches went

## Steps

1. **Generate (step 1).** Launch the Idea generator in the background for its half: about 20 ideas in one list, following step 1's rules (real material with one opened link each, the track and area quotas, at least a third `unusual`), with the ledger's pitches as "don't repeat these" and the step 1 examples for calibration. While it runs, generate your own 20 the same way without reading its list. Add every idea from both halves to the ledger.
2. **Screen and rank (step 2).** Kill only on a kill criterion. Rank the rest together with any benched candidates, and research the top 3N new ideas. Mark every idea's outcome in the ledger.
3. **Research (step 3).** Use each idea's track: utility ideas need at least one checked advantage (preferably two) against the strongest free options; niche ideas need evidence that the problem recurs. When in doubt, record it.
4. **Record candidates (step 4).** Record the strongest, up to 2N, each in its own `Candidate: <slug>` PR. Don't merge them yet.
5. **Critique (step 5).** For each candidate PR, launch the Critic with the model and effort in [AI_ROLES.md](../../../docs/AI_ROLES.md#model-assignments), launched as [described there](../../../docs/AI_ROLES.md#launching-another-model). Give it the PR, the batch's other candidate PRs, and APP_ACCEPTANCE.md, not your private reasoning. It returns findings, four scores, a strongest version, and a recommendation. Post it verbatim with its log header's model and effort lines.
6. **Select (step 6).** Respond to every finding and copy the scores into `PROPOSAL.md`. Do the one revise round where the Critic asks for one, and get the revision re-scored; any other material change needs a re-score too. Then decide the whole batch together: reject on a standing Critical finding, a total below 10, or any score of 1; select up to N by total (benched candidates included), breaking ties as step 6 says; bench the rest. Report any shortfall rather than lowering the bar. Send any dismissed Critical finding back to the Critic. Merge every candidate PR.
7. **Owner approvals (step 7).** For each selected candidate that needs an escalation, open the owner approval request and add a `Blocked` Decision line. It no longer counts toward N, so select the next-ranked qualifying candidate in its place and say so. A blocked candidate whose approval was recorded since the last batch gets a new `Selected for Labs` line and is promoted in this batch.
8. **Promote (step 8).** For each selected candidate with nothing pending, open its own `Promote: <slug> (#<id>)` PR. Fill in `APP.md` and `PRIVACY.md`, and merge once CI passes. Promote one at a time, and rebase before each, so ids don't collide.
9. **Log the batch.** Add this batch's row to [docs/BATCHES.md](../../../docs/BATCHES.md) in the last promotion PR, or in its own PR.

Idea generation and the critiques share one Codex subscription's usage limit. Run one idea round, then the critiques. If Codex reports a usage limit, don't substitute another model: finish what doesn't need it, then stop and report what is waiting and when the limit resets.

## Stop and report

Stop after promoting. Don't write build briefs or start building; each app gets its own build session.

Report:
- **Funnel:** the counts in this batch's BATCHES.md row
- **Promoted:** slug, id, track, total score, and one line on what it is, for each app
- **Benched:** slug, track, and total score, for each candidate
- **Rejected:** slug and the one-line reason, for each candidate
- **Blocked:** anything waiting on the owner, with links to the approval requests
- **Process problems:** anything the process got wrong or made unclear. Fix docs that aren't owner-gated in their own PR. Flag owner-gated ones for the owner.
