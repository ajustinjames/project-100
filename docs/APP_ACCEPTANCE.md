# App Acceptance

How an idea becomes a live app. Each gate is cheaper than the next, so weak ideas should die at the earliest one. Lifecycle mechanics (statuses, commands) are in [LIFECYCLE.md](LIFECYCLE.md).

```
screen (private) → candidate → Labs → launch packet → live
```

## Gate 1: Screen (before anything is recorded)

Agents generate ideas freely and screen them privately. Most ideas should die here without being written down or shown to the owner.

**Kill an idea if any of these is true:**

- The one-line pitch describes a thousand existing sites ("a Pomodoro timer", "a JSON formatter", "an AI chat for X").
- A well-known free tool already does it well, and you cannot say concretely what this version does better.
- Its value comes from an external API or AI model rather than from the software itself.
- It mostly exists to rank in search or show ads.
- It needs ongoing human curation, moderation, or manual operation.
- It touches a [sensitive subject](PROJECT_CHARTER.md#sensitive-subjects) and you would be tempted to argue it doesn't.
- It can't run within the baseline budget and has no realistic path to paying for itself.
- You can't name who would use it more than once.

**Promising signs:**

- A specific person with a specific, recurring problem.
- An unusual niche that general-purpose tools serve badly.
- A clever angle: a constraint, representation, or interaction that makes an old problem easier.
- Works entirely in the browser, with data kept locally.
- Small enough to understand in one sitting.

## Gate 2: Candidate proposal

An idea that survives screening is recorded with `pnpm p100 candidate <slug> "<Name>"` and opened as a PR. Fill in `app.json` (no `TODO`s) and `PROPOSAL.md`, which covers:

- the problem and who has it
- the proposed solution and why it is worth building
- existing alternatives, researched and linked
- the likely scope and technical shape
- pass/fail against the screen above
- risks, open questions, and any [escalations](AI_ROLES.md#escalation) needed

A different agent should critique a candidate before it is promoted. The owner may veto any candidate at any time.

## Gate 3: Entering Labs

`pnpm p100 promote <slug>` moves a candidate into `apps/` with status `labs` and a permanent id. No owner approval is needed **unless** the candidate triggers an escalation (sensitive subject, external API, accounts, personal data, user-generated content, recurring cost, or unusual infrastructure). Those approvals must be recorded in `app.json` before the prototype does the thing that needs approval.

Labs is for testing feasibility. Discard freely; see [LIFECYCLE.md](LIFECYCLE.md#discarding-a-labs-prototype).

## Gate 4: Launch readiness

Before requesting launch, the app must meet all of these:

- **Useful:** does the job in the proposal. Core flows work on mobile and desktop.
- **Accessible:** keyboard-operable, has visible focus, uses semantic HTML, sufficient contrast, and labelled controls.
- **Fast and light:** no unnecessary dependencies, and loads quickly on a mid-range phone.
- **Robust:** handles empty, invalid, and large inputs. No console errors. Stored-data formats are versioned if the data persists.
- **Tested:** core logic has Vitest tests. `pnpm verify` passes.
- **Honest docs:** `APP.md`, `PRIVACY.md`, and `README.md` are accurate. `app.json` is complete.
- **Compliant:** uses `ajj-design`, includes the disclosure footer, has no AI-generated media, has asset licenses recorded, and holds all needed approvals.
- **Independently reviewed:** a different agent (preferably a different model family) has reviewed code, UX, privacy, and accessibility, and its findings are resolved or explained.
- **Maintainable:** passes the [maintainability test](PROJECT_CHARTER.md#maintainability-test).

## Launch packet

Open a "Launch approval" issue (template provided). Keep it concise:

| Section | Answer |
|---|---|
| Problem being solved | One paragraph. |
| Intended audience | Who, specifically. |
| Why it is worth shipping | What it does that alternatives don't. |
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
