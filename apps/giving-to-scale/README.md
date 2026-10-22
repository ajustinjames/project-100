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

- PR 1 supports net-worth comparisons in US dollars. Income mode, reverse comparison, currency selection, fragment links, and the fortune walk are planned for later PRs.
- One dot is the entered net worth until the fortune would exceed 2,000,000 dots. Then the dot value grows by the smallest power of ten that brings the drawn fortune to 2,000,000 dots or fewer. Raw multiples remain uncapped; drawn dot counts use the dot value.
- Canvas tiles use a maximum of 4,096 device pixels per side and 4,194,304 device pixels per tile. Tiles intersecting the viewport are always drawn; nearest off-screen tiles share a 25,165,824-pixel live budget.
- Colours (`src/style.css`): gift dots use the accent token, overridden to `--hl-global-color-accent: #e84700`; fortune dots use ink `#1a1a1a` (`--fortune-dot`). Gift dots are 3.45:1 against the paper `#f0f0ec` and 4.42:1 against the fortune dots, both above the 3:1 non-text minimum. Ink text is 15.2:1 and muted text `#666666` is 5.03:1 on the paper. Hardline's own `#ff4f00` is only 2.89:1 on the paper, which is why it's overridden. Re-check these if any of the colours change.
- The gift block draws the gift's dots as a near-square block at field size (`calculateGiftBlock`). When it would be taller than 300 CSS px, the block is not drawn and a note says the gift is the orange start of the field.
- The sticky label counts the dots that have come into view (above the viewport's bottom edge), so it reaches the whole fortune when the end of the field is on screen.
- Fonts are self-hosted from latin subsets. The app stores no values in browser storage.
