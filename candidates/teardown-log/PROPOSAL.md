# Candidate: Teardown Log

<!-- Keep it short. Follow the workflow in docs/APP_ACCEPTANCE.md (steps 4 to 6). Link evidence, and only link pages you have opened and checked. -->

**Idea source:** Originator (`claude-opus-5-5`), from a random seed draw ([step 1](../../docs/APP_ACCEPTANCE.md#1-generate-ideas)): "a watch repair hobbyist | remembering a sequence | it produces a file another program opens".

## Problem

Taking a small machine apart is easy; putting it back is where repairs fail. Screws of different lengths go into different holes, cables route a particular way, and parts come off in an order that has to be reversed. The standard advice is to photograph every step, put screws in a labelled tray, and reassemble in reverse order. Doing that well means keeping three things in step by hand: a camera roll, a tray of screws, and the order.

Evidence:

- On iFixit, a question about safely reassembling delicate electronics got answers to "take pictures of what you are disassembling", record video or write notes on the sequence, keep screws in an ice-cube tray with labelled slots, and "follow disassembly steps in reverse order". No app was mentioned. ([iFixit Answers, 2019](https://www.ifixit.com/Answers/View/576127/%22Best+practices%22+for+reassembly))
- Someone has built a dedicated app for this, which shows the job is recognised: "Disassembly" documents each step with photos and notes, manages parts, and tracks progress during reassembly. ([App Store](https://apps.apple.com/us/app/disassembly/id6757711021))

The evidence of recurrence is the general repair advice. I found no forum thread asking for this tool by name.

## Audience

Hobbyist repairers who take things apart regularly: watch and clock repair, laptop and phone repair, film cameras, sewing machines, game controllers, bicycle hubs, and repair café volunteers. They come back for each repair, and a repair often spans days while parts arrive, which is exactly when the photos and the order get lost.

## Proposed solution

A browser app, on a phone at the bench:

1. **Start a teardown.** Name it ("Seiko 7S26 service").
2. **Log each step.** Take a photo with the phone camera (or pick one). Tap the photo to drop numbered pins where screws or parts came out, and give each pin a short label and the tray compartment it went into ("A3: 2 × short black"). Add a note if needed ("ribbon cable folds under").
3. **Tray map.** Define the compartments of your tray or screw mat once (a grid like A1–C4). The app shows which compartment holds what, and from which step.
4. **Reassemble.** Switch to reassembly and the steps play in reverse, one at a time, each with its photo, pins, and tray compartments, and a "done" tick. Pick up where you left off days later.
5. **Export.** Save the whole log as a single file (photos included) to keep or to pass to someone else, and import it again. Print it as a step-by-step sheet.

## Existing alternatives

| Alternative | Link | Does well | Falls short for this audience |
|---|---|---|---|
| Phone camera roll, a screw tray, and memory or notes (the default) | [iFixit Answers](https://www.ifixit.com/Answers/View/576127/%22Best+practices%22+for+reassembly) | Free and immediate. | Photos get mixed with everything else and don't say which screw went where; the tray isn't linked to the photos; reversing the order is done by scrolling backwards. |
| Disassembly (iOS) | [App Store](https://apps.apple.com/us/app/disassembly/id6757711021) | Purpose-built: steps with photos and notes, parts management, reassembly progress. | iPhone and Apple devices only. Free only for a limited number of projects; premium unlocks unlimited ones. Version 1.0.1, released this year, with too few ratings to show. |
| Writing an iFixit guide | [iFixit: creating a guide](https://www.ifixit.com/Info/Repair_Guide) | Free, structured steps with photos and annotations. | Made for publishing a guide for others, online with an account, not for a private log during a repair. |

I opened the Disassembly listing and iFixit's guide page; I couldn't run Disassembly (iOS).

## What this does better

1. **Free, on any phone, with no project limit.** The one dedicated tool is iOS-only and limits free projects. Android users have no equivalent that I found.
2. **Screw positions and tray compartments are tied to the photo.** Pins on the photo say where each screw came out, and the tray map says where it is now, so reassembly doesn't depend on remembering which compartment matched which photo.

## Likely scope and shape

- Client-only static app. Photos and logs in IndexedDB under `p100:teardown-log:`, with a versioned format. Export and import as one file (a JSON manifest with the images embedded, or a zip built in the browser).
- Camera via the browser's file input with `capture`, which works on mobile without permissions prompts beyond the camera's own.
- Pure, testable core: the log model, reversing steps, the tray map, export and import round-tripping. Photos are resized in the browser before saving.
- Rough size: 2,000 to 3,000 lines including tests. No dependencies beyond the defaults, no Cloudflare services, no media assets.
- Privacy class: `local-only`. Photos stay in the browser unless the user exports them.

## Screen results

- Useful and specific: pass. Hobbyist repairers, for every repair.
- Not already well solved: pass. The dedicated tool is iOS-only and limits free use.
- Not a thin wrapper / generic generator: pass.
- Not justified by SEO, monetization, novelty alone, or use of AI: pass.
- Runs within baseline budget: pass. Static files only.
- No sensitive subject: pass. It records the user's own repair; it gives no repair or safety advice.
- No accounts / personal data / UGC / external API (or approval requested): pass. Photos are the user's own and stay on the device (owner ruling on [#21](https://github.com/ajustinjames/project-100/issues/21)).
- Maintainable by a weaker model: pass.

## Risks

- **The camera roll may be good enough.** Many repairers will keep taking photos and use a magnetic mat. The bet is that pins and the tray map save real mistakes on fiddly jobs.
- **Storage.** Dozens of photos per teardown use space; browsers may evict data. Resize on import, show usage, and prompt to export finished logs.
- **Mobile camera and storage quirks**, especially on iOS Safari. Test early.

## Open questions

- Should it record video clips? Proposed: no; photos and notes.
- Should a finished log export as a printable PDF? Proposed: print through the browser's print to PDF.

## Escalations needed

None.

## Critique

[Critique by Critic (gpt-6-sol, effort high)](https://github.com/ajustinjames/project-100/pull/36#issuecomment-5932967921), recommending reject. Every finding is accepted; none is dismissed.

| Severity | Finding | Response |
|---|---|---|
| Critical | A free tool appears to do the same job on both phone platforms: PartMemo. | Accepted, and checked. [PartMemo](https://partmemo.meskatech.net/) photographs each step, labels containers with quantities, shows the steps in reverse for reassembly with progress, and exports archives or PDFs. Every feature is free, with "No account, backend, AI processing, ads or telemetry", on iPhone, iPad, and Android. That is the same job, free, on the devices this audience uses, which is a kill under step 3. My research found only the iOS Disassembly app. |
| High | The Android gap is false: ScrewTrail pins screws on step photos, maps them to tray cells, and replays in reverse. | Accepted. ScrewTrail even has the pin-and-tray interaction this proposal claimed as its difference. |
| High | Switching is unproven, and the iFixit question was about safe physical reassembly, not order. | Accepted. I misread the evidence: that question is about handling fragile parts, not remembering the order. |
| Medium | The photo record needs a reliability gate. | Accepted. Moot, given the rejection. |

## Decision

2026-10-01: Rejected because partMemo, a free app for iPhone, iPad, and Android with no account, already documents disassembly with annotated step photos and labelled containers, plays the steps back in reverse for reassembly, and exports projects.
