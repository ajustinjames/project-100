# App Acceptance

How an idea becomes a live app. Lifecycle mechanics (statuses, commands) are in [LIFECYCLE.md](LIFECYCLE.md). Roles and decision rights are in [AI_ROLES.md](AI_ROLES.md). This document names roles; the [model assignments](AI_ROLES.md#model-assignments) table says which model currently holds each one.

```
screen (private) → candidate → Labs → launch packet → live
```

**How this process is meant to work.** The early gates rank ideas and pick the best ones. They don't try to prove an idea right before anything exists. Models judge a working prototype much better than a written proposal, and a Labs prototype is hidden and cheap to discard. So the gates before Labs stop only clear failures (a kill criterion or a missing escalation) and choose the strongest of the rest. Labs is where an idea gets tested properly. Learned from the first batches: a model asked only to find reasons an idea would fail always finds some, and gates written as pass/fail rejected almost everything before it was built.

## Idea to Labs at a glance

| Step | Who | What gets recorded |
|---|---|---|
| 1. [Generate ideas](#1-generate-ideas) | Originator and Idea generator, half each | A line per idea in the private [idea ledger](#the-idea-ledger) |
| 2. [Screen](#2-screen) | Originator | The ledger line's outcome |
| 3. [Research the survivors](#3-research-the-survivors) | Originator | The ledger line's outcome |
| 4. [Record the candidate](#4-record-the-candidate) | Originator | `candidates/<slug>/`, and a candidate PR saying why it was shortlisted |
| 5. [Critique](#5-adversarial-critique) | Critic, in a separate session | Scores and findings, as a comment on the candidate PR |
| 6. [Select or reject](#6-select-or-reject) | Originator | A response to each finding, and the decision (selected, benched, or rejected) in `PROPOSAL.md` |
| 7. [Owner approval](#7-owner-approval-only-if-an-escalation-applies) | Owner, **only** if an escalation applies | An "Owner approval request" issue, then the approval in `app.json` |
| 8. [Promote](#8-promote) | Originator | A promotion PR and an `APP.md` decision saying why it enters Labs |

Ideas come from AI; the owner does not supply them ([charter](PROJECT_CHARTER.md#idea-ownership)). Recording a candidate and promoting it are AI decisions that need a recorded reason; rejecting at the screen needs no public record ([decision rights](AI_ROLES.md#decision-rights)). The owner may veto any candidate at any time; record a veto as a rejection that links the owner's comment. Launch is a separate, later owner decision ([Gate 4](#gate-4-launch-readiness)).

## Two tracks

Every idea is on one of two tracks. Name the track in `PROPOSAL.md`. The kill criteria are the same for both; what research has to show differs.

- **Utility track.** A familiar tool done well: a timer, a file viewer or fixer, a printable chart, a planner, an estimator, a converter for a real task. Most of the 100 are expected to come from here ([charter](PROJECT_CHARTER.md#product-principles): "familiar tools done well"). The task obviously recurs for a broad group, so research doesn't hunt for niche evidence. It shows that our version beats the strongest free options on [advantages someone can check](#3-research-the-survivors).
- **Niche track.** A specific group with a specific problem that general tools serve badly. Research shows the audience and that the problem recurs.

Don't push a utility idea into a niche to make it look original, and don't reject one for being familiar.

## Gate 1: Screen (before anything is recorded)

Steps 1 to 3 happen inside the Originator's own session, apart from the Idea generator's half of step 1. Commit nothing, open no issue or PR, and don't show these ideas to the owner.

### The idea ledger

Keep every idea either generator produces, including killed ones, in `.ideas/ledger.md` at the repository root. Git ignores this file: it is private Gate 1 material and must never be committed, posted, or shown to the owner. Each line is `date | source | track | one-line pitch | outcome`. The outcome is one of `killed: <criterion>`, `dropped: <reason>`, `recorded: <slug>`.

Before generating, read the ledger and the registry (`pnpm p100 list`). Give both generators the list of pitches as "already generated: don't repeat these or near variants". Without it, each batch starts from the same model priors and produces the same ideas. If the ledger is missing (for example, on a new machine), start a new one and say so in the batch report.

### 1. Generate ideas

Each generator produces **about 20 ideas in a single response**, as one list. One long list with diversity rules spreads much further than many separate requests, which keep landing on the same few ideas. The Originator generates its half without reading the Idea generator's first. The [Idea generator](AI_ROLES.md#model-assignments) runs in a separate session, launched as [described there](AI_ROLES.md#launching-another-model).

Both halves follow the same rules:

- **Start from real material, not memory.** Build each idea from something that exists: a file format people already have (exports, logs, GPX, SRT, CSV, ChordPro, ICS), a paid tool's free-tier limits, a "what do you use for X" thread, a printed form or wall chart people use, a standard or notation, an association's how-to guide. Give one link you opened for each idea. Claude Code can't fetch Reddit, so prefer pages the Originator can open too.
- **Spread by quota.** In each half: at least a third utility track; no more than three ideas in any one area; at least six different shapes. When the batch has an owner focus, the focus replaces the area list: name the sub-areas or audiences inside it, and put no more than three ideas in any one of them. The areas are work and trades; household and family logistics; learning and teaching; community, volunteer, and club organizing; hobbies, games, and crafts; travel and the outdoors; creative work; accessibility and daily-living aids; files people already have. The shapes are editors, viewers, trainers, references, simulations, trackers, calculators, planners, printables, and checkers. Include a few larger ideas where the problem calls for one.
- **Sample the tails.** Tag each idea `typical` (an idea most generators would produce for that area) or `unusual`. At least a third must be `unusual`. When ideas still come out alike, draw [random seeds](#random-seeds) for the unusual ones.
- **Calibrate on the [examples](#examples-of-ideas-that-would-pass), don't copy them.** No variants of the examples.

For each idea, give: the track, a one-line pitch, the person and the recurring task, the evidence link, the strongest alternative you know of, and the advantage you'd claim. Ask the Idea generator for ideas, not verdicts. Give it this step, the [kill criteria](#2-screen), the examples, the ledger's pitches, the registry's apps and candidates with their rejection reasons, and any focus for the batch.

Where an idea came from doesn't count for or against it. Record the source of each candidate under "Idea source" in `PROPOSAL.md`, so hit rates can be compared.

To retry a rejected or archived idea, use [Revival](LIFECYCLE.md#revival), not a new slug. A related category is fine. When an idea's task and audience match an existing Project 100 app, prefer improving that app.

#### Random seeds

```bash
for i in $(seq 1 20); do
  echo "$(shuf -n1 docs/idea-seeds/people.txt) | $(shuf -n1 docs/idea-seeds/moments.txt) | $(shuf -n1 docs/idea-seeds/twists.txt)"
done
```

Each line is a person, a moment in what they do, and a twist on the app's shape. Use promising combinations; skip ones that suggest no useful task. Add to the lists in [`docs/idea-seeds/`](idea-seeds/) when you notice a gap; never prune them to suit a batch. Most of the people list is trades and hobbies, which suit the niche track. The everyday people at its end suit the utility track.

#### Examples of ideas that would pass

These are for calibration only: they show the bar and the spread, not reserved or researched ideas. Proposing one means researching it like any other.

| Track | Idea | Shape | Advantage someone can check |
|---|---|---|---|
| Utility | Open an `.srt` subtitle file, shift or stretch its timing to match a video, save it | file fixer | No upload and no ads, where common online tools have both |
| Utility | A turn timer for a board game, passed around the table on one phone | one big button | Works offline, one tap per turn, readable at arm's length |
| Utility | Enter a household's people and chores, print a fair rotating chart for the month | printable | Rotation handled for you; no account or app install |
| Utility | Room dimensions minus doors and windows, give paint or tile quantities and a shopping list | estimator | Fewer steps than a spreadsheet; good on a phone in a shop |
| Utility | Open a GPX file from a hike or ride and see its elevation profile, climbs, and splits | viewer | Nothing uploaded; no account, unlike the big fitness sites |
| Niche | A round-robin fixture maker for a club league, with byes, court counts, and a printable schedule | planner | Handles courts and byes that generic bracket tools skip |
| Niche | Write a song in ChordPro, transpose it, and print a clean song sheet | notation editor | Free printing and transposing that paid apps lock |
| Niche | A trainer for reading analogue clocks, for children, that says which times they get wrong | trainer | Feedback on specific mistakes, no ads in a children's app |

### 2. Screen

Go through the whole list quickly. **Kill an idea only if one of these is true:**

- It has no clear useful task for its intended users.
- Its value comes from an external API or AI model rather than from the software itself.
- It mostly exists to rank in search or show ads.
- It needs ongoing human curation, moderation, or manual operation.
- It touches a [sensitive subject](PROJECT_CHARTER.md#sensitive-subjects) and you would be tempted to argue it doesn't.
- It can't run within the baseline budget and has no realistic path to paying for itself.
- You can't name who would use it more than once.

The case for an idea can't rest on search traffic, monetization, novelty alone, or the use of AI ([charter](PROJECT_CHARTER.md#seo), [MONETIZATION.md](MONETIZATION.md)). If that is all it has, kill it.

Similar tools, even good free ones, are **never** a kill criterion. They inform research and the critique.

Then rank the survivors from strongest to weakest. Rank on how useful the result would be and how clear its advantage is, not on originality. Research the top **3N** (N is the number of apps the batch wants); the rest stay in the ledger as `dropped: ranked below the cut`.

### 3. Research the survivors

Open every page you link and check that it says what you claim; never cite a source from memory. If you can't verify sources (for example, you have no web access), stop and don't record anything.

**Both tracks:**

- **Alternatives.** Compare the two or three strongest options, including the non-app default (a spreadsheet, paper, a general tool) and a credible free tool where one exists. Search by the job. Try the strongest one for the core task, or read its documentation. Verify pricing before claiming a free advantage. Say honestly what each does well.
- **What this app would do better.** One or two concrete reasons someone would choose it, written as planned behavior that Labs can check. Turn adjectives like "simpler" into steps, times, or features. Don't invent shortcomings in competitors.
- **Shape and escalations.** Whether it runs in the browser with local data, its rough size, and every [escalation](AI_ROLES.md#escalation) it would trigger. If it keeps text or files the user supplies, say what is kept and where. If that stays on the device and the app doesn't ask for personal details, it is `local-only` ([PRIVACY_AND_DATA.md](PRIVACY_AND_DATA.md#data-classification)).

**Utility track:** name the audience plainly ("people who rent out a holiday flat"), not "everyone". Recurrence needs no evidence when the task obviously recurs. The advantage must include **at least one** of these, checked against the strongest free alternatives you opened, and preferably two: no ads or tracking; no upload (works offline or on-device); no account or install; fewer steps or less time to the result; a good phone or keyboard experience; accessible controls; useful functionality that the alternatives charge for.

**Niche track:** say who exactly has the problem, how often, and what they do today, and link public evidence that it recurs (forum threads, repeated questions, guides describing a workaround). Don't copy people's personal details.

**Drop the idea** only if research finds a kill criterion, a niche idea has no evidence that the problem recurs, or you can't state a checkable advantage. A good free alternative alone is not a reason to drop it. **When in doubt, record it.**

## Gate 2: Candidate proposal

From here on, every decision is recorded, because candidates are permanent registry history.

### 4. Record the candidate

Record the strongest researched survivors, up to 2N.

1. Branch from `main` and run `pnpm p100 candidate <slug> "<Name>"`. This creates `candidates/<slug>/app.json` and a `PROPOSAL.md` from [the template](../templates/candidate/PROPOSAL.md).
2. In `app.json`, replace the `TODO`s in `description` and `problem`, set `category`, and set `privacy` and `analytics` to what the prototype will need ([data classes](PRIVACY_AND_DATA.md#data-classification)). Leave `approvals` empty, even if an escalation applies. A candidate may declare `privacy: "personal-data"`; `pnpm p100 promote` refuses it until the approval is recorded.
3. Fill in `PROPOSAL.md` from your research. Leave Critique and Decision for steps 5 and 6.
4. Run `pnpm verify` and open a PR titled `Candidate: <slug>`. In a few sentences, its description says why the idea was shortlisted. This is the recorded reason for recording the candidate.
5. Don't merge yet. The candidate PR merges after the critique and decision (steps 5 and 6).

### 5. Adversarial critique

The Critic critiques each candidate PR. The Critic must be a separate session that did not write the proposal ([independent review](AI_ROLES.md#roles)). Give the Critic the PR, this document, and the batch's other candidate PRs, not the Originator's private reasoning.

The Critic tests the case and **scores** it, then says how to make it stronger. It does not decide whether to build:

1. **Kill criteria and escalations.** Re-run the [screen](#2-screen). Look for missed escalations, especially anything near a [sensitive subject](PROJECT_CHARTER.md#sensitive-subjects), personal data, or an external API.
2. **Sources and alternatives.** Check that each linked source exists and says what the proposal claims. Search independently for alternatives the proposal missed. For each one that matters, say whether it does the core job well for this audience, and how you know. A similar tool or a crowded category is not a finding by itself; whether our advantage is credible is.
3. **Scores**, 1 to 5 each, with one sentence of reasoning per score:
   - **Usefulness:** how much the task matters to its audience, and how often it comes up.
   - **Advantage:** how credible and checkable the reason to choose ours is, against the strongest alternative.
   - **Feasibility:** how likely a browser-only prototype is to do the core task well.
   - **Upkeep:** how little ongoing maintenance it needs (5 is least).
4. **Strongest version.** The change to scope, audience, or angle that would most raise the scores, if any.

Give each finding a severity:

| Severity | Meaning |
|---|---|
| Critical | A kill criterion applies, or a needed escalation is missing. |
| High | A central claim (audience, recurrence, alternatives, the advantage) is unsupported or wrong. |
| Medium | A gap that should be fixed but doesn't threaten the case. |
| Low | Wording or minor detail. |

End with a recommendation: **reject** (only for a Critical finding), **revise** (with the specific revision), or **advance**.

Post the critique as a single PR comment. All agents use the owner's GitHub account, so begin it with `Critique by <role> (<model ID>, effort <level>)`, launched as described in [Launching another model](AI_ROLES.md#launching-another-model). The Critic must be able to check sources, so give it live web search (for `codex exec`, add `-c web_search='"live"'`). A read-only Critic usually can't post to GitHub. In that case, the session that launched it posts the Critic's final message verbatim and doesn't edit it.

### 6. Select or reject

In the Critique section of `PROPOSAL.md`, link the critique, copy its scores, and respond to each finding: what changed, or why it was dismissed. A High finding is answered with evidence or a revision. If it can't be answered, it stands and lowers the score; it doesn't by itself reject the candidate.

If the Critic recommends **revise**, make the revision (or adopt its "strongest version") once, and have the Critic re-score the revised proposal. That is the only revise round. After it, decide on the scores you have.

Scores belong to the proposal version the Critic reviewed. Any other material change to the proposal (audience, scope, track, or the claimed advantage) also needs a re-score, and uses the same one round. If that round is already used, bench the candidate; a later batch re-scores it before it can be selected.

Then decide every candidate in the batch together:

- **Reject** a candidate if a Critical finding stands, or if its total score is below 10 (out of 20), or if any score is 1. Set `status` to `"rejected"` and `rejection` to `{ "date": "YYYY-MM-DD", "reason": "<one sentence>" }`, and write the reason under Decision.
- **Select** up to N candidates with the highest totals among the rest. If fewer than N qualify, select those and report the shortfall; don't lower the bar. Under Decision, write why it was chosen and which findings shaped it.
- **Bench** the others. They keep status `candidate` and are eligible for a later batch's selection without a new critique, unless the proposal changes materially. Under Decision, write "Benched: ranked below the cut", with the date.

Break ties in this order: needs no escalation; higher Usefulness; higher Advantage; then the Originator's judgment, with the reason under Decision. Merge every candidate PR.

A candidate's state is its **latest** dated Decision line: `Selected for Labs`, `Blocked: awaiting <approval kind> (<link>)`, `Benched`, or `Rejected`. A selected candidate that needs an escalation gets a `Blocked` line when the approval request opens, and stops counting toward the batch's N, so the next-ranked candidate can be selected in its place. Once its approval is recorded, it returns to the eligible pool of the next batch **before** selection, and is ranked on its recorded scores with the same N limit as everything else. If it ranks in, add a new `Selected for Labs` line; if not, add a `Benched` line.

Dismissing a Critical finding needs the Critic's explicit acceptance in a PR comment (silence is not acceptance), linked in `PROPOSAL.md`. If the Critic still objects, follow [Disagreements](AI_ROLES.md#disagreements-between-agents), and don't promote until it is resolved in favor of advancing.

At the start of a batch, benched candidates (latest Decision line `Benched`) compete with the new ones for selection: rank them on their recorded scores. Blocked candidates don't compete until their approval is recorded; then they compete the same way.

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

- the candidate is on `main` with status `candidate`, and its Decision section selects it (to select a benched candidate, add a dated "Selected for Labs because ..." line in a PR first)
- the Critique section responds to every finding
- every dismissed Critical finding links to the Critic's explicit acceptance or a resolved disagreement outcome that permits advancing
- every escalation listed in `PROPOSAL.md` has a matching approval in `app.json`
- the owner hasn't vetoed it

Then:

1. Branch from `main` and run `pnpm p100 promote <slug>`. This moves the candidate to `apps/<slug>/` with status `labs` and the next id, and keeps `PROPOSAL.md` as history.
2. Run `pnpm install`. Fill in `APP.md` (problem, audience, scope, and alternatives come from the proposal) with a dated product decision saying why the app entered Labs. Fill in `PRIVACY.md`.
3. Run `pnpm verify` and open a PR titled `Promote: <slug> (#<id>)`. The description gives the reason for promotion and links the candidate PR, the critique, and any approvals. Merge it once CI passes. If CI reports an id collision, rebase and renumber ([IDs](LIFECYCLE.md#ids)).

Building then follows the [build flow](AI_ROLES.md#model-assignments), starting with the build brief. Labs is where an idea is really tested. **Build a prototype first:** the brief's first PR (after any feasibility gate) is the smallest version that does the core task from start to finish, and the decision to continue is made on that working version, not on the proposal. Discard freely; see [LIFECYCLE.md](LIFECYCLE.md#discarding-a-labs-prototype).

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
