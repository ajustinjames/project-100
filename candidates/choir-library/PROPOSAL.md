# Candidate: Choir Library

<!-- Keep it short. Follow the workflow in docs/APP_ACCEPTANCE.md (steps 4 to 6). Link evidence, and only link pages you have opened and checked. -->

**Idea source:** Idea generator (`gpt-6-astra`, effort `medium`), batch of 2026-09-30, second round. It was dropped then for unverifiable evidence and is recorded now under the revised [step 3](../../docs/APP_ACCEPTANCE.md#3-research-the-survivors) rule, with evidence I opened.

## Problem

Church and community choirs own cupboards of octavo scores. A volunteer librarian, often the director, keeps a catalogue so the choir can find what it owns, whether there are enough copies, what suits a season, and when it was last sung. Almost always the catalogue is a spreadsheet.

Evidence:

- On the MusicaSacra forum, a choir member asked how to make their Excel catalogue more useful. Replies recommend fields for "Composer, title, parts (ssa) or whatever, publisher, season, when last sung", copies owned, and accompanied or not, and say that "when last sung" is surprisingly useful for programming. MS Access was called "more trouble that [sic] it was worth". ([MusicaSacra: music library catalogue](https://forum.musicasacra.com/forum/discussion/15330/music-library-catalogue/p1))
- In another thread a volunteer at a historic church asked whether to use Excel or Access to track the collection and its performance history. Replies warn that "the next person will call you back in 6 months to tell you they messed up their Excel files". ([MusicaSacra: church choir music database](https://forum.musicasacra.com/forum/discussion/14121/church-choir-music-database/p1))
- A choir-director blog sets out a Google Sheets system (file number, title, voicing, composer, arranger, publisher, copies) and says "Nothing gets physically filed until it is entered into the spreadsheet." ([Choir Director Corner](https://choirdirectorcorner.com/a-simple-system-for-organizing-your-choral-music-library/))

## Audience

Volunteer choir librarians and directors of church, school, and community choirs. They come back weekly when choosing music, and after every service or concert to record what was sung.

## Proposed solution

A browser app holding one choir's library:

1. **Catalogue.** Title, composer, arranger, voicing (SATB, SSA, unison…), publisher, accompaniment, seasons or occasions (tags the choir defines), copies owned, and shelf or file number. Import an existing spreadsheet (CSV) by mapping its columns; export the same way.
2. **Record what was sung.** After a service or concert, enter the date and the pieces, as a list. Each piece keeps every date it was sung, not only the last.
3. **Choose music.** Filter by season tag, voicing, accompaniment, and "not sung since", with a minimum number of copies. The results show when each was last sung and how often.
4. **Programmes.** Each sung date is a programme; reopen one ("what did we sing last Advent?") and print it.
5. **Hand over.** The whole library exports as a single file, so the next librarian gets it intact.

No member records, no loans to named people, no accounts.

## Existing alternatives

| Alternative | Link | Does well | Falls short for this audience |
|---|---|---|---|
| A spreadsheet (the default) | [MusicaSacra](https://forum.musicasacra.com/forum/discussion/15330/music-library-catalogue/p1), [Choir Director Corner](https://choirdirectorcorner.com/a-simple-system-for-organizing-your-choral-music-library/) | Free, familiar, flexible, searchable by any column. | Holds one "last sung" value per row, so the history is lost or kept in a separate sheet by hand. Filtering by season, voicing, copies, and time since last sung is a manual multi-column filter each week. Easy for the next person to break. |
| MusicLib | [musiclib.net](https://musiclib.net/) | A dedicated, cloud-based library for choirs, orchestras, and bands: copies, checkouts, setlists with performance dates, OCR search of PDFs. | Free only up to 50 scores; an account; a church library is usually hundreds or thousands of titles. |
| MS Access or a general database | [MusicaSacra](https://forum.musicasacra.com/forum/discussion/14121/church-choir-music-database/p1) | Can model history properly. | Called "more trouble that [sic] it was worth" by a librarian who tried it; needs a skill few volunteers have. |

I opened MusicLib's home and about pages; I couldn't see its pricing page or try it.

## What this does better

1. **Every date a piece was sung, and a "not sung since" filter combined with season, voicing, and copies.** A spreadsheet keeps one "last sung" value and needs a manual filter; this keeps the full history and answers the weekly question in one view.
2. **Free for a library of any size, with no account.** MusicLib, the dedicated tool, is free only to 50 scores.

## Likely scope and shape

- Client-only static app. Library and history in IndexedDB under `p100:choir-library:`, versioned, with CSV import and export and a full-library export file.
- Pure, testable core: the catalogue and history model, the filters, CSV column mapping.
- Rough size: 2,000 to 3,000 lines including tests. No dependencies beyond the defaults (CSV parsing is small enough to write), no Cloudflare services, no media assets.
- Privacy class: `local-only`.

## Screen results

- Useful and specific: pass. Volunteer choir librarians, weekly.
- Not already well solved: pass, narrowly. The spreadsheet does most of it; the case is the history and the combined filter.
- Not a thin wrapper / generic generator: pass, with care: it is close to a generic catalogue, and the case rests on the choir-specific history and selection.
- Not justified by SEO, monetization, novelty alone, or use of AI: pass.
- Runs within baseline budget: pass.
- No sensitive subject: pass. Church music is religious material, but the app records titles and dates, not doctrine or advice.
- No accounts / personal data / UGC / external API (or approval requested): pass.
- Maintainable by a weaker model: pass.

## Risks

- **A spreadsheet may be good enough.** This is the main risk: librarians are comfortable in Excel, and a second sheet of dates could do most of this.
- **One device.** A director and a librarian can't both edit live. Export and import cover handover, not sharing.
- **Browser storage** can be cleared; the app must push regular export.

## Open questions

- Should it track loans of copies to singers? Proposed: no; that brings in people's names and checkouts.

## Escalations needed

None.

## Critique

[Critique by Critic (gpt-6-sol, effort high)](https://github.com/ajustinjames/project-100/pull/37#issuecomment-5932968211), recommending revise. Every finding is accepted; none is dismissed. I checked the closest alternative and rejected rather than revised, because what is left after it isn't enough for an app.

| Severity | Finding | Response |
|---|---|---|
| High | The comparison misses close free tools: ChoirDirector.app (free plan, usage and past programmes, tags and voicing filters) and Legata. | Accepted, and checked. [ChoirDirector.app](https://choirdirector.app/features/repertoire-management/) shows "how often each piece has been used and when it last appeared on a program", filters by tags such as occasion and by voicing, and lets you "Review past programs". Its [free plan](https://choirdirector.app/pricing/) covers one choir's repertoire. That is this proposal's first claimed difference. What it doesn't document is a copies count, which is not enough for an app. |
| High | Switching from a spreadsheet is unproven: spreadsheets can keep full history, and a 2025 ALCM guide shows Excel working well. | Accepted. The proposal's own main risk; I have no evidence against it. |
| Medium | The weekly need for this exact combined filter needs evidence, and the first MusicaSacra thread couldn't be opened. | Accepted. (The thread opened for me on 2026-10-01, but the point stands: the evidence supports cataloguing, not this filter.) |
| Low | Keep the data boundary explicit. | Accepted. Moot, given the rejection. |

## Decision

2026-10-01: Rejected because choirDirector.app's free plan already records each piece's usage and past programmes and filters repertoire by tags and voicing, a spreadsheet does the rest well enough for most librarians, and the only remaining gap, a minimum-copies filter, doesn't justify an app.
