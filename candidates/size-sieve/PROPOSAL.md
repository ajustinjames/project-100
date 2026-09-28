# Candidate: Size Sieve

## Problem

Garment patterns for knitting and crochet are graded across many sizes, and they print every size's number side by side in every instruction: "cast on 80 (88, 96, 104, 112) sts", "work 4 (4, 6, 6, 8) rows". They run through the whole pattern. Before starting, the knitter goes through the whole pattern with a highlighter, or with the highlight tool in a PDF app, marking their size's number in each one. Even so, it's easy to pick the wrong number mid-project.

The standard advice is to mark your size by hand:

- Tin Can Knits: "go through the pattern before you begin and highlight or underline all the instructions for the size you're working." They also warn about the classic misreading: "Don't cast on 66, then 72, then 78; find the number for your size." ([tin can knits](https://blog.tincanknits.com/2020/10/08/reading-multi-size-knitting-pattern-instructions/))
- Arnall-Culliford Knitwear: highlight the numbers you need or strike out the ones you don't. "No matter how long you have been knitting this is a GOOD IDEA that will save many a mistake." They also say it matters more in a ten-size garment than in a four-size hat. ([A-C Techniques](https://www.actechniques.co.uk/blog/2021/5/17/knitting-know-how-understanding-a-pattern-with-multiple-sizes))
- Elizabeth Smith Knits describes the format variants designers use: `small (large)`; grouped parentheses such as `1 (2, 3, 4, 5) (6, 7, 8, 9)`; alternating European style `XXS (XS) S (M) L`; and `x` or `-` as a placeholder where an instruction doesn't apply to a size. ([Elizabeth Smith Knits](https://elizabethsmithknits.com/2026/08/06/how-patterns-use-parentheses-to-organize-sizes/))
- Donna Jones Designs gives a knitter stuck on a vintage multi-size pattern the same advice: mark your size's instructions with a highlighter as you go. ([Donna Jones Designs](https://www.donnajonesdesigns.co.uk/blog/2020/05/15/reading-knitting-patterns-multiple-sizes))

Designers and app makers are building features for exactly this, which is further evidence that it recurs. Tin Can Knits built a free app where you "see ONLY your size and options as you tap through the pattern", but only for their own patterns ([Tin Can Knits](https://blog.tincanknits.com/share-the-tin-can-knits-app/)). The apps under Existing alternatives do it for other patterns.

## Audience

Knitters and crocheters who make garments from multi-size patterns, typically bought as PDFs from designers or on Ravelry. The problem recurs with every new multi-size pattern. They'd come back for each new pattern, and reopen a saved one while working on it, which for a garment usually takes weeks.

## Proposed solution

A browser app that works on the device:

1. **Open a pattern.** Open the PDF (its text is extracted in the browser), or paste the text.
2. **Pick your size.** The app finds the pattern's size list (for example, "Sizes: XS (S, M, L, XL, 2XL)") and asks which one is yours. If it finds no size list, you enter the number of sizes and pick a position.
3. **Read one size.** Every size sequence that matches the size count is replaced by your number, highlighted so you can see it was substituted. The formats it handles are `a (b, c, d)`, `a [b, c, d]`, `a (b, c) (d, e)`, `a/b/c/d`, and `-` or `x` placeholders, which are shown as "doesn't apply to your size".
4. **Check what it did.** Every substituted number is marked, and tapping it shows the original sequence, so a wrong substitution is always visible. Groups the parser can't place (a count that doesn't match the size list, or size-labelled instructions such as "sizes 1–3 only") are left as written and listed for the knitter to read. Stitch-pattern parentheses such as "(k2, p2)" are ignored, because they aren't all numbers. The app doesn't claim to catch every size-specific number. Text lost or reordered during PDF extraction can't be detected by counting, so the app shows the extracted text and says to check it against the PDF.
5. **Keep it.** Resolved patterns are saved in the browser (IndexedDB) with your chosen size, and can be reopened, switched to another size, or deleted. It can print the resolved text.

Charts and schematics are images, so they aren't reproduced. The resolved text is read alongside the original PDF. No sharing feature: patterns are usually copyrighted, so the resolved text stays with the person who owns the pattern.

## Existing alternatives

| Alternative | Link | Does well | Falls short for this audience |
|---|---|---|---|
| Highlighter on a printed pattern (the default) | [tin can knits](https://blog.tincanknits.com/2020/10/08/reading-multi-size-knitting-pattern-instructions/), [A-C Techniques](https://www.actechniques.co.uk/blog/2021/5/17/knitting-know-how-understanding-a-pattern-with-multiple-sizes) | Free, universal, and keeps charts and layout. | Every number is marked by hand. The other sizes' numbers are still printed alongside, so misreads still happen. |
| Highlighting in a PDF app: My Row Counter, knitCompanion | [My Row Counter](https://rowcounterapp.com/), [knitCompanion review](https://pdxknitterati.com/2019/05/30/knitcompanion-review/) | Keep the original PDF; add row tracking and counters. My Row Counter's highlighter is free. | Highlighting is manual, one number at a time. knitCompanion's highlighting is in its paid Essentials tier ($9.99 a year in that 2019 review). |
| Rowtine (Android) | [F-Droid](https://f-droid.org/en/packages/com.rowtine.app/), [GitHub](https://github.com/alxia0/rowtine) | Free, Apache-2.0, offline, no account. Imports a PDF and filters "every number in the text... down to the chosen size", in four languages, with row tracking, charts, and stash management. | Android only, with no iOS or web version mentioned. Knitters on iPhone, iPad, or a computer can't use it. |
| Tin Can Knits app | [Tin Can Knits](https://blog.tincanknits.com/share-the-tin-can-knits-app/) | Free; shows only your size, one instruction at a time. | Only for Tin Can Knits' own patterns in its in-app format, not a PDF bought elsewhere. |
| TrixiStitches (browser) | [trixistitches.com](https://trixistitches.com/), [pricing](https://trixistitches.com/pricing) | Runs in the browser, keeps pattern files on the device, imports any PDF, and highlights your size automatically in place, keeping the layout. Free tier with counters and glossaries; no account needed to start. | Automatic size highlighting is a Pro feature (€49.90 a year, or Ultimate at €89.90). |
| InterTwined (iOS) | [tryintertwined.com](https://www.tryintertwined.com/) | Extracts a pattern for a chosen size automatically, and adds row tracking. | iOS only. It uploads the pattern to be processed by a commercial LLM API. Three free extractions, then paid credits ($4.99 packs). |
| Grading tools for pattern *designers* | [KnitGrader](https://knitgrader.com/pattern-grading-generator/) | Compute per-size numbers from gauge and measurements when writing a pattern. | They don't read a pattern you bought, so they don't solve this. |

## What this does better

1. **Free, automatic size filtering for any pattern, in any browser, without uploading it.** Every automatic option either costs money or is limited to one platform or one publisher. TrixiStitches does it in the browser only in its €49.90-a-year Pro tier. InterTwined is iOS-only, paid after three patterns, and sends the pattern to an LLM API. Rowtine is free but Android-only, and the Tin Can Knits app covers only its own patterns. A knitter on an iPhone, iPad, or computer has no free automatic option for a pattern bought elsewhere.
2. **Every substitution is visible and reversible.** Each replaced number is marked and shows its original sequence, and unresolved groups are listed. The knitter can check the tool's work at a glance, instead of trusting a language model's rewrite (InterTwined) or an unmarked filtered text.

Rowtine and TrixiStitches show that on-device size filtering is feasible and valued enough to charge for. This candidate's difference is narrow but checkable: it is free and works on every platform. The second point is a design commitment, not a verified advantage over Rowtine, whose documentation doesn't say how it shows substitutions.

## Likely scope and shape

- Client-only static app. IndexedDB under `p100:size-sieve:` with a versioned record format, and export and import of saved patterns as a JSON file.
- The core is a pure, heavily unit-tested parser: find the size list, find sequences, resolve or flag them. Tests use short synthetic snippets written for the tests, not copied patterns.
- One runtime dependency: `pdfjs-dist` (Mozilla, Apache-2.0) for text extraction from PDFs in the browser. Parsing PDFs is the kind of hard problem [DEPENDENCIES.md](../../docs/DEPENDENCIES.md) says to use a library for. Pasting text works without it, so it is loaded only when a PDF is opened.
- UI in plain TypeScript or Lit with `ajj-design`, plus print CSS. Rough size: 1,500 to 2,500 lines including tests. No Cloudflare services and no media assets.
- Privacy class: `local-only`. Pattern text and the chosen size stay in the browser. Like every app, it will get the standard cookieless analytics beacon once live; pattern content is never sent.

**Labs feasibility gate.** Labs exists to test this, and the first build task is a measurement, before any polish. Run the parser on at least ten lawfully obtained free patterns from at least six designers, covering the formats above. Test locally; never commit them. Record per-pattern results in `APP.md`: size sequences resolved correctly, flagged, missed, and substituted wrongly. Discard the prototype unless all of these hold:

- every substitution, right or wrong, is visibly marked;
- wrong substitutions stay rare: none in at least eight of the ten patterns, and no more than 1% of all size sequences across the set;
- in the median pattern, at least four in five size sequences resolve correctly.

## Screen results

- Useful and specific: pass. Garment knitters and crocheters, and a step they repeat for every pattern.
- Not already well solved: pass, narrowly. Rowtine solves it for free on Android, and TrixiStitches solves it in the browser for €49.90 a year. On iPhone, iPad, and computers there is no free automatic option.
- Not a thin wrapper / generic generator: pass. It's a domain-specific parser; no API and no AI.
- Not justified by SEO, monetization, novelty alone, or use of AI: pass.
- Runs within baseline budget: pass. Static files only.
- No sensitive subject: pass.
- No accounts / personal data / UGC / external API (or approval requested): pass. The user's own pattern text stays on their device; no personal data is asked for.
- Maintainable by a weaker model: pass. A small parser with thorough tests, and one well-known library.

## Risks

- **PDF text extraction quality.** Multi-column layouts, tables, and text drawn as images can come out out of order or not at all; PDF.js has had reported reading-order failures ([example](https://github.com/mozilla/pdf.js/issues/14493), since closed). Counting can't detect lost text. Mitigation: show the extracted text for checking against the PDF, accept pasted text, and measure the effect in the feasibility gate. Scanned or image-only PDFs aren't supported, and the app says so.
- **Format variety.** Designers vary (grouped parentheses, European alternation, size-labelled instructions, size tables instead of inline numbers). The parser won't handle everything, and handling every exception could outgrow the maintenance budget. The feasibility gate above decides whether the common formats are enough. Unhandled formats are listed, not chased one by one.
- **Rowtine could add iOS or web, or TrixiStitches could make size highlighting free.** If a free tool covers these platforms before or during Labs, re-run the screen and discard if this no longer does anything better.
- **Losing layout.** Reading resolved text beside the original PDF is a real cost compared with highlighting in place. Adding highlights to the PDF itself would be far more complex and is out of scope.
- **Copyright.** Patterns are copyrighted. The app keeps the user's own copy on their device and offers no sharing or publishing. Test fixtures are written from scratch.

## Open questions

- Should the first version open PDFs, or accept pasted text only? Proposed: open PDFs, because patterns almost always arrive as PDFs and paste-only adds friction at the first step. If Labs shows extraction is unreliable, fall back to paste-only and drop the dependency.
- Should it highlight sizes in place on the rendered PDF (pdf.js text layer), rather than showing extracted text? TrixiStitches' in-place highlighting keeps charts and layout, which would answer the switching concern. Decide in the build brief; it doesn't change the data model or the parser.
- Should it add row tracking? Proposed: no. Dedicated counter apps do that well, and this tool should stay small.

## Escalations needed

None. It runs entirely in the browser, sends no pattern content, has no accounts, and handles no personal data (a pattern's text and a chosen size). It touches no sensitive subject and uses no external API.

## Critique

[Critique by Critic (gpt-6-sol, effort high)](https://github.com/ajustinjames/project-100/pull/14#issuecomment-5880733769), recommending revise. No finding is dismissed. Both High findings are answered by revising the proposal, so it goes back to the Critic.

| Severity | Finding | Response |
|---|---|---|
| High | A free automatic alternative is missing: Rowtine (Android) filters imported PDFs to a selected size. | Accepted and checked. [Rowtine](https://f-droid.org/en/packages/com.rowtine.app/) is free, Apache-2.0, offline, and deterministic, but Android only, and [its README](https://github.com/alxia0/rowtine) mentions no iOS or web version. I also found that the [Tin Can Knits app](https://blog.tincanknits.com/share-the-tin-can-knits-app/) does this, but only for its own patterns. Both are added to the alternatives. "What this does better" now rests on platform reach (iPhone, iPad, computers, no install) and visible substitutions, not on being the only free automatic tool. A new risk says to discard it if Rowtine or another free tool reaches these platforms. |
| High | The safety claim needs evidence: count-matching can't prove a sequence is size-specific or detect text lost in extraction. | Accepted. The "nothing is silently guessed" promise is withdrawn. The guarantee is now narrower and checkable: every substitution is marked and shows its original, unresolved groups are listed, and the app says extracted text must be checked against the PDF. Evidence of reliability is made the Labs feasibility gate: at least ten free patterns from at least six designers, results recorded in `APP.md`, and discard if a wrong substitution isn't visible or fewer than about four in five sequences resolve. Feasibility is supported by Rowtine's deterministic filter, which already exists. |
| Medium | Switching from annotated PDFs is unproven; "several garments a year" and "150 marks" are unverified. | Partly accepted. Both unverified figures are removed. The case for switching now rests on the Tin Can Knits app, a designer building exactly this "only your size" view, alongside Rowtine and InterTwined. The proposal no longer claims the tool replaces the PDF: the knitter reads it next to the PDF for charts, and the feasibility gate tests whether it's worth using. |
| Medium | The Patternism and FiberTools links couldn't be verified. | Both removed. Neither was needed for the comparison, and My Row Counter and knitCompanion cover manual highlighting. (Both pages opened for me on 2026-09-28, but a claim the Critic can't check shouldn't carry weight.) |
| Low | "Nothing leaves your device" overstates privacy, given standard analytics. | Accepted. The description now says the pattern never leaves your device, and the scope notes the standard analytics beacon once live. |

[Critique round 2](https://github.com/ajustinjames/project-100/pull/14#issuecomment-5880919773), recommending revise. It resolves round-1 findings 1, 4, and 5, and marks 2 and 3 as partly resolved. This was the second and last round (step 6), so I adopted every requested change and decided. No finding is dismissed.

| Severity | Finding (round 2) | Response |
|---|---|---|
| High (round 1, partly resolved) | The feasibility gate could pass with many wrong substitutions; add a separate limit and assess per pattern. | Accepted exactly as asked. The gate now records per-pattern results and requires no wrong substitutions in at least eight of ten patterns, at most 1% wrong across all sequences, and at least four in five correct in the median pattern, as well as every substitution being visibly marked. |
| Medium (round 1, partly resolved) | Demand for a single-size view is shown, but not that users of arbitrary PDFs will accept losing layout. | Accepted as a Labs question. It's now an open question for the build brief: highlight in place on the rendered PDF, as TrixiStitches does, which keeps charts and layout. |
| Medium | TrixiStitches, a browser tool, is missing: automatic size highlighting in its paid Pro tier. | Accepted and checked ([pricing](https://trixistitches.com/pricing)). Added to the alternatives. "What this does better" and the screen line are rewritten: the difference is now free on every platform, stated as narrow. |
| Low | The cited PDF.js issue is closed, not open. | Fixed ("reported reading-order failures, since closed"). |
| (Gate 1 note) | The visibly-reversible-substitutions advantage over Rowtine isn't verified. | Accepted. It's now described as a design commitment, not a verified advantage. |

## Decision

2026-09-28: Selected for Labs because it's the only free way to filter any multi-size pattern to one size on iPhone, iPad, and computers. The alternatives are Android-only (Rowtine), paid (TrixiStitches Pro at €49.90 a year, InterTwined), or publisher-only (Tin Can Knits). The problem recurs with every multi-size pattern, and the default workaround is highlighting by hand. The critique shaped it: the advantage is stated as narrow and checkable (free, every platform), the reliability promise was replaced by a strict Labs feasibility gate with discard criteria, and in-place PDF highlighting is left as a build-brief question. Needs no escalations.
