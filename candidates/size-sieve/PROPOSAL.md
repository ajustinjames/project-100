# Candidate: Size Sieve

## Problem

Garment patterns for knitting and crochet are graded across many sizes, and they print every size's number side by side in every instruction: "cast on 80 (88, 96, 104, 112) sts", "work 4 (4, 6, 6, 8) rows". A sweater pattern contains dozens to hundreds of these sequences. Before starting, the knitter goes through the whole pattern with a highlighter, or with the highlight tool in a PDF app, marking their size's number in each one. Even so, it's easy to pick the wrong number mid-project.

The standard advice is to mark your size by hand:

- Tin Can Knits: "go through the pattern before you begin and highlight or underline all the instructions for the size you're working." They also warn about the classic misreading: "Don't cast on 66, then 72, then 78; find the number for your size." ([tin can knits](https://blog.tincanknits.com/2020/10/08/reading-multi-size-knitting-pattern-instructions/))
- Arnall-Culliford Knitwear: highlight the numbers you need or strike out the ones you don't. "No matter how long you have been knitting this is a GOOD IDEA that will save many a mistake." They also say it matters more in a ten-size garment than in a four-size hat. ([A-C Techniques](https://www.actechniques.co.uk/blog/2021/5/17/knitting-know-how-understanding-a-pattern-with-multiple-sizes))
- Elizabeth Smith Knits describes the format variants designers use: `small (large)`; grouped parentheses such as `1 (2, 3, 4, 5) (6, 7, 8, 9)`; alternating European style `XXS (XS) S (M) L`; and `x` or `-` as a placeholder where an instruction doesn't apply to a size. ([Elizabeth Smith Knits](https://elizabethsmithknits.com/2026/08/06/how-patterns-use-parentheses-to-organize-sizes/))
- Donna Jones Designs gives a knitter stuck on a vintage multi-size pattern the same advice: mark your size's instructions with a highlighter as you go. ([Donna Jones Designs](https://www.donnajonesdesigns.co.uk/blog/2020/05/15/reading-knitting-patterns-multiple-sizes))

Commercial apps building features for this (below) are further evidence that the problem recurs.

## Audience

Knitters and crocheters who make garments from multi-size patterns, typically bought as PDFs from designers or on Ravelry. The problem recurs with every new garment pattern, and garment knitters start several a year. They'd come back for each new pattern, and reopen a saved one while working on it over weeks.

## Proposed solution

A browser app that works on the device:

1. **Open a pattern.** Open the PDF (its text is extracted in the browser), or paste the text.
2. **Pick your size.** The app finds the pattern's size list (for example, "Sizes: XS (S, M, L, XL, 2XL)") and asks which one is yours. If it finds no size list, you enter the number of sizes and pick a position.
3. **Read one size.** Every size sequence that matches the size count is replaced by your number, highlighted so you can see it was substituted. The formats it handles are `a (b, c, d)`, `a [b, c, d]`, `a (b, c) (d, e)`, `a/b/c/d`, and `-` or `x` placeholders, which are shown as "doesn't apply to your size".
4. **See what it couldn't resolve.** Any parenthesized group that looks like a size sequence but has the wrong count, and any other ambiguity, is left as written and flagged in a list, so nothing is silently guessed. Stitch-pattern parentheses such as "(k2, p2)" are ignored, because they aren't all numbers.
5. **Keep it.** Resolved patterns are saved in the browser (IndexedDB) with your chosen size, and can be reopened, switched to another size, or deleted. It can print the resolved text.

Charts and schematics are images, so they aren't reproduced. The resolved text is read alongside the original PDF. No sharing feature: patterns are usually copyrighted, so the resolved text stays with the person who owns the pattern.

## Existing alternatives

| Alternative | Link | Does well | Falls short for this audience |
|---|---|---|---|
| Highlighter on a printed pattern (the default) | [tin can knits](https://blog.tincanknits.com/2020/10/08/reading-multi-size-knitting-pattern-instructions/), [A-C Techniques](https://www.actechniques.co.uk/blog/2021/5/17/knitting-know-how-understanding-a-pattern-with-multiple-sizes) | Free, universal, and keeps charts and layout. | Every number is marked by hand, so a large pattern takes a long time. The other sizes' numbers are still printed alongside, so misreads still happen. |
| Highlighting in a PDF app: My Row Counter, Patternism, knitCompanion | [My Row Counter](https://rowcounterapp.com/), [Patternism](https://patternism.net/), [knitCompanion review](https://pdxknitterati.com/2019/05/30/knitcompanion-review/) | Keep the original PDF; add row tracking and counters. My Row Counter's highlighter is free. | Highlighting is still manual, one number at a time. knitCompanion's highlighting is in its paid Essentials tier ($9.99 a year in that 2019 review). |
| InterTwined | [tryintertwined.com](https://www.tryintertwined.com/) | Extracts a pattern for a chosen size automatically, and adds row tracking. | iOS only. It uploads the pattern to be processed by a commercial LLM API. Three free extractions, then paid credits ($4.99 packs). |
| General tools for pattern *designers* (grading generators, calculators) | [KnitGrader](https://knitgrader.com/pattern-grading-generator/), [FiberTools](https://fibertools.app/blog/reading-knitting-patterns-guide) | Compute per-size numbers when writing or resizing a pattern. | They work on your gauge and measurements, not on a pattern you bought. None of them reads a pattern and picks out your size. |

## What this does better

1. **Resolves every size sequence in one step, for free, with nothing uploaded.** Compared with manual highlighting, a pattern with 150 size sequences needs one size pick instead of 150 marks. Compared with InterTwined, it runs in any browser, has no per-pattern cost, and keeps the pattern on the device.
2. **Deterministic, with the uncertain parts shown.** Sequences whose count doesn't match the size list are listed for the knitter to check, rather than resolved by a language model that may guess. The knitter can see which numbers were substituted and which weren't.

## Likely scope and shape

- Client-only static app. IndexedDB under `p100:size-sieve:` with a versioned record format, and export and import of saved patterns as a JSON file.
- The core is a pure, heavily unit-tested parser: find the size list, find sequences, resolve or flag them. Tests use short synthetic snippets written for the tests, not copied patterns.
- One runtime dependency: `pdfjs-dist` (Mozilla, Apache-2.0) for text extraction from PDFs in the browser. Parsing PDFs is the kind of hard problem [DEPENDENCIES.md](../../docs/DEPENDENCIES.md) says to use a library for. Pasting text works without it, so it is loaded only when a PDF is opened.
- UI in plain TypeScript or Lit with `ajj-design`, plus print CSS. Rough size: 1,500 to 2,500 lines including tests. No Cloudflare services and no media assets.
- Privacy class: `local-only`. Patterns and the chosen size stay in the browser.

## Screen results

- Useful and specific: pass. Garment knitters and crocheters, and a step they repeat for every pattern.
- Not already well solved: pass. The free options are manual. The only automatic tool is paid after three uses, iOS only, and uploads patterns to an LLM.
- Not a thin wrapper / generic generator: pass. It's a domain-specific parser; no API and no AI.
- Not justified by SEO, monetization, novelty alone, or use of AI: pass.
- Runs within baseline budget: pass. Static files only.
- No sensitive subject: pass.
- No accounts / personal data / UGC / external API (or approval requested): pass. The user's own pattern text stays on their device; no personal data is asked for.
- Maintainable by a weaker model: pass. A small parser with thorough tests, and one well-known library.

## Risks

- **PDF text extraction quality.** Multi-column layouts, tables, and text drawn as images can come out out of order or not at all. Mitigation: show the extracted text for checking, and accept pasted text. Scanned or image-only PDFs aren't supported, and the app says so.
- **Format variety.** Designers vary (grouped parentheses, European alternation, size tables instead of inline numbers). The parser won't handle everything; the flag list is how that is kept safe. How much of a typical pattern resolves cleanly is the main open question, and the first Labs test.
- **Losing layout.** Reading resolved text beside the original PDF is a real cost compared with highlighting in place. Adding highlights to the PDF itself would be far more complex and is out of scope.
- **Copyright.** Patterns are copyrighted. The app keeps the user's own copy on their device and offers no sharing or publishing. Test fixtures are written from scratch.

## Open questions

- Should the first version open PDFs, or accept pasted text only? Proposed: open PDFs, because patterns almost always arrive as PDFs and paste-only adds friction at the first step. If Labs shows extraction is unreliable, fall back to paste-only and drop the dependency.
- Should it add row tracking? Proposed: no. Dedicated counter apps do that well, and this tool should stay small.

## Escalations needed

None. It runs entirely in the browser, sends nothing, has no accounts, and handles no personal data (a pattern's text and a chosen size). It touches no sensitive subject and uses no external API.

## Critique

| Severity | Finding | Response |
|---|---|---|

## Decision
