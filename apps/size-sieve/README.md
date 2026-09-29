# Size Sieve

Developer notes for Size Sieve. Product intent lives in [APP.md](APP.md); data behavior in [PRIVACY.md](PRIVACY.md).

## Commands

Run from the repository root:

```bash
pnpm --filter @project-100/app-size-sieve dev        # local dev server
pnpm --filter @project-100/app-size-sieve build      # production build to dist/
pnpm --filter @project-100/app-size-sieve typecheck
pnpm test                                              # all tests, including this app's src/**/*.test.ts
node apps/size-sieve/tools/measure.ts [folder]          # run the local feasibility gate
```

## Layout

- `app.json` — registry metadata (status, privacy, dependencies). Validated by `pnpm p100 validate`.
- `index.html` — page shell. Do not add `<title>`; it is generated from `app.json`. Keep `<!-- p100:footer -->`.
- `src/` — application code and tests.

## Notes for maintainers

<!-- Anything a future maintainer (possibly a smaller model) needs to know: gotchas, invariants, data formats, storage keys. -->

The parser API is in `src/parser/`. `resolve()` returns source-ordered text, substitution, and flag segments; substitution values are selected from the detected sequence, and flags leave their source unchanged. `rejoinSegments()` must reproduce the complete original input exactly. Keep that round-trip invariant covered when changing scanner rules.

### Feasibility truth files

The gate reads each <name>.truth.json in apps/size-sieve/.feasibility/ by default. The optional folder argument can point to another local folder. Each truth file names a .pdf or .txt source in that same folder. PDFs go through src/pdf/extract.ts; text files are read as pasted text. sizeCount is the count a user would confirm or enter, whether or not findSizeList() detects the same count.

Annotate every instruction sequence from the original pattern in document order. Keep values exactly as printed, include a short context and a page or line position, and mark schematic sequences with inFigure and malformed source sequences with sourceError when needed. A truth file contains file, title, designer, url, craft, source, sizeCount, and sequences. Each sequence contains values, context, and position, with optional inFigure and sourceError booleans. For example:

```json
{
  "file": "sample.txt",
  "title": "Synthetic example",
  "designer": "Example",
  "url": "",
  "craft": "knit",
  "source": "web",
  "sizeCount": 3,
  "sequences": [
    {
      "values": ["80", "88", "96"],
      "context": "cast on",
      "position": "line 12"
    }
  ]
}
```

The harness writes <name>.report.md and summary.md in the same folder. Reports include ordered alignment, the classification of each truth entry, source context for each parser substitution and flag, structural checks, and the three gate thresholds. Schematic entries lost during extraction are reported but excluded from the denominator. Truth files and downloaded patterns are local research material: .feasibility/ is git-ignored and must never be committed.
