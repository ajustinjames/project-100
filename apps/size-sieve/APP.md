# Size Sieve

<!-- Keep this document current. It is the product and architecture record for this app. -->

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
- 2026-09-29: Gate run 1 failed: 9 size-block substitutions counted wrong across 5 patterns, or 9/420 counted sequences (2.14%). Size-block entries remain outside the denominator; any substitution aligned to one counts as wrong. Figure entries remain reportable outside the denominator; correct substitutions are not wrong, and wrong-valued substitutions are wrong. Alignment uses parsed source values, and missed entries are searched only between neighboring aligned source spans. A gate verdict requires at least 10 main-cohort patterns from 6 distinct designers; a holdout requires at least 5 patterns with no designer shared with the main cohort.

## Architecture

The app is a static Vite app in plain TypeScript on ajj-design hardline. Its parser is pure TypeScript with no DOM or runtime dependencies: it detects a size list, classifies supported instruction sequences, and resolves them to source-ordered segments. Rejoining each segment's original text reproduces the input exactly. Parser tests use synthetic snippets written for the tests.

The src/pdf/ module dynamically loads PDF.js to extract text from an in-memory PDF and distinguishes module or worker loading failures from invalid PDFs. The browser worker is emitted by Vite as a same-origin asset; the Node feasibility harness selects PDF.js's Node entry point and does not render pages. The tools/measure.ts harness uses that extractor for PDFs, reads pasted-text fixtures from .txt files, resolves every size index, and compares the results with ignored truth files in apps/size-sieve/.feasibility/. It aligns substitutions against parsed source values and checks unaligned entries only within the text between neighboring aligned source spans. Main-cohort and holdout profiles prevent a verdict when their pattern and designer requirements are not met. It writes per-pattern and combined Markdown reports beside those files. No reader UI or storage is implemented yet. No Cloudflare bindings.

Browser extraction text from Chromium and WebKit under `wrangler dev` was compared byte-for-byte with the harness's Node extraction for all six cohort PDFs; all 12 comparisons were identical.

## Dependencies

<!-- Each third-party dependency and why a small amount of our own code would not do. See docs/DEPENDENCIES.md. -->

pdfjs-dist (Mozilla, Apache-2.0) handles PDF text parsing, a hard problem that would be error-prone to reproduce with a small amount of app code, as described in [DEPENDENCIES.md](../../docs/DEPENDENCIES.md). It is loaded only when a PDF is opened. The optional native @napi-rs/canvas package is used by PDF.js only for Node rendering; this app never renders PDFs and the package is never bundled into the browser app.

The app also uses the shared ajj-design hardline components and tokens.

## Shared packages

- `@project-100/web` — head metadata, disclosure footer, analytics beacon.

## Assets and licenses

<!-- Every third-party font, icon set, image, or sound: source, license, and where it is used. AI must not generate media. -->

None.

## Tradeoffs and known limitations

- PDF text extraction can reorder or drop text in complex layouts (PDF.js has had [reported reading-order failures](https://github.com/mozilla/pdf.js/issues/14493)). The feasibility harness reports text that could not be recovered; a future reader must show extracted text for checking.
- The parser will not handle every designer's format; unhandled groups are listed, not chased one by one.
- Data lives in one browser; export and import are the backup.

## Launch packet

<!-- Filled in before requesting launch approval. See docs/APP_ACCEPTANCE.md#launch-packet. -->
