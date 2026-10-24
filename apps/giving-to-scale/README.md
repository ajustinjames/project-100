# Giving to Scale

Developer notes for Giving to Scale. Product intent lives in [APP.md](APP.md); data behavior in [PRIVACY.md](PRIVACY.md).

## Commands

Run from the repository root:

```bash
pnpm --filter @project-100/app-giving-to-scale dev        # local dev server
pnpm --filter @project-100/app-giving-to-scale build      # production build to dist/
pnpm --filter @project-100/app-giving-to-scale typecheck
pnpm test                                              # all tests, including this app's src/**/*.test.ts
```

## Layout

- `app.json` — registry metadata (status, privacy, dependencies). Validated by `pnpm p100 validate`.
- `index.html` — page shell. Do not add `<title>`; it is generated from `app.json`. Keep `<!-- p100:footer -->`.
- `src/` — application code and tests.

## Notes for maintainers

<!-- Anything a future maintainer (possibly a smaller model) needs to know: gotchas, invariants, data formats, storage keys. -->

- Modes: `Mode` is `"net-worth"` or `"income"`. `compare()` calls the reader's figure the `unit` in both. In income mode an income of zero or less is a field error; in net-worth mode a net worth of zero or less is the `net-worth-zero` result with its switch button. Mode-dependent wording is in `src/ui/form.ts` (`modeText`) and `ownText()` in `src/ui/field.ts`.
- Currencies are listed once, in `CURRENCIES` and `currencyDetails` (`src/core/amount.ts`). JPY has no minor unit, so small yen amounts are whole yen. `$` is accepted for USD, CAD, and AUD.
- Share link format (`src/core/share-link.ts`): `#v=1&gift=<amount>&fortune=<amount>&cur=<ISO code>`, amounts as plain decimals with at most two decimal places, no grouping or exponent. No link is offered when rounding to two places would move the share by more than one part in a million (`MAX_SHARE_CHANGE`). Opening a link clears the reader's figures and the "If I gave" amount. Anything not exactly valid (a repeated key, another version, an unknown currency, a malformed or out-of-range amount, gift above fortune) is ignored entirely. The page never writes the fragment; only the Share button builds a link. Never add the reader's own figure to it.
- "Walk the fortune" (`src/ui/walk.ts`) scrolls from the fortune's title to the closing line at a constant speed over 20 seconds, whatever the length. Any keydown, wheel, touchstart, or pointerdown stops it; its stop listeners start on the next frame so the key or click that started it doesn't stop it. With `prefers-reduced-motion: reduce` it jumps to the end. On arrival it moves focus to the closing line.
- One dot is the entered net worth until the fortune would exceed 2,000,000 dots. Then the dot value grows by the smallest power of ten that brings the drawn fortune to 2,000,000 dots or fewer. Raw multiples remain uncapped; drawn dot counts use the dot value.
- The field is not drawn on canvas. `planDotBands` (`src/ui/field-layout.ts`) splits it into at most four bands: whole gift rows, the row where the gift ends, whole fortune rows, and the row where the fortune ends. Whole rows are one element each, painted with a repeating CSS pattern (a 2 px square in each 3 px cell, `conic-gradient` in `.dots`); ragged rows are a few segments, with partial dots filled from the left. So a 2,000,000-dot field is under ten elements, and the browser paints only what's on screen. Canvas tiles were tried first and dropped: handing each drawn tile to the compositor cost 50–1,000 ms per task in Chromium with 4x CPU throttling, against the brief's 50 ms budget, and even pre-drawn canvases stalled scrolling there. The CSS pattern measured no long tasks while scrolling or walking at 1280 px (dpr 1 and 2) and 412 px (dpr 3).
- Colours (`src/style.css`): gift dots use the accent token, overridden to `--hl-global-color-accent: #e84700`; fortune dots use ink `#1a1a1a` (`--fortune-dot`). Gift dots are 3.45:1 against the paper `#f0f0ec` and 4.42:1 against the fortune dots, both above the 3:1 non-text minimum. Ink text is 15.2:1 and muted text `#666666` is 5.03:1 on the paper. Hardline's own `#ff4f00` is only 2.89:1 on the paper, which is why it's overridden. Re-check these if any of the colours change.
- The gift block draws the gift's dots as a near-square block at field size (`calculateGiftBlock`). When it would be taller than 300 CSS px, the block is not drawn and a note says the gift is the orange start of the field.
- Landmarks (`planLandmarks` in `src/ui/field-layout.ts`) rule a line across the field at each multiple of a round step, labelled with the amount above it ("$10 billion"). The step is the smallest 1, 2, or 5 times a power of ten that keeps them at least 300 px apart, so they are 300–750 px apart; on a very narrow field they spread out so there are never more than 200 (`MAX_LANDMARKS`). Each line is placed at the first row boundary at or after its amount, in the 1 px gap between rows, and none is drawn within 24 px of the field's top or bottom, where its label would be cut off. They are re-planned when the number of columns changes.
- The sticky label counts the dots scrolled past the top of the viewport, as the brief specifies, so it stays below the whole fortune while the field is on screen. The closing line gives the full total.
- Fonts are self-hosted from latin subsets. The app stores no values in browser storage.
