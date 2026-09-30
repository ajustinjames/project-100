# Candidate: Score Strips

<!-- Keep it short. Follow the workflow in docs/APP_ACCEPTANCE.md (steps 4 to 6). Link evidence, and only link pages you have opened and checked. -->

**Idea source:** Idea generator (`gpt-6-astra`, effort `medium`).

## Problem

A musician with low vision often needs notation two or three times the printed size. A page of music enlarged that much no longer fits on a screen or a stand, so reading it means zooming in and then scrolling sideways along each line and down to the next, with hands that are busy playing. The fix is to cut the page into its lines of music (systems) and show one enlarged line at a time.

Evidence that this is a recurring need, met today by paid or single-platform tools:

- Sound Without Sight, a UK hub for blind and partially sighted musicians, keeps a guide to software for displaying scores in large print. It describes a continuous enlarged stave as "much easier than having to zoom in and out of a whole page and move between lines", and every PDF option it lists is paid and tied to one platform: forScore (iOS and Mac, £17.99), Power Music AF (Windows, £35), LargePrintMusic (Windows and Mac), and Lime Lighter (Windows, "significantly more expensive"). The free options it lists (MuseScore, Sibelius First) need the score as MusicXML, not a PDF. ([Sound Without Sight, 2025](https://soundwithoutsight.org/hub-articles/using-software-to-display-music-scores-in-large-print/))
- A musician who writes about digital sheet music described MusicZoom, which "lets you 'cut' your music apart a line or a measure at a time for extreme magnification", and added that it is "for iPads only, but hopefully someone will come up with something equivalent for Android tablets". ([Hugh Sung, 2014](https://hughsung.com/personal-blog/3-ways-to-enlarge-digital-sheet-music))
- A partially sighted musician wrote his own Windows program for exactly this: "I need music to be enlarged in order to see it easily." The user marks the top and bottom of each section on an image of the page, then scrolls with a pedal. ([Enlarge and Scroll](https://www.marchantpeter.co.uk/enlarge-and-scroll-music-and-lyrics.php))
- forScore ships the feature as "an accessibility option": Reflow detects the systems on each page and lays them end to end, magnified. ([forScore Reflow](https://forscore.co/reflow/))

## Audience

Musicians with low vision who read from PDFs or scans: choir singers, church organists and pianists, band and orchestra players, music students. Also anyone reading from a small tablet. They come back for every new piece, and open saved pieces at every practice and rehearsal.

## Proposed solution

A browser app that works on the device:

1. **Open a score.** A PDF, or photos or scans of the pages. It is rendered in the browser and never uploaded.
2. **Mark the lines.** The app proposes a band for each system by finding the white gaps between them, and the musician drags the band edges, adds, deletes, or reorders bands. Wide systems can be cut at chosen points into shorter strips. Marking by hand is always available, so a wrong guess costs a drag, not the piece.
3. **Read.** One strip at a time fills the width of the screen at whatever size the musician needs, with the next strip visible beneath when there is room. Next and back work by key, tap, or a page-turn pedal (these send arrow or page keys).
4. **Make it readable.** High-contrast and inverted colours, and a choice of how much of the next strip to preview.
5. **Keep it.** Pieces are saved in the browser with their strips and the place reached. Export and import a piece's strip layout.

It does not recognise notes, transpose, or re-engrave. It enlarges what is on the page. Repeats and jumps (D.S., codas) are handled by letting the musician duplicate strips into playing order.

## Existing alternatives

| Alternative | Link | Does well | Falls short for this audience |
|---|---|---|---|
| Zooming in a PDF viewer (the default) | | Free, on every device. | Zoomed in, a line is wider than the screen: the player scrolls sideways along it and then back and down, mid-piece. |
| Enlarged photocopies, or cutting and pasting lines in a publishing program | [Sound Without Sight](https://soundwithoutsight.org/hub-articles/using-software-to-display-music-scores-in-large-print/) | No device needed at the stand. | Slow to make for every piece; many more pages and page turns. |
| forScore (Reflow) | [Reflow](https://forscore.co/reflow/), [price](https://forscore.co/kb/how-to-buy/) | Automatic system detection, editable zones, a continuous magnified line; a mature score library. | iPad and other Apple devices only; $24.99. Reflow renders "at up to twice" the original size. |
| MusicZoom | [Hugh Sung](https://hughsung.com/personal-blog/3-ways-to-enlarge-digital-sheet-music) | Cuts music by line or by bar for extreme magnification. | iPad only. |
| Power Music AF | [Power Music](https://powermusicsoftware.com/Products/Power-Music-AF) | Designed with visually impaired musicians; pedal and keyboard navigation. | Windows only; £35. |
| LargePrintMusic | [largeprintmusic.com](https://www.largeprintmusic.com/en/) | Enlarges a PDF and writes a new PDF at any size. | Windows and Mac only; paid after an evaluation version. |
| Enlarge and Scroll | [marchantpeter.co.uk](https://www.marchantpeter.co.uk/enlarge-and-scroll-music-and-lyrics.php) | The same idea as this candidate: mark sections by hand, scroll by pedal. | Windows desktop only; works from JPG images of pages. |
| MuseScore Studio | [Sound Without Sight](https://soundwithoutsight.org/hub-articles/using-software-to-display-music-scores-in-large-print/) | Free; re-lays out music at any size. | Needs the score as MusicXML or its own format. It can't enlarge a scanned or purchased PDF. |

The best free option for a PDF is the PDF viewer's zoom, and its failure is the problem described above. I could not install and run the paid apps; the comparison rests on their own documentation and the Sound Without Sight guide.

## What this does better

1. **Line-at-a-time enlargement of any PDF or scan, free, on any device with a browser.** Every tool that does this is paid and tied to one platform: iPad (forScore, MusicZoom), Windows (Power Music AF, Enlarge and Scroll), or Windows and Mac (LargePrintMusic). A musician with an Android tablet, a Chromebook, or a Linux laptop has no such tool, and nobody has a free one.
2. **No fixed ceiling on size.** A strip can be cut into shorter pieces, so the music can be as large as the musician needs. forScore's Reflow documents a limit of twice the original size.

## Likely scope and shape

- Client-only static app. Pages are rendered to canvas in the browser. Saved pieces (the file, the strip rectangles, the place reached) go in IndexedDB under `p100:score-strips:` with a versioned format.
- One runtime dependency: `pdfjs-dist` (Mozilla, Apache-2.0) to render PDF pages. Rendering PDFs is the kind of hard problem [DEPENDENCIES.md](../../docs/DEPENDENCIES.md) says to use a library for, and Size Sieve's build showed it runs under this site's content security policy ([RETRO](../../apps/size-sieve/RETRO.md)). Images need no library.
- Pure, testable core: finding candidate bands from a row-by-row ink profile, and the strip and reading-order model. The proposal step is a convenience, not a promise: every band is editable and hand-marking always works.
- Rough size: 3,000 to 4,500 lines including tests. No Cloudflare services, no media assets.
- Privacy class: `local-only`. The score and the musician's layout stay in the browser. Nothing is uploaded.

**Labs feasibility check.** Before polish, measure how often the proposed bands are right on at least ten freely licensed scores of different kinds (piano, choral, single-line, hymnal), and how many edits the rest need. If a typical page needs more than a few drags, make hand-marking the main path. The app is still useful with hand-marking alone (Enlarge and Scroll works that way), so this shapes the design; it isn't a discard gate.

## Screen results

- Useful and specific: pass. Low-vision musicians, for every piece and every practice.
- Not already well solved: pass. Solved well only on paid, single-platform apps.
- Not a thin wrapper / generic generator: pass. It is a reader built for one task.
- Not justified by SEO, monetization, novelty alone, or use of AI: pass. No AI, no recognition.
- Runs within baseline budget: pass. Static files only.
- No sensitive subject: pass. It is a reading aid, not health advice. See Escalations needed.
- No accounts / personal data / UGC / external API (or approval requested): pass.
- Maintainable by a weaker model: pass. Rectangles on rendered pages, and one well-known library.

## Risks

- **Accessibility has to be real.** The audience has low vision, so the app's own controls must be large, high-contrast, and fully keyboard-operable, and the marking step must be usable at high zoom. This needs testing beyond the usual checks, ideally with a low-vision musician.
- **Marking is work.** If the proposed bands are often wrong, setting up a piece is tedious. The feasibility check measures this.
- **Browser storage can be cleared.** Scores saved in IndexedDB can be evicted or lost with site data. The app must say so, and export the layout so re-opening the PDF restores it.
- **Large scans** use a lot of memory on a phone or old tablet. Render one page at a time.
- **Copyright.** Scores are often copyrighted. The app keeps the musician's own copy on their device and has no sharing.

## Open questions

- Should it write an enlarged PDF for printing, as LargePrintMusic does? Proposed: not in the first version; reading on screen first.
- Should it auto-scroll at a tempo? Proposed: no; pedal, key, or tap.

## Escalations needed

None. It stores the user's own files in their browser, has no accounts, and sends nothing. **Question for the Critic:** this is an aid for people with a visual impairment. I judge that it is not "medicine, diagnosis, or health treatment" under the [charter](../../docs/PROJECT_CHARTER.md#sensitive-subjects), because it gives no advice and only changes how a document is displayed, and [APP_ACCEPTANCE.md](../../docs/APP_ACCEPTANCE.md#1-generate-ideas) names "accessibility and daily-living aids" as an area to generate ideas in. If you disagree, say so and I'll escalate.

## Critique

<!-- Step 6: link the Critic's PR comment, then respond to every finding: what changed, or why it was dismissed. For each dismissed Critical or High finding, also link the Critic's explicit acceptance or the resolved disagreement outcome that permits advancing. -->

| Severity | Finding | Response |
|---|---|---|

## Decision

<!-- Step 6, one dated line: "YYYY-MM-DD: Selected for Labs because ..." or "YYYY-MM-DD: Rejected because ..." -->
