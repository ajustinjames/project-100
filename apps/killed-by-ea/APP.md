# Killed by EA

<!-- Keep this document current. It is the product and architecture record for this app. -->

## Problem

Electronic Arts has cancelled games in development, closed or merged a long line of studios it acquired or founded, and ended projects such as Playfish's social games. The record is split up: studio closures are in Wikipedia's acquisitions table (many without a closure year), listicles, and EA Graveyard (studios only); cancellations are in one-off news and in Games That Weren't, which has no publisher view. There is no single dated timeline to answer "what did EA close in 2013?" or to cite in a discussion. Full evidence in [PROPOSAL.md](PROPOSAL.md#problem).

## Audience

People who follow games history (enthusiasts, preservationists, writers) and players of older EA games looking back at what happened to a series or studio. They come back when another EA closure is in the news. A reference, used occasionally.

## Scope

**In scope:**

- A fixed archive up to **22 October 2026**, stated at the top. Events after the cutoff are left out.
- Three kinds of entry: *game* (cancelled in development, announced or credibly reported), *studio* (closed, or merged, shown separately), and *project* (a product, service, or initiative EA ended, such as a platform or a game label).
- Each entry: name, kind, dates as the sources give them, age at the end where there's a meaningful start, one neutral past-tense sentence, the studio involved where relevant, and at least one source link plus a Wayback Machine copy.
- One timeline, newest first, with search, filters for kind and year or decade, kept in the URL so a view can be shared.
- Summary counts by kind and year, with unknown dates counted separately.

**Explicitly out of scope:**

- **Server and online-service shutdowns** of released games (owner direction, 2026-10-23). EA's own shutdown lists cover those, and the page links to them.
- Current status, upcoming events, countdowns, or "is it still up?" claims.
- Logos, box art, screenshots, or any EA or studio marks; kinds get text symbols.
- Public submissions; corrections go through GitHub issues.
- Runtime APIs, storage, accounts.

## Alternatives researched

Full comparison in [PROPOSAL.md](PROPOSAL.md#existing-alternatives). In short:

- **EA Graveyard / Game Studio Graveyard** ([wiredlain.com](https://wiredlain.com/)): the strongest for studios; studios only, and now mixed with other publishers' studios.
- **Games That Weren't** ([gamesthatwerent.com](https://www.gamesthatwerent.com/cancelled-games/)): the strongest for cancellations; no publisher view, so EA's can't be listed together.
- **Wikipedia's acquisitions list**: thorough, but a table of acquisitions, not a timeline, with many closure years missing.
- **EA's shutdown lists** ([A–H](https://www.ea.com/legal/service-updates/a-h), [I–Q](https://www.ea.com/legal/service-updates/i-q), [R–Z](https://www.ea.com/legal/service-updates/r-z)): server shutdowns only, which this app leaves out.
- **Huskynarr's Killed by EA**: the same idea, abandoned since 2022.

## Product decisions

- 2026-10-23: Entered Labs as app #5. Owner-sourced idea, recorded as an exception to idea ownership. Selected at 13/20 after one revise round ([candidate PR #51](https://github.com/ajustinjames/project-100/pull/51), [round 1](https://github.com/ajustinjames/project-100/pull/51#issuecomment-6341348400), [round 2](https://github.com/ajustinjames/project-100/pull/51#issuecomment-6353144957)) because no verified alternative puts EA's closed studios, cancelled games, and ended projects on one dated, sourced, searchable timeline.
- 2026-10-23: Not a sensitive subject, by owner ruling ([#53](https://github.com/ajustinjames/project-100/issues/53#issuecomment-6364532293)); no approval needed. The name stays "Killed by EA".
- 2026-10-22: A fixed archive, not a live tracker: no current-status or upcoming claims, so it needs no ongoing curation (critique round 1, Critical finding, accepted as resolved in round 2).
- 2026-10-23: Server and online-service shutdowns are out of scope, by owner direction: the app is about games killed in development, studios, and projects. This drops the proposal's *online service* kind, EA's shutdown pages as a data source, and the build brief's feasibility gate on classifying them (which had failed; see [#62](https://github.com/ajustinjames/project-100/issues/62)). The critique's round-2 advantage claim 2 (EA's server list made searchable by year) no longer applies; claim 1 (one timeline across kinds) stands, narrowed to three kinds.
- 2026-10-22: Untested hypothesis, decided on the prototype: that one timeline across kinds is worth using over EA Graveyard and Games That Weren't. If the working prototype doesn't show that, discard it.
- 2026-10-29: Continue after the Checkpoint, by owner decision ([#62](https://github.com/ajustinjames/project-100/issues/62#issuecomment-6495748067)). The hypothesis held on three of four test questions. On "which games died with their studio?" the app was better but not clearly so; game and studio entries now link to each other, and the question is re-tested at the end of PR 3.
- 2026-10-29: Layout takes inspiration from Killed by Google, the owner's reference, without copying it. Adopted: many entries per screen, no card boxes, time at a glance ("8 days ago" and, where the start is sourced, age), and one row of controls. Not adopted: its tombstone marks, gutter, or obituary sentences. The app keeps its own ajj-design look.

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
- Classification (closure vs merger vs rename, cancelled vs on hold) is the main source of error; every entry is checked against its sources at the Checkpoint.
- Without server shutdowns the archive is small (roughly 60 to 100 entries), so it lives or dies on completeness and sourcing rather than volume.
- Where sources disagree on a date, the entry gives the best-supported one and says the sources differ.

## Launch packet

<!-- Filled in before requesting launch approval. See docs/APP_ACCEPTANCE.md#launch-packet. -->
