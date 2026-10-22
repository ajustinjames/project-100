# Giving to Scale

<!-- Keep this document current. It is the product and architecture record for this app. -->

## Problem

When the news reports that a very rich person gave $100 million, the figure is hard to judge. What it means depends on the share of their fortune, and turning that into something you can feel means dividing by hand and applying the share to your own money. Newspapers sometimes do the sum for readers ([the Washington Post's "equivalent of donating $85"](https://www.thewrap.com/jeff-bezos-charity-washington-post) for Jeff Bezos's 2020 gifts), and the size of a fortune is hard to picture even with the right number. Full evidence in [PROPOSAL.md](PROPOSAL.md#problem).

## Audience

People who read about a large donation and want to know what it amounts to: news readers, and people discussing a gift online who want a figure to share. They come back each time a gift is in the news. An occasional task, not a daily tool.

## Scope

**In scope:**

- Three amounts typed by the user: the gift, the giver's fortune, and their own net worth. Amounts accept shorthand ("100M", "$2.4 billion").
- The answer as numbers first: "The same share of your net worth is $21", with the exact share of the fortune.
- A true-scale drawing of the fortune with the gift's slice at its real proportion, never widened. A sub-pixel slice is described in words, and an optional control scrolls the whole fortune to it.
- The reverse: what the giver would have to give to match a given gift of yours.
- A separately labelled "same percentage of your yearly income" illustration, for people whose net worth is zero or negative.
- One currency per page, labelled on every field; no conversion.
- A share link holding the gift and the fortune, never the user's own figure.

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

## Architecture

Planned, to be settled in the build brief: a client-only static page. Pure functions parse amounts and compute the share, the equivalents, the reverse, and the drawing's lengths. The share link carries the gift, the fortune, and the currency in the URL; the user's own figure is never put in the URL or stored. Drawing in HTML and CSS. No storage, no Cloudflare services.

## Dependencies

<!-- Each third-party dependency and why a small amount of our own code would not do. See docs/DEPENDENCIES.md. -->

None beyond ajj-design (`hardline`).

## Shared packages

- `@project-100/web` — head metadata, disclosure footer, analytics beacon.

## Assets and licenses

<!-- Every third-party font, icon set, image, or sound: source, license, and where it is used. AI must not generate media. -->

None.

## Tradeoffs and known limitations

- Results are only as good as the figures the user enters; a fortune is an estimate and mostly not cash, and a pledge may be paid over years.
- One currency per page; no conversion.
- A gift's true-scale slice is often less than a pixel; the numbers and words carry the answer, and the drawing supports it.

## Launch packet

<!-- Filled in before requesting launch approval. See docs/APP_ACCEPTANCE.md#launch-packet. -->
