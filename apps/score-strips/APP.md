# Score Strips

<!-- Keep this document current. It is the product and architecture record for this app. -->

## Problem

A musician with low vision often needs notation two or three times the printed size. Enlarged that much, a page no longer fits a screen or a stand, so reading means zooming in and scrolling sideways along each line and down to the next, with hands busy playing. The fix is to cut each page into its lines of music (systems) and show one enlarged line at a time. The tools that do this are paid and tied to one platform, or upload the score ([Sound Without Sight, 2025](https://soundwithoutsight.org/hub-articles/using-software-to-display-music-scores-in-large-print/); full evidence in [PROPOSAL.md](PROPOSAL.md#problem)). This recurs with every new piece and every practice.

## Audience

Musicians with low vision who can see music when it is large enough, and who read from PDFs or scans: choir singers, church organists and pianists, band and orchestra players, music students. Not blind musicians, who need braille music or audio. They come back for every new piece, and open saved pieces at every practice and rehearsal.

## Scope

**In scope:**

- Open a PDF or page images, rendered in the browser.
- Propose a band for each system from the gaps between systems; let the musician adjust, add, delete, reorder, split, and duplicate bands, by keyboard as well as pointer.
- Read one strip at a time at screen width at any size, moving by key, tap, or page-turn pedal; high-contrast and inverted display.
- Save pieces with their strips and place reached; export and import a piece's strip layout.

**Explicitly out of scope:**

- Note recognition, transposition, or re-engraving.
- Uploading, sharing, or syncing scores.
- Auto-scrolling at a tempo.
- Writing an enlarged PDF for printing (possible later).
- Accounts, servers, AI.

## Alternatives researched

Full comparison and sources in [PROPOSAL.md](PROPOSAL.md#existing-alternatives). In short:

- **Zooming a PDF viewer:** free everywhere, but a zoomed line is wider than the screen.
- **forScore Reflow** (Apple devices, $24.99), **MusicZoom** (iPad), **Power Music AF** (Windows, £35), **Enlarge and Scroll** (Windows), **LargePrintMusic** (Windows and Mac, paid): system-by-system enlargement, each paid or tied to one platform.
- **Kivunel:** continuous line on any device, but uploads the score to an account.
- **Low Vision PDF:** free, local, in the browser, but a general document tool that cuts pages into a fixed number of segments and outputs a PDF, with no per-system cutting or strip reading view. The feasibility gate tests it first.

## Product decisions

- 2026-10-01: Entered Labs as app #2. Selected after two critique rounds ([candidate PR #32](https://github.com/ajustinjames/project-100/pull/32), [round 1](https://github.com/ajustinjames/project-100/pull/32#issuecomment-5932933174), [round 2](https://github.com/ajustinjames/project-100/pull/32#issuecomment-5933022860)) because every tool that cuts music at its systems for strip-by-strip reading is paid and tied to one platform or uploads the score, and the free document tool does a related job. No escalations apply.
- 2026-10-01: The first build task is an end-to-end feasibility gate, before any polish, with criteria, thresholds, and cohort put on the build brief first ([PROPOSAL.md](PROPOSAL.md#likely-scope-and-shape)). It starts by running Low Vision PDF on the same cohort and discards if that already does the job. Then, on at least twelve freely licensed scores and an untouched holdout of four, it measures detection (including cut-off notation), keyboard-only correction at 400% zoom, a full pedal read-through, and legibility, and discards on failure.
- 2026-10-01: A low-vision musician must try preparation and reading on at least two scores before any launch request. Discard if they can't prepare a piece without sighted help; if nobody can be found, the app stays in Labs.

## Architecture

Planned, to be settled in the build brief: a client-only static app. PDF pages are rendered to canvas with `pdfjs-dist` under the site's content security policy, with WebAssembly and worker fetch off, as Size Sieve did ([RETRO](../size-sieve/RETRO.md)). Images are drawn directly. A pure core finds candidate bands from a row-by-row ink profile and holds the strip and reading-order model. Saved pieces go in IndexedDB under `p100:score-strips:` with a versioned format. No Cloudflare services.

## Dependencies

<!-- Each third-party dependency and why a small amount of our own code would not do. See docs/DEPENDENCIES.md. -->

None yet beyond ajj-design (`hardline`). Planned: `pdfjs-dist` (Mozilla, Apache-2.0) to render PDF pages, a genuinely hard format; added in the build PR that uses it.

## Shared packages

- `@project-100/web` — head metadata, disclosure footer, analytics beacon.

## Assets and licenses

<!-- Every third-party font, icon set, image, or sound: source, license, and where it is used. AI must not generate media. -->

None.

## Tradeoffs and known limitations

- Enlarging can't restore detail missing from a low-resolution scan.
- Browser storage can be cleared or evicted; the app must say so and offer export of the layout.
- Large scans use a lot of memory on phones and old tablets; render one page at a time.
- Preparation (marking bands) may be the hard part for this audience; the gate measures it.

## Launch packet

<!-- Filled in before requesting launch approval. See docs/APP_ACCEPTANCE.md#launch-packet. -->
