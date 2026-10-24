# Giving to Scale

<!-- Keep this document current. It is the product and architecture record for this app. -->

## Problem

When the news reports that a very rich person gave $100 million, the figure is hard to judge. What it means depends on the share of their fortune, and turning that into something you can feel means dividing by hand and applying the share to your own money. Newspapers sometimes do the sum for readers ([the Washington Post's "equivalent of donating $85"](https://www.thewrap.com/jeff-bezos-charity-washington-post) for Jeff Bezos's 2020 gifts), and the size of a fortune is hard to picture even with the right number. Full evidence in [PROPOSAL.md](PROPOSAL.md#problem).

## Audience

People who read about a large donation and want to know what it amounts to: news readers, and people discussing a gift online who want a figure to share. They come back each time a gift is in the news. An occasional task, not a daily tool.

## Scope

The product plan is recorded in [PROPOSAL.md](PROPOSAL.md); the build plan is the brief, issue #50.

**Implemented (PR 1, prototype; PR 3, modes and sharing):**

- Three amounts typed by the user: the gift, the giver's fortune, and their own net worth or yearly income. Amounts accept shorthand ("100M", "$2.4 billion"). Inputs widen to fit long figures.
- The answer as numbers first: "The same share of your net worth is $21", with the share of the fortune as a percentage (a partial share never rounds up to 100%). In income mode: "The same percentage of your yearly income is".
- A true-scale dot field of the fortune with the gift at its real proportion, painted as a few bands of a repeating CSS dot pattern, ruled at round amounts ("$10 billion", "$20 billion") so it visibly moves as it scrolls.
- "Walk the fortune": a 20-second constant-speed scroll through the field, stopped by any key, wheel, or touch; with reduced motion it jumps to the end.
- A net worth of zero or less explains that the same share comes to nothing, and offers the income comparison.
- The reverse: "If I gave 50, the same share of their fortune would be $141 million."
- One currency per page, chosen from USD, CAD, AUD, EUR, GBP, INR, and JPY, with no conversion.
- "Share this gift": a link in the URL fragment holding the gift, fortune, and currency, never the user's own figure. Opening such a link fills those three and asks for the reader's figure.

**Before launch:** the Cloudflare beacon's payload on a shared link was checked on 2026-10-23: it does not include the fragment (see PRIVACY.md).

**Not planned:**

- Storage of any kind, accounts, external APIs, currency conversion, or any list of named people or shipped fortune figures.

**Explicitly out of scope:**

- Any list of named people or shipped fortune figures (needs curation, and would publish figures about named people).
- Judgement or advice: wording stays factual (shares and equivalents).
- Features of Sacrifice Meter, by owner direction: everyday-price comparisons, "fortune regrows it in", counts of gifts they could make, per-day matching amounts, cheque layouts.
- Storage of any kind, accounts, external APIs, currency conversion.

## Alternatives researched

Full comparison in [PROPOSAL.md](PROPOSAL.md#existing-alternatives). In short:

- **Sacrifice Meter**: the strongest; any gift, a Forbes donor lookup, a scale bar whose sliver is widened to at least 2px, no income comparison.
- **NoCharity**: income comparison against a fixed list of 17 billionaires; no scale drawing.
- **Zuckerberg Donation Equaliser**: salary and net-worth modes for one fixed gift.
- **GiveRate**: your own giving rate and published rankings; a different job.
- Doing the division by hand, or a newspaper doing it for one gift.

## Product decisions

- 2026-10-22: Entered Labs as app #4. Owner-sourced idea, recorded as an exception to idea ownership. Selected at 14/20 after one revise round ([candidate PR #46](https://github.com/ajustinjames/project-100/pull/46), [round 1](https://github.com/ajustinjames/project-100/pull/46#issuecomment-6339588372), [round 2](https://github.com/ajustinjames/project-100/pull/46#issuecomment-6339658011)) because no tool verified in research both draws a gift at its true scale and gives an income illustration for any gift, and the owner wants a well-designed version that shows the scale of the difference.
- 2026-10-22: `sensitive-subject` approved by the owner ([#47](https://github.com/ajustinjames/project-100/issues/47#issuecomment-6339780374), recorded in [#48](https://github.com/ajustinjames/project-100/pull/48)). Scope of the approval: user-entered figures only, no donor list, factual wording with no judgement or advice.
- 2026-10-22: Net worth is the main comparison; income is a labelled illustration, never called an equal sacrifice (critique round 1, High finding).
- 2026-10-22: Untested hypothesis, decided on the prototype: that the true-scale drawing and the design make this worth choosing over Sacrifice Meter. If the working prototype doesn't show that, discard it.
- 2026-10-22: Implementation of the prototype was started by Luna (`gpt-6-luna`, effort `max`) and finished by Opus (`claude-opus-5-5`) at the owner's request, because Luna's run was taking too long. Luna's work was kept; Opus reviewed it, fixed the dot colours and the end-of-field counter, and drew the gift block.
- 2026-10-22: Gift dots are orange `#e84700` and fortune dots ink `#1a1a1a`, the strongest pairing that keeps the gift ≥ 3:1 against both the paper and the fortune dots. Hardline's `#ff4f00` falls just short on the paper (2.89:1).
- 2026-10-22: The gift is drawn as its own near-square block of dots, at field size, when the block fits in 300 CSS px; larger gifts are shown only as the orange start of the field, with a note. Why: the gift's dots are already the first dots of the field, at the same scale. A separate full-size block for a big gift would be a second copy dozens of screens long ($100 billion against $85,000 is about 42 phone screens), and the reader would have to scroll through it before the fortune starts. This changes the brief (issue #50), which asked for the block across the whole range; the brief is amended to match.
- 2026-10-22: Checkpoint after PR 1 (Opus): continue. With three cases from the news, the dot field made the scale felt better than Sacrifice Meter's bar ([verdict on #50](https://github.com/ajustinjames/project-100/issues/50#issuecomment-6353134066)).
- 2026-10-22: PR 3 was built by Opus (`claude-opus-5-5`), continuing at the owner's request. Inputs widen to fit what's typed, because the checkpoint found long figures cut off on a phone. A share link writes amounts back into the inputs with comma grouping ("240,000,000,000"), which is exact and parses in every locale. The reverse amount is shown even when it exceeds the fortune: the sum is still the same share. Net worth and yearly income are kept as separate values, so switching modes never treats one as the other (review round 1, High finding); the income field starts empty.
- 2026-10-23: Fixes from Astra's pre-launch adversarial review. Opening a share link clears the reader's figures and the "If I gave" amount, so a link opened in a tab already in use never applies them to the link's comparison, possibly in another currency; changing the currency by hand still keeps them, because the page says all amounts are in it. Share links still hold two decimal places, but no link is offered when that rounding would move the share by more than one part in a million (it was only refused when the gift rounded to zero). Share re-reads the inputs when pressed. Amounts below the currency's smallest unit (a cent, or one yen) are refused like amounts above the limit, because they could overflow the shares or round the drawn gift to nothing. A partial share never shows as 100%. In forced colours, a partial gift dot is drawn inverted, like the gift's whole dots.
- 2026-10-23: The launch-readiness beacon check was done before launch instead of after it. Labs pages carry no beacon, so the live check the brief asked for could only happen once the app was live. Instead, Cloudflare's current beacon script was injected into a local build exactly as `@project-100/web` adds it on live pages, opened from a share link in Chromium, WebKit, and Firefox, and its reports were captured by Playwright and never sent. The reported `location` is the URL without the fragment. The script is Cloudflare's, so this can change; it is the same script for every live app.
- 2026-10-23: The owner found the walk unclear: a field of identical dots looks still while it scrolls, because the pattern repeats every 3 px. Landmarks rule a line across the field at each multiple of a round step (1, 2, or 5 times a power of ten, `planLandmarks`), chosen so they fall 300–750 px apart, one to three on screen; on a very narrow field (heavy zoom) they spread out to stay within 200 (review round 1). Each goes at the first row boundary at or after its amount, so the line never claims an amount the dots above it haven't reached. They are labelled with amounts in the page currency, not comparisons, so they stay factual and borrow nothing from Sacrifice Meter. Each line sits in the 1 px gap between dot rows, so it hides no dots; the labels sit over a few. With 4x CPU throttling, the walk at the 2,000,000-dot cap (up to 99 landmarks) still measured no long tasks at 1280 px (dpr 1 and 2) and 412 px (dpr 3).
- 2026-10-22: PR 4 (Opus) paints the field with a repeating CSS dot pattern instead of the brief's canvas tiles. Measured in Chromium with 4x CPU throttling on a 2,000,000-dot field: canvas tiles gave long tasks of 200–1,000 ms while scrolling at the walk's speed, and still 50–60 ms per frame after drawing rows instead of dots and shrinking tiles to 1 Mpx, because handing canvases to the compositor costs time in proportion to their area. A plain page of pre-drawn canvases stalled the same way, so no canvas layout could meet the brief's 50 ms budget there. The CSS pattern gave no long tasks at all, scrolling or walking, at 1280 px (dpr 1 and 2) and 412 px (dpr 3), and draws the same 2 px dots on a 3 px pitch. It also makes the tile bounds and live budget unnecessary. The brief (#50) is amended to match before this PR merges (review round 1, Low finding).
- 2026-10-22: The prototype uses a true-scale dot field. One dot equals the reader's net worth until the field would exceed 2,000,000 dots, then it equals the smallest power-of-ten multiple that keeps the field at or below that cap. Inter Variable and JetBrains Mono are self-hosted from latin subsets under SIL OFL 1.1. Nothing is stored. The URL-fragment share link (PR 3) carries the gift, fortune, and currency, and nothing else.

## Architecture

Client-only static Vite page, written in plain TypeScript, HTML, and CSS. Pure functions parse and format amounts, validate the three fields, calculate the share and equivalent, and plan the dot field. The dot field is a few elements painted with a repeating CSS pattern (`planDotBands`), drawn at runtime from the entered figures. The app has no storage and no app-specific service requests. The Share button builds a URL-fragment link (`src/core/share-link.ts`); the page reads a fragment on open but never writes one.

## Dependencies

<!-- Each third-party dependency and why a small amount of our own code would not do. See docs/DEPENDENCIES.md. -->

The app uses the required ajj-design (`hardline`) tokens and components. `@fontsource-variable/inter` supplies the variable Inter typeface used for the interface and answer; `@fontsource/jetbrains-mono` supplies JetBrains Mono for technical labels. The two fonts are self-hosted because typography carries the design and the app must not request fonts from a CDN.

## Shared packages

- `@project-100/web` — head metadata, disclosure footer, analytics beacon.

## Assets and licenses

<!-- Every third-party font, icon set, image, or sound: source, license, and where it is used. AI must not generate media. -->

| Asset | Source | License | Attribution | Use |
|---|---|---|---|---|
| Inter Variable, latin subset | [Fontsource Inter](https://fontsource.org/fonts/inter), package `@fontsource-variable/inter` 5.3.0 | SIL Open Font License 1.1 | None required | Interface text and the answer amount |
| JetBrains Mono, latin subset | [Fontsource JetBrains Mono](https://fontsource.org/fonts/jetbrains-mono), package `@fontsource/jetbrains-mono` 5.3.0 | SIL Open Font License 1.1 | None required | Technical labels and field summaries |

## Tradeoffs and known limitations

- Results are only as good as the figures the user enters; a fortune is an estimate and mostly not cash, and a pledge may be paid over years.
- One currency per page; no conversion.
- A gift's true-scale dot is often only partially filled; the numbers and words carry the answer, and the drawing supports it.

## Launch packet

<!-- Filled in before requesting launch approval. See docs/APP_ACCEPTANCE.md#launch-packet. -->
