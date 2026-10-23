# Killed by EA

<!-- Keep this document current. It is the product and architecture record for this app. -->

## Problem

Electronic Arts has closed or merged a long line of studios, cancelled announced games, ended products, and retired the online services of hundreds of games. The record is split up: EA's own shutdown lists cover online services only, on three alphabetical pages with no search or year view and with EA Play catalog removals mixed in; studio closures are in Wikipedia's acquisitions table (many without a closure year) and listicles; cancellations are in one-off news. There is no single dated timeline to answer "what did EA close in 2013?" or to cite in a discussion. Full evidence in [PROPOSAL.md](PROPOSAL.md#problem).

## Audience

People who follow games history (enthusiasts, preservationists, writers) and players of older EA games looking back at what happened to a series or studio. They come back when another EA closure is in the news. A reference, used occasionally.

## Scope

**In scope:**

- A fixed archive up to **22 October 2026**, stated at the top. Events after the cutoff are left out.
- Four kinds of entry: *studio* (closed, or merged, shown separately), *online service* (a game's online play or services ended on a platform; partial changes labelled *feature closure*), *cancelled* (an announced game), and *product* (a service or product EA ended).
- Each entry: name, kind, dates as the sources give them, age at the end where there's a meaningful start, one neutral past-tense sentence, platforms where relevant, and at least one source link plus a Wayback Machine copy.
- One timeline, newest first, with search, filters for kind, year or decade, and platform, kept in the URL so a view can be shared.
- Summary counts by kind and year, with unknown dates counted separately.

**Explicitly out of scope:**

- Current status, upcoming shutdowns, countdowns, or "is it still up?" claims. The page points players to EA's own lists for that.
- EA Play and other catalog removals, and demo or store removals.
- Logos, box art, screenshots, or any EA or studio marks; kinds get text symbols.
- Public submissions; corrections go through GitHub issues.
- Runtime APIs, storage, accounts.

## Alternatives researched

Full comparison in [PROPOSAL.md](PROPOSAL.md#existing-alternatives). In short:

- **EA's shutdown lists** ([A–H](https://www.ea.com/legal/service-updates/a-h), [I–Q](https://www.ea.com/legal/service-updates/i-q), [R–Z](https://www.ea.com/legal/service-updates/r-z)): authoritative for servers, but alphabetical only, with catalog removals mixed in, and no studios or cancellations.
- **EA Graveyard / Game Studio Graveyard** ([wiredlain.com](https://wiredlain.com/)): the strongest for studios; studios only.
- **Shelf-Life**, the **EA server lifespan spreadsheet**, **Games That Weren't**, and **Wikipedia's acquisitions list**: each covers one slice.
- **Huskynarr's Killed by EA**: the same idea, abandoned since 2022.

## Product decisions

- 2026-10-23: Entered Labs as app #5. Owner-sourced idea, recorded as an exception to idea ownership. Selected at 13/20 after one revise round ([candidate PR #51](https://github.com/ajustinjames/project-100/pull/51), [round 1](https://github.com/ajustinjames/project-100/pull/51#issuecomment-6341348400), [round 2](https://github.com/ajustinjames/project-100/pull/51#issuecomment-6353144957)) because no verified alternative puts studios, server retirements, cancellations, and products on one dated, sourced, searchable timeline, and EA's own server lists can't be read by year.
- 2026-10-23: Not a sensitive subject, by owner ruling ([#53](https://github.com/ajustinjames/project-100/issues/53#issuecomment-6364532293)); no approval needed. The name stays "Killed by EA".
- 2026-10-22: A fixed archive, not a live tracker: no current-status or upcoming claims, so it needs no ongoing curation (critique round 1, Critical finding, accepted as resolved in round 2).
- 2026-10-22: Untested hypothesis, decided on the prototype: that one timeline across kinds is worth using over EA's lists and EA Graveyard. If the working prototype doesn't show that, discard it.

## Architecture

Planned, to be settled in the build brief: a client-only static page. The dataset is one versioned JSON file bundled at build time and checked by tests (required fields, real dates, end after start, a source and archived copy per entry, allowed statuses, no duplicates). Pure functions handle dates and ages, filtering, URL state, and counts. No storage, no Cloudflare services.

## Dependencies

<!-- Each third-party dependency and why a small amount of our own code would not do. See docs/DEPENDENCIES.md. -->

None beyond ajj-design (`hardline`).

## Shared packages

- `@project-100/web` — head metadata, disclosure footer, analytics beacon.

## Assets and licenses

<!-- Every third-party font, icon set, image, or sound: source, license, and where it is used. AI must not generate media. -->

None.

## Tradeoffs and known limitations

- The archive ages after its cutoff; that's stated at the top, and a later dated edition is optional.
- Classification (server retirement vs catalog removal, closure vs merger) is the main source of error; the prototype is gated on a hand-checked sample.
- Where sources disagree on a date, the entry gives the best-supported one and says the sources differ.

## Launch packet

<!-- Filled in before requesting launch approval. See docs/APP_ACCEPTANCE.md#launch-packet. -->
