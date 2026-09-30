# Candidate: Bell Splits

<!-- Keep it short. Follow the workflow in docs/APP_ACCEPTANCE.md (steps 4 to 6). Link evidence, and only link pages you have opened and checked. -->

**Idea source:** Originator (`claude-opus-5-5`).

## Problem

In a handbell choir each ringer is responsible for a few bells, and the director decides who has which. The common system gives each position two neighbouring notes plus their accidentals, and needs 11 ringers for three octaves, 12 for four, and 14 for five. Small choirs rarely have that many, and pieces differ in which bells they use, so the director reworks the split: move the top bells onto other positions, leave positions vacant, share a bell between two ringers. When the split changes between pieces, bells also have to move on the table between pieces.

Evidence that this is a recurring, manual job:

- Michèle Sharik's class notes for Handbell Musicians of America list the standard assignment and then hand-worked "modified" versions for fewer ringers (9 for three octaves, 10 for four, 12 for five), and say "Many modifications are possible; the following are merely examples." They also describe systems where "the distribution of bells is different for each piece of music", and what that costs: one director's group took "an excessive amount of time re-arranging bells between pieces". ([class notes, PDF](https://handbellmusicians.org/docs/symposium/classnotes/Sharik.Theres%20More%20Than%20One-Way.pdf))
- A book exists only to do this for directors: the *Handbell Assignment Book* sets out an eight-to-ten-ringer system and prints worked assignments for over 400 published pieces. ([Malmark listing](https://malmark.com/product/handbell-assignment-book/), $24.95, out of stock when checked)
- A how-to for directors tells them to build an assignment chart as a table, a column per ringer, and to "keep the chart updated as changes occur within the group." ([Art of Handbell Ringing](https://www.artofhandbellringing.com/musicality/how-to-assign-handbells-for-a-perfect-ensemble-with-sample-chart/))
- On the Handbell-L mailing list, a director built and shared his own bell assignment table by position, noting it "would need adjustment for individual pieces." ([Handbell-L thread](https://groups.google.com/g/handbell-l/c/wq7nvWJqK7Y))
- An article for small church ensembles of six to eight ringers plans around absences and around music that "rarely requires more than 12 bells at one time." ([Reformed Worship](https://www.reformedworship.org/resource/dust-those-bells))

## Audience

Directors of small handbell and handchime choirs, mostly in churches and schools, who have fewer ringers than the standard chart assumes or whose numbers change week to week. They come back for every new piece, every concert or service programme, and whenever a ringer is away.

## Proposed solution

A browser app that keeps the choir's pieces on the device:

1. **Set up the choir.** Pick the bell set (2 to 5 octaves, or mark the bells you own) and the number of ringers.
2. **Enter a piece.** Tap the bells the piece uses on a keyboard strip. This is the "bells used" chart printed at the top of handbell music.
3. **See the split.** The app starts from the standard two-notes-plus-accidentals assignment, folded down to the number of ringers the way the published modified charts do (top bells reassigned, part numbers kept). It shows each position's bells for this piece and marks positions that have none, and positions holding more than a chosen limit.
4. **Adjust it.** Move a bell to another position, or mark it shared between two. The counts and warnings update.
5. **Plan a programme.** Put pieces in running order and see, for each position, which bells come onto and leave the table between pieces.
6. **Print.** An assignment chart per piece and a card per position.

Positions are numbered, as in the published charts. There is no field for ringers' names.

It does not read the score. It doesn't know when bells ring, so it can't tell whether one ringer's bells collide in a given bar. It counts and lays out; the director still judges playability.

## Existing alternatives

I searched the web, the app stores, and F-Droid for handbell assignment software and found none. The results were change-ringing simulators and novelty bell apps.

| Alternative | Link | Does well | Falls short for this audience |
|---|---|---|---|
| A hand-made chart on paper or in a spreadsheet (the default) | [Art of Handbell Ringing](https://www.artofhandbellringing.com/musicality/how-to-assign-handbells-for-a-perfect-ensemble-with-sample-chart/) | Free and flexible. | Every piece and every change of numbers is worked out and redrawn by hand. Nothing shows which positions are overloaded or empty, or what moves between pieces. |
| Published strategy charts | [Sharik class notes](https://handbellmusicians.org/docs/symposium/classnotes/Sharik.Theres%20More%20Than%20One-Way.pdf) | Free, authoritative, and cover several systems. | Fixed examples for a few choir sizes and whole bell sets, not for the bells one piece actually uses. |
| *Handbell Assignment Book* | [Malmark](https://malmark.com/product/handbell-assignment-book/) | Worked assignments for over 400 pieces. | $24.95 and out of stock; covers only the listed pieces and one system for 8 or 10 ringers. |
| Printable position cards | [Teachers Pay Teachers](https://www.teacherspayteachers.com/Product/Handbell-Position-Assignment-Guide-and-Position-Cards-Printable-10102713) | Ready-made cards for standard positions, 2 to 5 octaves. | $5; static cards for full standard set-ups (10 to 14 ringers), not per piece or for a short choir. |

There is no free tool to try, so the comparison is with the hand-made chart.

## What this does better

1. **It works from the bells a piece actually uses and the ringers you actually have.** The published charts assign a whole bell set to a fixed number of ringers. Here the director marks the piece's bells and the ringer count, and sees each position's load for that piece, with empty and overloaded positions marked.
2. **It shows the table changes between pieces.** For a programme, it lists the bells each position gains and loses between consecutive pieces, which the class notes name as the cost of per-piece assignments. A paper chart per piece doesn't show this.

## Likely scope and shape

- Client-only static app. State in `localStorage` under `p100:bell-splits:` with a versioned format, and JSON export and import.
- Pure functions for the core (the default split for a range and ringer count, per-position load, and the difference between two pieces), which are easy to unit-test. The keyboard strip and charts are drawn from the data with HTML and CSS.
- Rough size: 1,500 to 2,500 lines including tests. No dependencies beyond the defaults, no Cloudflare services, no media assets.
- Privacy class: `local-only`. It stores piece titles, bell lists, and position numbers. It has no name fields.

## Screen results

- Useful and specific: pass. Directors of small handbell choirs, for every piece and programme.
- Not already well solved: pass. No software found; the alternatives are paper, a book, and static printables.
- Not a thin wrapper / generic generator: pass. The value is the assignment model.
- Not justified by SEO, monetization, novelty alone, or use of AI: pass.
- Runs within baseline budget: pass. Static files only.
- No sensitive subject: pass.
- No accounts / personal data / UGC / external API (or approval requested): pass. Positions are numbered; no names are asked for.
- Maintainable by a weaker model: pass. A small data model and a few pure functions.

## Risks

- **Small audience.** Handbell choirs are a niche, and only the director of each uses this.
- **Without the score, the help is limited.** The app can't see rhythm, so it can't say whether a position's bells are playable together. Directors may feel that counting and layout is the easy part.
- **Assignment conventions vary.** Directors use different systems (the class notes describe four). Starting from one standard system and allowing free moves may not suit a choir that uses another.
- **A spreadsheet may be enough** for a director whose numbers never change.

## Open questions

- Should a second starting system (the eight-to-ten-ringer one) be offered from the first version? Proposed: no; start from the most widely used one and allow free moves.
- Should handchimes be a separate set, or the same positions? Proposed: the same positions, with a label.

## Escalations needed

None. It runs in the browser, stores only piece and bell data locally, has no accounts, and asks for no names or other personal data. It touches no sensitive subject and uses no external API.

## Critique

<!-- Step 6: link the Critic's PR comment, then respond to every finding: what changed, or why it was dismissed. For each dismissed Critical or High finding, also link the Critic's explicit acceptance or the resolved disagreement outcome that permits advancing. -->

| Severity | Finding | Response |
|---|---|---|

## Decision

<!-- Step 6, one dated line: "YYYY-MM-DD: Selected for Labs because ..." or "YYYY-MM-DD: Rejected because ..." -->
