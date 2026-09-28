# Candidate: Scene Call

## Problem

During a rehearsal period, a director or stage manager has to decide again and again which scenes can be rehearsed on a given night. That depends on two documents kept apart: the scene breakdown (which characters are in each scene, and which characters one performer doubles) and the conflict calendar (who can't make which dates, or arrives late or leaves early). Today the cross-check is done by hand, by eye, across two spreadsheets or a spreadsheet and a paper calendar. It has to be redone for every weekly schedule and every time a new conflict comes in.

Evidence that this recurs and is done by hand:

- Theaterish's guide to French scenes presents the breakdown as the way to schedule around conflicts: "When a breakdown says unit 1-7 is Jack and Lady Bracknell only, an actor's Thursday conflict stops being a scheduling crisis and starts being a Tuesday." ([Theaterish](https://theaterish.com/blogs/news/what-are-french-scenes-rehearsal-scheduling))
- Awesome Stage Manager tells stage managers to add everyone's conflicts to the production calendar, calls this "a time consuming task", and uses the scene breakdown sheet to organize rehearsals around them. ([conflicts](https://awesomestagemanager.wordpress.com/tag/conflicts/), [rehearsal scheduling](https://awesomestagemanager.wordpress.com/2012/02/25/rehearsal-scheduling/))
- Cast98's own help guide says "nothing is more tedious than converting conflict calendars into a master spreadsheet", and describes keeping conflicts in a separate Google Sheets tab. ([Cast98 guide](https://cast98.com/help/guides/best-way-to-make-rehearsal-schedule))
- In a ControlBooth thread where a developer introduced a scheduling tool, directors asked for conflicts in hour or half-hour increments, because school casts are often unavailable for only part of a rehearsal. ([ControlBooth](https://www.controlbooth.com/threads/hello-i-built-an-online-auditions-scheduling-tool-for-theatre-directors.42384/))
- Everything Backstage's free French scene template is a reference sheet. The article says it helps you find which characters are in a scene, but matching that against availability is still manual. ([Everything Backstage](https://everythingbackstage.com/french-scene-breakdown/))

## Audience

Directors and stage managers of community theatre, school drama, and other small productions: typically one or two people running a 6 to 10 week rehearsal period, several productions a year, with little or no budget for production software. They come back during every rehearsal period: when writing each week's schedule, when a conflict changes, and on the day, when someone calls in sick and they need to know what can still be run.

## Proposed solution

A browser app with the production kept on the device:

1. **Breakdown.** List the scenes or units in running order (an optional page range each), the characters, and a scene-by-character grid. Characters played by the same performer are grouped into one *track*, so doubling is handled once.
2. **Conflicts.** For each rehearsal date, mark a track as out, arriving late (at a time), or leaving early (at a time).
3. **Answers:**
   - *Date view:* for a chosen date, every scene is marked runnable, partial (someone in it is late or leaving early, with the time), or blocked (with the missing characters named).
   - *Scene view:* for a chosen scene, the dates on which everyone in it is available.
   - *Call list:* pick the scenes to run on a date, and get the tracks to call, with any late or early notes. It prints cleanly.
4. **Export and import** the production as a JSON file, for backup and for handing it to a co-director or the next stage manager.

No automatic schedule generation, no accounts, and no cast-facing features. The tool answers the cross-check question; the person still writes the schedule.

## Existing alternatives

| Alternative | Link | Does well | Falls short for this audience |
|---|---|---|---|
| Spreadsheet plus a paper or spreadsheet conflict calendar (the default) | [Everything Backstage free template](https://everythingbackstage.com/french-scene-breakdown/), [Awesome Stage Manager](https://awesomestagemanager.wordpress.com/2012/02/25/rehearsal-scheduling/) | Free, flexible, familiar; the breakdown doubles as paperwork for other departments. | The breakdown and the conflicts sit in different places, so which scenes can run on which date is worked out by eye, again for every change. |
| Theaterish French Scene Breakdown (Google Sheets, $3) | [Theaterish](https://theaterish.com/blogs/news/what-are-french-scenes-rehearsal-scheduling) | A ready-made breakdown for up to 30 roles, with a built-in call builder. | Paid. Nothing in the article says it checks conflicts, so matching against availability seems to stay manual. |
| Stagehand | [stagehandapp.com](https://www.stagehandapp.com/), [pricing](https://www.stagehandapp.com/pricing) | Builds whole schedules automatically from scenes and actor conflicts; actors enter their own conflicts; calendar sync. | $75 per production or $25 a month, no free tier, account required. Heavy for a volunteer director who only needs the cross-check. |
| Cast98 | [cast98.com](https://cast98.com/), [rehearsals](https://cast98.com/features/rehearsals), [pricing](https://cast98.com/pricing) | Free tier (1 admin, 40 cast, 50 rehearsal events); conflicts come from audition forms; each rehearsal lists attendees' conflicts. | No scene breakdown, so it shows conflicts for the people you called, not which scenes can run. It needs accounts and collects cast contact and conflict data. |
| StageManager.tech | [features](https://stagemanager.tech/features/for-productions/), [pricing](https://stagemanager.tech/pricing) | Monthly availability grid, conflict warnings, scenes in running order, and much else. | $26.50 a month, no free tier. A full production-management suite, far more than this need. |

## What this does better

1. **Answers "what can we run on this date?" directly.** Given the breakdown, including doubled roles, and the conflicts, it lists every scene as runnable, partial, or blocked and names who is missing. Free spreadsheet templates leave that cross-check to the reader, and the only free hosted tool (Cast98's free tier) has no scene breakdown to check against.
2. **Needs no accounts or cast data.** Everything stays in one person's browser and is keyed by character and track, so no cast names, emails, or phone numbers are needed. Stagehand, Cast98, and StageManager.tech all need accounts, and Stagehand and StageManager.tech charge for them.

## Likely scope and shape

- Client-only static app. State in `localStorage` under `p100:scene-call:`, with a versioned format, and JSON export and import. One production at a time; export it to start another.
- Pure functions for the core logic (the scene status for a date, the available dates for a scene, and the call list), which are easy to unit-test. UI in plain TypeScript or Lit with `ajj-design`, plus print CSS.
- Rough size: 1,500 to 2,500 lines including tests. No dependencies beyond the defaults, no Cloudflare services, no media assets.
- Privacy class: `local-only` (see Escalations needed).

## Screen results

- Useful and specific: pass. A named role (director or stage manager) with a task that recurs weekly through every rehearsal period.
- Not already well solved: pass. The free options leave the cross-check manual; the tools that automate it are paid, account-based suites.
- Not a thin wrapper / generic generator: pass. The value is the breakdown and conflict model, and its queries.
- Not justified by SEO, monetization, novelty alone, or use of AI: pass. No AI, and none of those are part of the case.
- Runs within baseline budget: pass. Static files only.
- No sensitive subject: pass.
- No accounts / personal data / UGC / external API (or approval requested): pass by design, but see Escalations needed.
- Maintainable by a weaker model: pass. A small data model and a few pure functions.

## Risks

- **Too small a step up from a spreadsheet.** A skilled spreadsheet user could build conditional formatting that does part of this. The bet is that most volunteer directors won't, and that doubling and partial conflicts make hand-built sheets fragile.
- **Single device.** The data lives in one browser. Export and import cover backup and handover, but a director and stage manager can't both edit live. Real-time sharing would need a server and accounts, and is out of scope.
- **Users may type names anyway.** Track labels are free text, so someone could type a performer's name instead of the character (for example, for numbered ensemble tracks in a musical). That data still never leaves the device, but it's the reason for the escalation question below.
- **Conflict entry is still manual.** The stage manager still copies conflicts from audition forms. The app doesn't collect them from the cast, which the paid tools do.

## Open questions

- Should conflicts support time windows (late or leaving early) from the first version? Proposed: yes, because the ControlBooth thread shows partial conflicts are common in school productions.
- Should the scene view rank dates, or only list them? Proposed: only list them, and leave scheduling to the person.

## Escalations needed

None.

The app stores data only in the user's browser, sends nothing, and never asks for anyone's name, contact details, or other personal information. Tracks are labelled by character ("Lady Bracknell / Merriman", "Ensemble 3"), and conflicts attach to tracks. Under [PRIVACY_AND_DATA.md](../../docs/PRIVACY_AND_DATA.md#data-classification), `local-only` covers data stored only in the browser. **Question for the Critic:** does free-text labelling, plus dated availability per track, stay `local-only`, or should this be treated as `personal-data` handling and escalated? If the Critic judges it `personal-data`, I'll request owner approval rather than argue the point.

## Critique

| Severity | Finding | Response |
|---|---|---|

## Decision
