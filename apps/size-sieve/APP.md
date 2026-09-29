# Size Sieve

<!-- Keep this document current. It is the product and architecture record for this app. -->

**Status: discarded from Labs on 2026-09-29** after failing its feasibility gate. See [Feasibility gate results](#feasibility-gate-results) and [RETRO.md](RETRO.md). The code was removed; it remains in the history of [#22](https://github.com/ajustinjames/project-100/pull/22) (parser), [#23](https://github.com/ajustinjames/project-100/pull/23) (PDF extraction and gate harness), and the unmerged branch [`size-sieve/parser-fix-round`](https://github.com/ajustinjames/project-100/tree/size-sieve/parser-fix-round).

## Problem

Knitting and crochet patterns print every size's numbers side by side in each instruction ("cast on 80 (88, 96, 104, 112) sts"). The standard advice is to go through the whole pattern before starting and highlight your size's number in every sequence ([tin can knits](https://blog.tincanknits.com/2020/10/08/reading-multi-size-knitting-pattern-instructions/), [Arnall-Culliford](https://www.actechniques.co.uk/blog/2021/5/17/knitting-know-how-understanding-a-pattern-with-multiple-sizes)). Even so, it's easy to follow the wrong number. This recurs with every multi-size pattern.

## Audience

Knitters and crocheters working from multi-size patterns, typically PDFs bought from designers or on Ravelry, who read them on an iPhone, iPad, or computer. They come back for each new pattern, and reopen a saved one while working on it.

## Scope

**In scope:**

- Open a pattern PDF (text extracted in the browser) or paste pattern text.
- Detect the pattern's size list, or let the knitter give the number of sizes, and pick a size.
- Replace each size sequence (`a (b, c)`, `a [b, c]`, grouped `a (b, c) (d, e)`, `a/b/c`, with `-` or `x` placeholders) with the chosen size's value. Mark every substitution and show its original sequence.
- List the groups the parser couldn't place (count mismatches, size-labelled instructions) without changing them.
- Save resolved patterns in the browser with the chosen size; reopen, switch size, delete, export and import. Print.

**Explicitly out of scope:**

- Row tracking, counters, stash management (dedicated apps do these well).
- Sharing or publishing patterns (patterns are usually copyrighted).
- Scanned or image-only PDFs (no OCR).
- Resizing or grading patterns to new measurements.
- Any server processing, AI, or accounts.

## Alternatives researched

Full comparison and sources in [PROPOSAL.md](PROPOSAL.md#existing-alternatives). In short:

- **Highlighter, or manual highlights in a PDF app** (My Row Counter, knitCompanion): free or cheap, keeps the layout, but manual and error-prone.
- **Rowtine:** free, open-source, deterministic, and offline, but Android only.
- **TrixiStitches:** browser-based and on-device, with automatic size highlighting in place, but only in its Pro tier (€49.90 a year).
- **InterTwined:** automatic, but iOS only, uploads patterns to an LLM API, and is paid after three patterns.
- **Tin Can Knits app:** free "only your size" view, but only for its own patterns.

Worth building because none is free and automatic on iPhone, iPad, or computers for a pattern bought elsewhere. The difference is narrow, so it has to be proved in Labs (see the feasibility gate).

## Product decisions

- 2026-09-28: Entered Labs as app #1. It was selected after two critique rounds ([candidate PR #14](https://github.com/ajustinjames/project-100/pull/14), [round 1](https://github.com/ajustinjames/project-100/pull/14#issuecomment-5880733769), [round 2](https://github.com/ajustinjames/project-100/pull/14#issuecomment-5880919773)) because it would be the only free way to filter any multi-size pattern to one size on iPhone, iPad, and computers, for a problem that recurs with every pattern. No escalations apply.
- 2026-09-28: The first build task is a feasibility measurement, before any UI polish. Run the parser on at least ten lawfully obtained free patterns from at least six designers, locally, and never commit them. Record per-pattern counts here: size sequences resolved correctly, flagged, missed, and substituted wrongly. **Discard the prototype** unless (a) every substitution is visibly marked, (b) wrong substitutions occur in at most two of the ten patterns and are at most 1% of all size sequences, and (c) the median pattern resolves at least four in five size sequences correctly. This gate came from the critique.
- 2026-09-28: Open for the build brief: show sizes by highlighting in place on the rendered PDF (pdf.js text layer), which keeps charts and layout, or as resolved extracted text. The parser and data model are the same either way.
- 2026-09-28: Keep a free tool on every platform as the reason to exist. If Rowtine ships on iOS or the web, or TrixiStitches makes size highlighting free, re-run the screen and discard if this no longer does anything better.
- 2026-09-29: Gate run 1 failed: 9 size-block substitutions counted wrong across 5 patterns, or 9/420 counted sequences (2.14%). Size-block entries remain outside the denominator; any substitution aligned to one counts as wrong. Figure entries remain reportable outside the denominator; correct substitutions are not wrong, and wrong-valued substitutions are wrong. Alignment uses parsed source values, and missed entries are searched only between neighboring aligned source spans. A gate verdict requires an eligible profile: the main cohort has at least 10 patterns from 6 distinct designers, and a holdout has at least 5 patterns from 5 distinct designers with no designer shared with the main cohort. The CLI defaults to the main profile when no mode is selected.
- 2026-09-29: One parser-fix round, with its rules frozen on the [build brief](https://github.com/ajustinjames/project-100/issues/20#issuecomment-5884671326) before the holdout was opened: protect the size/measurement block by extent (curly inch marks, dual units, commas in labels, blank lines and notes inside the block), detect a size list on the lines after a `Size`/`Sizes` heading, accept dashes inside brackets (`82(92-102-112)`) and numbers attached to stitch abbreviations (`k5 (7, 7, 8)`), both only at an exact count.
- 2026-09-29: **Discarded.** After the fix round, the main cohort still failed (6 wrong / 420, 1.43%) and the untouched holdout failed its median (50% correct against 80%). The brief allowed one fix round and then required the holdout to pass, so this is a discard rather than another round. The build brief's owner-approval question ([#21](https://github.com/ajustinjames/project-100/issues/21)) no longer needs a decision.

## Feasibility gate results

Method (from the [build brief](https://github.com/ajustinjames/project-100/issues/20)): every size sequence in each pattern was annotated by hand from the original (rendered PDF or web page), in document order, before any parser ran on it. A local harness extracted PDFs with the app's own extractor, resolved every size, and aligned the output to the annotations. The pattern files and annotations are local and never committed. "Correct" means substituted with the right value; "Wrong" includes any substitution in the size/measurement block (the brief says to leave that block as written; every one of these had the correct value for the chosen size); "Missed" means in the extracted text but neither substituted nor flagged; "Lost" means not recoverable from the extracted text. Size-block and schematic entries are outside the denominator.

**Main cohort** (frozen before run 1): 10 patterns, 9 designers, 6 PDFs and 4 web pages, 9 knit and 1 crochet.

| Pattern | Designer | Source | Counted | Run 1: correct / flagged / wrong / missed / lost | Run 2 (fix round): correct / flagged / wrong / missed / lost | Size count detected (run 2) |
|---|---|---|---:|---|---|---|
| Avery | Berroco Design Team | PDF | 8 | 0 / 0 / 0 / 8 / 0 | 8 / 0 / 0 / 0 / 0 | no |
| Crochet Landscape Sweater | Yarnspirations (Caron) | PDF, crochet | 21 | 0 / 0 / 0 / 21 / 0 | 16 / 0 / 0 / 5 / 0 | no |
| Classic Cables Pullover | Therese Chynoweth (Cascade) | PDF | 74 | 66 / 0 / 1 / 8 / 0 | 74 / 0 / 0 / 0 / 0 | wrong (10, not 8) |
| Multicolor Slipped Stitch Cardigan | Deborah Newton (Cascade) | PDF | 64 | 62 / 0 / 3 / 2 / 0 | 62 / 0 / 0 / 2 / 0 | yes |
| Dots and Drops | DROPS Design | web | 34 | 0 / 0 / 0 / 34 / 0 | 23 / 2 / 0 / 9 / 0 | yes |
| Challenge Accepted | Laura Corbett (Knitty) | web | 71 | 70 / 0 / 2 / 0 / 1 | 68 / 0 / 0 / 2 / 1 | yes |
| Cooped Up | Pam Sluter (Knitty) | web | 64 | 63 / 0 / 2 / 1 / 0 | 63 / 0 / 0 / 1 / 0 | yes |
| Adult Raglan Sleeve Pullover | Lion Brand | PDF | 21 | 16 / 0 / 0 / 5 / 0 | 16 / 0 / 2 / 5 / 0 | no |
| Wisteria Shawl Collar Pullover | Lion Brand | PDF | 23 | 22 / 0 / 0 / 1 / 0 | 22 / 0 / 4 / 1 / 0 | no |
| Top + Bottom Top | Laura Ferguson (Purl Soho) | web | 40 | 35 / 0 / 1 / 4 / 1 | 38 / 0 / 0 / 2 / 0 | yes |
| **Total** | | | **420** | **9 wrong (2.14%) in 5 patterns; median 88%: FAIL** | **6 wrong (1.43%) in 2 patterns; median 96%: FAIL** | |

**Holdout** (frozen after the fix-round rules and before any parser ran on it): 5 patterns, 5 designers not in the main cohort, 1 PDF and 4 web pages, 2 knit and 3 crochet.

| Pattern | Designer | Source | Counted | Correct / flagged / wrong / missed / lost |
|---|---|---|---:|---|
| Echo | Kate Agner (Knitty) | web | 60 | 55 / 0 / 0 / 3 / 2 |
| Easy All Double Crochet Cardigan | Breann (Hooked on Homemade Happiness) | web, crochet | 21 | 0 / 0 / 0 / 7 / 14 |
| Camille Cardi | Ashlea (Heart Hook Home) | web, crochet | 50 | 4 / 3 / 0 / 31 / 12 |
| Easy Rectangle Cardigan | Delia (Delia Creates) | web, crochet | 36 | 18 / 0 / 0 / 18 / 0 |
| Fair Isle Sweater | Amy Gunderson (Premier Yarns) | PDF | 32 | 32 / 0 / 0 / 0 / 0 |
| **Total** | | | **199** | **0 wrong (0%); median 50%: FAIL** |

Criterion (a) passed in every run: every substitution is its own marked segment and the segments rejoin to the input exactly. The two crochet patterns with many "lost" entries write every sequence fully in brackets with no leading value (`(58, 66, 74) (82, 90, 98)`), a shape the parser doesn't recognize, so the alignment can't place them.

## Architecture

Removed on discard. While in Labs it was a static Vite app in plain TypeScript on ajj-design hardline, with a pure parser module (size-list detection, sequence classification, and resolution into segments that rejoin to the input exactly), a PDF.js text extractor configured for the site CSP (same-origin worker, Wasm and worker fetch off), and a local Node harness for the gate. No reader UI or storage was built.

Browser extraction text from Chromium and WebKit under `wrangler dev` was byte-identical to the harness's Node extraction for all six main-cohort PDFs (12 of 12 comparisons).

## Dependencies

<!-- Each third-party dependency and why a small amount of our own code would not do. See docs/DEPENDENCIES.md. -->

None (removed with the code). While in Labs: `pdfjs-dist` (Mozilla, Apache-2.0) for PDF text extraction, and ajj-design hardline.

## Shared packages

None (removed with the code). While in Labs: `@project-100/web`.

## Assets and licenses

<!-- Every third-party font, icon set, image, or sound: source, license, and where it is used. AI must not generate media. -->

None.

## Tradeoffs and known limitations

- PDF text extraction can reorder or drop text in complex layouts (PDF.js has had [reported reading-order failures](https://github.com/mozilla/pdf.js/issues/14493)). In the gate, extraction lost very little from text PDFs; most losses were patterns whose format the parser couldn't align.
- Designers' formats vary more than a small rule set covers, especially crochet blogs. This is the reason for the discard.

## Launch packet

<!-- Filled in before requesting launch approval. See docs/APP_ACCEPTANCE.md#launch-packet. -->
