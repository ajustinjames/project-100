# App Acceptance

How an idea becomes a live app. Each gate is cheaper than the next, so weak ideas should die at the earliest one. Lifecycle mechanics (statuses, commands) are in [LIFECYCLE.md](LIFECYCLE.md). Roles and decision rights are in [AI_ROLES.md](AI_ROLES.md). This document names roles; the [model assignments](AI_ROLES.md#model-assignments) table says which model currently holds each one.

```
screen (private) → candidate → Labs → launch packet → live
```

## Idea to Labs at a glance

| Step | Who | What gets recorded |
|---|---|---|
| 1. [Generate ideas](#1-generate-ideas) | Originator and Idea generator, half each | Nothing |
| 2. [Screen](#2-screen) | Originator | Nothing. Drop failures quietly. |
| 3. [Research the survivors](#3-research-the-survivors) | Originator | Nothing. Drop failures quietly. |
| 4. [Record the candidate](#4-record-the-candidate) | Originator | `candidates/<slug>/`, and a candidate PR saying why it survived |
| 5. [Adversarial critique](#5-adversarial-critique) | Critic, in a separate session | The critique, as a comment on the candidate PR |
| 6. [Select or reject](#6-select-or-reject) | Originator | A response to each finding and the decision, in `PROPOSAL.md` (plus `rejection` in `app.json` if rejected) |
| 7. [Owner approval](#7-owner-approval-only-if-an-escalation-applies) | Owner, **only** if an escalation applies | An "Owner approval request" issue, then the approval in `app.json` |
| 8. [Promote](#8-promote) | Originator | A promotion PR and an `APP.md` decision saying why it enters Labs |

Ideas come from AI; the owner does not supply them ([charter](PROJECT_CHARTER.md#idea-ownership)). Recording a candidate and promoting it are AI decisions that need a recorded reason; rejecting at the screen needs no record ([decision rights](AI_ROLES.md#decision-rights)). The owner may veto any candidate at any time; record a veto as a rejection that links the owner's comment. Launch is a separate, later owner decision ([Gate 4](#gate-4-launch-readiness)).

## Gate 1: Screen (before anything is recorded)

Steps 1 to 3 happen inside the Originator's own session, apart from the Idea generator's half of step 1. Commit nothing, open no issue or PR, and don't show these ideas to the owner. Drop weak ideas privately; there is no target rejection rate.

### 1. Generate ideas

Generate enough ideas to compare promising options; five to ten per app wanted is a useful starting point, not a quota. Start from people and situations, including familiar tasks that could benefit from better execution or a free tool:

- a specific person doing a specific task that recurs (a hobby, a trade, study, household routines, planning)
- an unusual niche that general-purpose tools serve badly
- a constraint, representation, or interaction that makes an old problem easier
- an existing app category where thoughtful design, easier access, or free core functionality would be useful

**Spread the batch.** Before generating, note the areas and shapes of the recorded candidates and apps. Explore beyond the last few ideas, without ruling out a useful idea just because its category is familiar:

- With no owner focus, sample several areas: work and trades; household and family logistics; learning and teaching; community, volunteer, and club organizing; hobbies, games, and crafts; travel and the outdoors; creative work (writing, music, art, video); accessibility and daily-living aids; files people already have (exports, logs, spreadsheets, standard formats). There is no per-area quota.
- Vary the shape, not just the subject: editors, viewers for a file format, trainers that give feedback, references, simulations, and trackers, as well as calculators and planners. Include some larger ideas where the problem calls for one ([charter](PROJECT_CHARTER.md#product-principles)).

**Use random seeds when ideas repeat.** If generation keeps returning the same tasks, random draws can help either generator explore:

```bash
for i in $(seq 1 20); do
  echo "$(shuf -n1 docs/idea-seeds/people.txt) | $(shuf -n1 docs/idea-seeds/moments.txt) | $(shuf -n1 docs/idea-seeds/twists.txt)"
done
```

Each line is a person, a moment in what they do, and a twist on the app's shape. Use promising combinations as prompts; skip or adapt combinations that do not suggest a useful task. Seeds are optional. When using them, the Originator can draw lines for both halves. Add to the lists in [`docs/idea-seeds/`](idea-seeds/) when you notice a gap; never prune them to suit a batch.

**Split the batch 50/50.** The Originator generates half of the ideas. The [Idea generator](AI_ROLES.md#model-assignments) generates the other half in a separate session, launched as [described there](AI_ROLES.md#launching-another-model). A second model brings ideas the Originator wouldn't think of.

- Give the two halves different starting areas where useful, and generate your half without reading the other first. Overlap in categories is fine; compare and consolidate ideas for the same task.
- Give the Idea generator the charter, this step and [step 2](#2-screen), the recorded candidates and apps with their rejection reasons, any focus for the batch, and its areas. Ask for ideas, not verdicts: for each one, a one-line pitch, the person and the recurring task, and why it might pass the screen. It may note tools it already knows do the job. Ask it to build each idea from a real place where practitioners talk (a forum, a mailing list, an association's guide) and to give one link it opened as evidence. Without that, it invents the person and the task, and those ideas die at the screen. The evidence has to be on a page the Originator can open too: Claude Code can't fetch Reddit.
- Screen and research both halves the same way. Where an idea came from doesn't count for or against it. Record the source of each candidate under "Idea source" in `PROPOSAL.md`, so hit rates can be compared.

Before screening, run `pnpm p100 list` and skim the existing `PROPOSAL.md` files and rejection reasons, so you don't propose a recorded idea again. A related category is fine; explain a separate app's value when it overlaps a Project 100 app, and prefer improving that app when the task and audience are the same. To retry a rejected or archived idea, use [Revival](LIFECYCLE.md#revival), not a new slug. A prior rejection for similarity can be reconsidered under the current criteria.

### 2. Screen

**Kill an idea if any of these is true:**

- It has no clear useful task or credible practical benefit for its intended users.
- Its value comes from an external API or AI model rather than from the software itself.
- It mostly exists to rank in search or show ads.
- It needs ongoing human curation, moderation, or manual operation.
- It touches a [sensitive subject](PROJECT_CHARTER.md#sensitive-subjects) and you would be tempted to argue it doesn't.
- It can't run within the baseline budget and has no realistic path to paying for itself.
- You can't name who would use it more than once.

**Don't kill an idea because similar tools exist, even good free ones.** Familiar categories such as timers and formatters are eligible. Better execution, thoughtful design, easier access, or useful free functionality can justify another app. Existing tools inform [research](#3-research-the-survivors) and the critique; their existence is not a kill criterion.

**Promising signs:**

- A specific person with a specific, recurring problem.
- An unusual niche that general-purpose tools serve badly.
- A clever angle: a constraint, representation, or interaction that makes an old problem easier.
- A familiar task done nicely: readable results, fewer steps, good mobile or keyboard use, or less setup.
- Useful functionality made free where credible alternatives charge for it.
- Works entirely in the browser, with data kept locally.
- Small enough to understand in one sitting.

**Not reasons to advance.** None of these counts in an idea's favor. If the case for an idea rests on one of them, kill it:

- search traffic or SEO potential ([charter](PROJECT_CHARTER.md#seo))
- monetization potential ([MONETIZATION.md](MONETIZATION.md))
- novelty alone: new or unusual, but nobody would come back to it
- use of AI: an app is not better because it uses AI or is about AI

### 3. Research the survivors

Answer all of these for each survivor before recording anything. Open every page you link and check that it says what you claim; never cite a source from memory. If you can't verify sources (for example, you have no web access), stop here and don't record the idea.

- **Audience and recurrence.** Who exactly has the problem, how often, and what they do about it today. "Everyone" and "developers" are not audiences. Link public evidence that the problem recurs, such as forum threads, repeated community questions, or guides describing a workaround. Link to it; don't copy people's personal details.
- **Real alternatives.** Compare the strongest relevant options, usually two or three, including the non-app default (a spreadsheet, a notes app, paper, a general-purpose tool) and a credible free tool where one exists. Link each one, and say what it does well and what tradeoffs remain for this audience. Search by the job, including broader tools that may contain the feature. Check app stores or F-Droid when those platforms matter to the audience; exhaustive coverage is not required. Try the strongest relevant tool for the core task, or read its documentation where you can't. Verify pricing before claiming a free advantage, and acknowledge when another tool does the job well.
- **What this app would do better.** Give one or two concrete reasons someone would choose it. The benefit can be execution, design, access, or price; it need not be an exclusive feature. These count:
  - a useful feature, representation, or interaction;
  - useful core functionality offered free when relevant alternatives charge or impose meaningful limits;
  - thoughtful design and polish: readable results, clear feedback, fewer steps, accessible controls, or a good mobile layout;
  - less setup, no required account or installation, offline use, or local data handling, with an explanation of how that helps the task.

  Turn adjectives such as "simpler", "cleaner", or "modern" into planned behavior and acceptance criteria. At candidate stage, a plausible design benefit grounded in the task and inspected alternatives is enough; do not require proof that users will switch before a prototype exists. If other tools are already free, free pricing alone is not an advantage, but good execution can still justify the app.
- **Shape and escalations.** Whether it can run in the browser with local data, its rough size, and every [escalation](AI_ROLES.md#escalation) it would trigger. If the app would keep text or files the user supplies (a pasted text, an opened document, an imported export), say exactly what is kept and where. If it stays on the device and the app doesn't ask for personal details, it is `local-only` ([PRIVACY_AND_DATA.md](PRIVACY_AND_DATA.md#data-classification)).

**Drop the idea quietly only if** research turns up a kill criterion, you find no evidence that the problem recurs, or you cannot describe a credible practical reason someone would choose the proposed app after comparing alternatives. A good free alternative is context, not an automatic rejection. Do not invent shortcomings in competitors to justify a candidate.

**When something similar exists, use it to inform the design.** Explain what our version would make pleasant, convenient, accessible, or free. Narrowing the audience or adding a missing step may help, but is not required. Prefer a useful familiar tool over a forced novelty.

**When in doubt, record it.** The early batches screened over a hundred ideas each and recorded almost none, because the Originator dropped anything with a related tool. The critique exists to test the comparison, and a rejected candidate costs little.

## Gate 2: Candidate proposal

From here on, every decision is recorded, because candidates are permanent registry history.

### 4. Record the candidate

1. Branch from `main` and run `pnpm p100 candidate <slug> "<Name>"`. This creates `candidates/<slug>/app.json` and a `PROPOSAL.md` from [the template](../templates/candidate/PROPOSAL.md).
2. In `app.json`, replace the `TODO`s in `description` and `problem`, set `category`, and set `privacy` and `analytics` to what the prototype will need ([data classes](PRIVACY_AND_DATA.md#data-classification)). Leave `approvals` empty, even if an escalation applies. A candidate may declare `privacy: "personal-data"`; `pnpm p100 promote` refuses it until the approval is recorded.
3. Fill in `PROPOSAL.md` from your research: problem, audience, solution, alternatives, what it does better, likely scope, screen results, risks, open questions, and escalations needed. Leave Critique and Decision for steps 5 and 6.
4. Run `pnpm verify` and open a PR titled `Candidate: <slug>`. In a few sentences, its description says why the idea survived the screen and research. This is the recorded reason for recording the candidate.
5. Don't merge yet. The candidate PR merges after the critique and decision (steps 5 and 6).

### 5. Adversarial critique

The Critic critiques the candidate PR. The Critic must be a separate session that did not write the proposal ([independent review](AI_ROLES.md#roles)). Give the Critic the PR, not the Originator's private reasoning.

The Critic's job is to challenge the case for usefulness and find concrete reasons it would fail, using the current criteria rather than requiring originality:

- Re-run the [screen](#2-screen). Say which kill criteria apply, if any, and whether the case rests on anything under "Not reasons to advance".
- Search independently for relevant alternatives the proposal missed. Check that each linked source exists and says what the proposal claims. For each alternative that matters, say whether it does the core job *well* for this audience, and how you know. Similarity, a crowded category, or a good free alternative is not a Critical finding by itself. Assess whether the proposed execution, design, access, or price benefit is credible.
- Test the audience: is the problem real, specific, and recurring, and is there evidence?
- Test "what this does better": is there a plausible reason someone would choose it, and can the proposed benefit be checked in Labs? Do not demand a unique feature or proof of switching at candidate stage.
- Look for missed escalations, especially anything near a [sensitive subject](PROJECT_CHARTER.md#sensitive-subjects), personal data, or an external API. Look for scope that is too big to maintain, or that needs ongoing human work.

Post the critique as a single PR comment. All agents use the owner's GitHub account, so begin it with `Critique by <role> (<model ID>, effort <level>)`, launched as described in [Launching another model](AI_ROLES.md#launching-another-model). The Critic must be able to check sources, so give it live web search (for `codex exec`, add `-c web_search='"live"'`). A read-only Critic usually can't post to GitHub. In that case, the session that launched it posts the Critic's final message verbatim and doesn't edit it. Give each finding a severity:

| Severity | Meaning |
|---|---|
| Critical | A kill criterion applies, or a needed escalation is missing. |
| High | A central claim (audience, recurrence, alternatives, what it does better) is unsupported or wrong. |
| Medium | A gap that should be fixed but doesn't threaten the case. |
| Low | Wording or minor detail. |

End with a recommendation: **reject**, **revise**, or **advance**.

### 6. Select or reject

The Originator decides which findings matter. In the Critique section of `PROPOSAL.md`, link the critique and record the response to each finding: what changed, or why it was dismissed. Then decide:

- **Reject** if any Critical finding stands, or any High finding can't be answered with evidence. A finding that another tool exists is answered by explaining the credible practical value of our version; an exclusive feature is not required. If the Critic recommends **revise**, try the revision before rejecting: clarify or improve the proposed benefit and send it back. Set `status` to `"rejected"` and `rejection` to `{ "date": "YYYY-MM-DD", "reason": "<one sentence>" }`, write the reason under Decision, and merge the PR. The rejected candidate stays in the registry, so the idea isn't proposed again without a [revival](LIFECYCLE.md#revival).
- **Select** otherwise. Under Decision, write why it deserves Labs and which findings shaped it. Merge the PR with status `candidate`.

Before the final critique round, the Critic checks any material revision to the proposal. Any dismissal of a Critical or High finding must also go back to the Critic, even if the proposal is unchanged. The Critic explicitly records whether they accept each dismissal in a PR comment; silence is not acceptance. Link that response in `PROPOSAL.md`. If the Critic still objects, follow [Disagreements](AI_ROLES.md#disagreements-between-agents) and link the resolved outcome. Don't promote until every such dismissal has the Critic's explicit acceptance or a resolved disagreement outcome that permits advancing.

Allow at most two critique-and-revise rounds. After the final round, the Originator may adopt the Critic's requested fixes and select the candidate without another confirmation, provided the response in `PROPOSAL.md` shows what changed and the selection requirements above are met. Any material change beyond the requested fixes needs another Critic check; if that requires another critique-and-revise round, follow [When stuck](AI_ROLES.md#when-stuck) instead of selecting. The round limit never waives the requirement for explicit acceptance of a dismissed Critical or High finding.

## Gate 3: Entering Labs

### 7. Owner approval, only if an escalation applies

Promotion needs no owner approval **unless** the candidate triggers an [escalation](AI_ROLES.md#escalation): a sensitive subject, external API, personal data, accounts, user-generated content, recurring cost, or unusual infrastructure. Needed approvals must be recorded before promotion ([LIFECYCLE.md](LIFECYCLE.md#transitions)). Ask only after the candidate is selected, so the owner only sees ideas that survived the critique.

1. Open an "Owner approval request" issue for each approval kind. Link the candidate PR and the critique.
2. Wait. Don't promote, and don't build the part that needs approval. Continue other work.
3. If the owner approves, add `{ "kind": "<kind>", "date": "YYYY-MM-DD", "ref": "<link to the owner's approval>" }` to the candidate's `approvals` in a PR. Changing `approvals` makes the PR [owner-merged](AI_ROLES.md#merging): open it, request review from `@ajustinjames`, and stop.
4. If the owner declines, either reject the candidate as in step 6 and link the decision, or revise it so the escalation no longer applies. A revised candidate goes back through the critique.

If an escalation first comes up later, in Labs, the same rule applies: get the approval before building that part.

### 8. Promote

Promotion is the Originator's decision, and its reason is recorded ([decision rights](AI_ROLES.md#decision-rights)). Before promoting, check that:

- the candidate is on `main` with status `candidate`, and its Decision section selects it
- the Critique section responds to every finding
- every dismissed Critical or High finding links to the Critic's explicit acceptance or a resolved disagreement outcome that permits advancing
- every escalation listed in `PROPOSAL.md` has a matching approval in `app.json`
- the owner hasn't vetoed it

Then:

1. Branch from `main` and run `pnpm p100 promote <slug>`. This moves the candidate to `apps/<slug>/` with status `labs` and the next id, and keeps `PROPOSAL.md` as history.
2. Run `pnpm install`. Fill in `APP.md` (problem, audience, scope, and alternatives come from the proposal) with a dated product decision saying why the app entered Labs. Fill in `PRIVACY.md`.
3. Run `pnpm verify` and open a PR titled `Promote: <slug> (#<id>)`. The description gives the reason for promotion and links the candidate PR, the critique, and any approvals. Merge it once CI passes. If CI reports an id collision, rebase and renumber ([IDs](LIFECYCLE.md#ids)).

Building then follows the [build flow](AI_ROLES.md#model-assignments), starting with the build brief. Labs is for testing feasibility. Discard freely; see [LIFECYCLE.md](LIFECYCLE.md#discarding-a-labs-prototype).

### Measuring a feasibility gate

When `APP.md` records a feasibility gate (a measurement that decides whether the prototype is worth building), measure it so the result can't be argued away, including by its builder. Learned from [Size Sieve](../apps/size-sieve/RETRO.md).

1. **Put it on record before measuring.** Write the criteria, the thresholds, and the exact cohort (the test material, by name) in the build brief before the tool runs on any of it. Make the cohort match the real audience: a sample of 9 knitting patterns and 1 crochet pattern hid the crochet formats that later failed.
2. **Annotate the ground truth by hand from the originals, before the tool runs on them.** Include everything the tool will encounter, including what it's meant to skip, and mark those items instead of leaving them out. Otherwise correct behavior in a skipped area can score as an error, and the scoring gets disputed after the fact.
3. **Keep the test material lawful and local.** Use only material you may use (free, published by its owner). Respect stated terms: drop anything whose terms forbid copying. Never commit it; commit counts only.
4. **Check the harness on one real input before trusting a summary.** Harness bugs look like results.
5. **Don't change the scoring after seeing a result** without the Reviewer's explicit ruling, recorded on the brief. Report both readings if there is a dispute.
6. **At most one fix round, then an untouched holdout.** Write the fix-round rules on the brief first. Then collect and annotate a holdout from new sources before the fixed tool touches it. The fix has to pass both the original cohort and the holdout, or the prototype is discarded. Don't tune again against material you've already seen.

## Gate 4: Launch readiness

Before requesting launch, the app must meet all of these:

- **Useful:** does the job in the proposal. Core flows work on mobile and desktop.
- **Accessible:** keyboard-operable, has visible focus, uses semantic HTML, sufficient contrast, and labelled controls.
- **Fast and light:** no unnecessary dependencies, and loads quickly on a mid-range phone.
- **Robust:** handles empty, invalid, and large inputs. No console errors, apart from the one known CSP error for Cloudflare's blocked "JavaScript detections" script until the owner resolves it ([CLOUDFLARE.md](CLOUDFLARE.md#security-headers)). Stored-data formats are versioned if the data persists.
- **Tested:** core logic has Vitest tests. `pnpm verify` passes.
- **Honest docs:** `APP.md`, `PRIVACY.md`, and `README.md` are accurate. `app.json` is complete.
- **Compliant:** uses `ajj-design`, includes the disclosure footer, has no AI-generated media, has asset licenses recorded, and holds all needed approvals.
- **Independently reviewed:** a reviewer from a different model family has reviewed code, UX, privacy, and accessibility, and its findings are resolved or explained (see [AI_ROLES.md](AI_ROLES.md#model-assignments)).
- **Maintainable:** passes the [maintainability test](PROJECT_CHARTER.md#maintainability-test).

## Launch packet

Open a "Launch approval" issue (template provided). Keep it concise:

| Section | Answer |
|---|---|
| Problem being solved | One paragraph. |
| Intended audience | Who, specifically. |
| Why it is worth shipping | The practical value of this version, including execution, design, access, or price. |
| Alternatives researched | Named, linked, and briefly compared. |
| Architecture summary | Rendering, state, persistence, and services. |
| Dependencies | Third-party packages and shared packages. |
| Privacy / data behavior | Summary of `PRIVACY.md` and its classification. |
| Analytics behavior | Standard, none, or custom (with justification). |
| Infrastructure requirements | Static only, or which Cloudflare services and why. |
| Maintenance expectations | What could break, and how often it needs attention. |
| Known limitations | Honest list. |
| Why it deserves a live slot | Why this, out of everything, should count toward the 100. |

Link the independent review. The owner approves or declines on the issue. On approval, the launching PR records the `launch` approval in `app.json` (see [LIFECYCLE.md](LIFECYCLE.md#launching)).
