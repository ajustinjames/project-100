# Size Sieve

Developer notes for Size Sieve. Product intent lives in [APP.md](APP.md); data behavior in [PRIVACY.md](PRIVACY.md).

## Commands

Run from the repository root:

```bash
pnpm --filter @project-100/app-size-sieve dev        # local dev server
pnpm --filter @project-100/app-size-sieve build      # production build to dist/
pnpm --filter @project-100/app-size-sieve typecheck
pnpm test                                              # all tests, including this app's src/**/*.test.ts
```

## Layout

- `app.json` — registry metadata (status, privacy, dependencies). Validated by `pnpm p100 validate`.
- `index.html` — page shell. Do not add `<title>`; it is generated from `app.json`. Keep `<!-- p100:footer -->`.
- `src/` — application code and tests.

## Notes for maintainers

<!-- Anything a future maintainer (possibly a smaller model) needs to know: gotchas, invariants, data formats, storage keys. -->

The parser API is in `src/parser/`. `resolve()` returns source-ordered text, substitution, and flag segments; substitution values are selected from the detected sequence, and flags leave their source unchanged. `rejoinSegments()` must reproduce the complete original input exactly. Keep that round-trip invariant covered when changing scanner rules.
