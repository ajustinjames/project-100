# Candidate: Killed by EA

<!-- Keep it short. Follow the workflow in docs/APP_ACCEPTANCE.md (steps 4 to 6). Link evidence, and only link pages you have opened and checked. -->

**Idea source:** Owner, 2026-10-22. This is an owner-made exception to [idea ownership](../../docs/PROJECT_CHARTER.md#idea-ownership), the same kind as [Giving to Scale](../../apps/giving-to-scale/PROPOSAL.md). The owner asked for "a tracker like Killed by Google that shows all games, studios, projects, etc that were killed by Electronic Arts." It didn't go through the screen. It goes through critique and selection like any other candidate. It isn't tagged typical or unusual.

**Track:** niche.

**Revised 2026-10-22, after round 1 of the critique:** the live tracker became a finite archive with a stated cutoff date (see Critique). The owner chose this revision instead of accepting the rejection. Because the Critic recommended reject rather than revise, allowing this one revise round is itself part of the owner's exception.

## Problem

Over four decades Electronic Arts has closed or merged a long line of studios it acquired, cancelled announced games, ended products such as Playfish's Facebook games, and retired the online services of hundreds of games. That history comes up whenever another studio closes, and the record is split up:

- **EA's own shutdown lists** cover online services only, on three alphabetical pages ([A–H](https://www.ea.com/legal/service-updates/a-h), [I–Q](https://www.ea.com/legal/service-updates/i-q), [R–Z](https://www.ea.com/legal/service-updates/r-z)). When I opened them on 2026-10-22, they were grouped by title with no search or filter, dated from 2013 with older entries marked "Pre 2013", and mixed in EA Play catalog removals alongside server retirements. They name no studios and no cancellations.
- **Studio closures** are in Wikipedia's [list of EA acquisitions](https://en.wikipedia.org/wiki/List_of_acquisitions_by_Electronic_Arts), which marks 22 acquisitions defunct but gives no closure year for many of them, and in listicles such as [TheGamer (2019)](https://www.thegamer.com/ea-game-developer-shut-down/).
- **Cancellations** are in one-off news, such as EA closing Cliffhanger Games and cancelling its Black Panther game in May 2025 ([GamingOnLinux](https://www.gamingonlinux.com/2025/05/another-dev-gone-ea-cancels-black-panther-and-closes-cliffhanger-games)).

So there is no single dated timeline to answer "what did EA close in 2013?", "what happened to the studios behind my old games?", or "which of the games I played lost their servers, and when?", or to cite in a discussion.

## Audience

People who follow games history: enthusiasts, preservationists, and writers who want a dated, sourced record of what EA closed and when. Players of older EA games looking back at what happened to a series or studio they cared about. They come back when another EA closure is in the news and the history gets discussed again. It's a reference, used occasionally.

## Proposed solution

A single fast page with the feel of Killed by Google, as an **archive with a fixed cutoff date, 22 October 2026** ("Record up to 22 October 2026"). Events dated after the cutoff are left out, even when EA's pages already list them. It doesn't promise to track new events.

1. **Four kinds of entry,** filterable: *studio* (closed, or merged, shown separately and never counted as closed), *online service* (a game's servers retired, by platform), *cancelled* (an announced game that was cancelled), and *product* (a service or product EA ended).
2. **Each entry** gives its name, kind, dates, its age at the end (left out when there is no meaningful start date, as with most cancellations), one neutral past-tense sentence, the platforms where relevant, and **at least one source link plus an archived copy** (Wayback Machine), so it still checks out if the source moves.
3. **One timeline:** newest first, with search over names and series, and filters for kind, year or decade, and platform. Filters live in the URL so a view can be shared ("everything EA retired in 2025").
4. **Online services from EA's own lists,** taken once at the cutoff from the three A–Z pages, with each entry linking back to the page it came from. The rules for what goes in:
   - *Online service* means a game's online play or online services ended on a platform.
   - *Feature closure* is its own label, for a partial change where other online features stayed up (for example DiRT Rally 2.0's website and Racenet Clubs).
   - Left out: EA Play and other catalog removals, and demo or store removals (for example a demo removed from the EA app), because a game leaving a store or subscription isn't a shutdown. The page states these rules.
5. **Summary counts** by kind and year, as plain numbers with an optional small bar chart.
6. **Unknown dates.** Where EA gives only "Pre 2013", or a source gives only a year, the entry shows exactly that ("before 2013", "2004"). Year filters place it in its known year, or in a separate "before 2013, date unknown" group, and the counts show that group separately rather than guessing.
7. **Only events on or before the cutoff.** There are no countdowns and no "is it still up?" claims; the page points players to EA's own lists for current status.

The data is one versioned JSON file, validated by tests: required fields, real dates, end after start, a source and archived copy on every entry, an allowed status, and no duplicates.

Not included: no logos, box art, or screenshots, because they're EA's and its studios' trademarks and fall under the [asset policy](../../docs/DESIGN_AND_ASSETS.md); each kind gets a text symbol instead. No public submissions on the site; corrections go through GitHub issues.

## Existing alternatives

| Alternative | Link | Does well | Tradeoffs for this audience |
|---|---|---|---|
| EA's online services shutdown lists (the strongest for servers) | [A–H](https://www.ea.com/legal/service-updates/a-h), [I–Q](https://www.ea.com/legal/service-updates/i-q), [R–Z](https://www.ea.com/legal/service-updates/r-z) | Authoritative, current, and dated by platform, back to 2013. The right place to check whether a game is still online. | Three alphabetical pages with no search or year view; EA Play removals mixed in; no studios, cancellations, or products. |
| EA Graveyard, published as Game Studio Graveyard (the strongest for studios) | [wiredlain.com](https://wiredlain.com/), [repo](https://github.com/Somesingman/ea-graveyard) | Active (last pushed 2026-01-26), MIT-licensed, studio logos and statuses (closed, revived, declining), search, and a link check in CI. | Studios only. Now includes studios from other publishers (Clover, Ensemble, Lionhead). Loads a third-party script from a Netlify host. Its README says it's "still under construction". |
| Shelf-Life (found by the Critic) | [gameshelflife.com](https://gameshelflife.com/publishers/electronic-arts/) | Ad-free, sourced shutdown dates, including an upcoming one. | Six EA entries, and it says it "isn't a full history"; no studios. |
| Wikipedia | [List of acquisitions by EA](https://en.wikipedia.org/wiki/List_of_acquisitions_by_Electronic_Arts) | Thorough and referenced, with defunct and merged acquisitions marked. | A table of acquisitions, not a timeline; many closure years missing; no services. |
| EA server lifespan spreadsheet (found by the Critic) | [Google Sheet](https://docs.google.com/spreadsheets/d/1bmODuO3efhIab0zZhAcI1b_BeqTpu6MjmVfHs_p3_mI/edit) | About 157 games with platforms, release and closure dates, and days online, including closures before 2013 that EA's pages leave undated. | A spreadsheet: no search beyond the sheet's own tools, no sources per row, and no studios, cancellations, or products. |
| Games That Weren't (found by the Critic) | [gamesthatwerent.com](https://www.gamesthatwerent.com/cancelled-games/) | A long-running archive of cancelled and unreleased games, since 1999, indexed by platform. | Cancellations only, with no publisher filter, so EA's cancellations can't be listed together. |
| Killed by EA (Huskynarr) | [repo](https://github.com/Huskynarr/killed-by-electronicarts) | The same idea, MIT-licensed. | Last pushed 2022-09-18. Its homepage (killedbyea.info) didn't connect on 2026-10-22. 12 studio entries with the opening and closing dates swapped. Abandoned. |

I read the spreadsheet through its CSV export, and the wiredlain HTML, the Huskynarr data, and both repositories' metadata through the GitHub API on 2026-10-22.

## What this does better

1. **One timeline across kinds.** Studios, server retirements, cancellations, and products in one dated, searchable list. EA covers only servers and EA Graveyard only studios. Checkable: filtering to 2013 shows both the studio closures and the server retirements of that year, each with a source.
2. **EA's server list made searchable by year, under stated rules.** Checkable: filtering to *online service* and a year gives every entry on EA's three pages for that year that meets the inclusion rules above (online play or services ended), with feature closures labelled separately and catalog, demo, and store removals left out. Each entry links back to EA's page.

Also: no ads and no third-party scripts beyond the project's standard analytics, works offline once loaded, and every source has an archived copy.

## Likely scope and shape

- Client-only static page. The data is a JSON file bundled at build time. No Cloudflare services and no runtime API.
- Pure, testable core: the data schema and validator, date and age calculations, filtering and URL state, and the counts.
- Rough size: 800 to 1,500 lines of code including tests, plus the dataset. **The dataset is the main work,** a one-time job: roughly 40 to 60 studio, cancellation, and product entries sourced by hand, plus the server retirements on EA's three pages (several hundred), each classified as server retirement or catalog removal.
- Privacy class: `none`.

## Screen results

- Useful task, used more than once: yes, as a reference that comes up again with each new closure. Occasional.
- Value comes from the software itself, not an API or AI model: yes. The value is in a sourced dataset and a searchable timeline. There's no runtime API, and sources are checked by hand while the data is assembled.
- Not for search traffic, ads, novelty alone, or use of AI: yes.
- No ongoing human curation or moderation: yes, after the revision. The archive is complete and correct as of its stated cutoff, and it says so. It makes no claims about current status or upcoming events, so it doesn't go wrong when EA announces more. A later dated edition is optional, never needed for the page to stay correct. Remaining upkeep is source links breaking, which the archived copies cover.
- Runs within baseline budget: yes, a static page.
- No sensitive subject: **close to one.** Every entry is a factual claim about a named company, under a critical title. That's close to misinformation-sensitive, so I'm escalating.
- No accounts / personal data / UGC / external API (or approval requested): yes.

## Risks

- **Accuracy about a real company.** Mitigations: a source and an archived copy on every entry, neutral wording ("closed", "merged", "online services retired"), "killed" used only in the title as the genre's convention, and a corrections link.
- **Classification errors.** Telling a server retirement apart from a catalog removal, or a closure from a merger, is the hard part, and errors here are factual errors. The schema requires a status, and the build brief should gate the prototype on a hand-checked sample.
- **The name.** "Killed by EA" uses EA's name critically. It's descriptive use, as with Killed by Google, and there are no logos. The owner should confirm it with the sensitive-subject approval.
- **A frozen archive ages.** Players may expect it to be current. The cutoff is shown at the top, and the page points them to EA's lists for current status.
- **Dataset effort.** Sources disagree on some dates (Bullfrog, Westwood). Where they do, the entry gives the best-supported date and says the sources differ.

## Open questions

- Keep the name "Killed by EA", or use a more neutral one such as "EA Graveyard"? Proposed: keep it, and the owner confirms it with the approval.
- Cutoff date: settled after the re-score as 22 October 2026, fixed before the dataset is assembled.

## Escalations needed

- `sensitive-subject`: every entry is a factual claim about a named company, under a critical title. Requested in [#53](https://github.com/ajustinjames/project-100/issues/53).

## Critique

<!-- Step 6: link the Critic's PR comment, copy its scores, then respond to every finding: what changed, or why it was dismissed. For each dismissed Critical finding, also link the Critic's explicit acceptance or the resolved disagreement outcome that permits advancing. If there was a revise round, give both sets of scores. -->

Round 1: [Critique by Critic (gpt-6-sol, effort high)](https://github.com/ajustinjames/project-100/pull/51#issuecomment-6341348400), recommending **reject**. The owner chose one revise round toward the Critic's "strongest version" instead of accepting it. Every finding is accepted; none is dismissed.

| Round | Usefulness | Advantage | Feasibility | Upkeep | Total |
|---|---|---|---|---|---|
| 1 | 3 | 2 | 3 | 1 | 9/20 |
| 2 (after revision) | 3 | 3 | 3 | 4 | 13/20 |

| Severity | Finding | Response |
|---|---|---|
| Critical | The live tracker (current status, upcoming shutdowns) needs ongoing manual curation, a kill criterion. | Accepted. It's now a finite archive with a stated cutoff, as the Critic's strongest version proposed. Countdowns, upcoming shutdowns, and current-status claims are removed, and the page points players to EA's own lists. The Critic needs to accept that this resolves the Critical finding in the re-score. |
| High | EA still publishes dated, platform-specific shutdown lists (A–H, I–Q, R–Z), and the proposal wrongly said the official list was gone. | Accepted, and my error. I had opened only the policy landing page. I opened all three pages on 2026-10-22: alphabetical, no search, from 2013, with EA Play removals mixed in. They are now the main alternative for servers, and the advantage is a year-searchable view across them with removals separated, plus the kinds EA doesn't cover. |
| Medium | Missed alternatives: Shelf-Life and an EA shutdown spreadsheet. | Accepted. Shelf-Life is in the table (opened: six EA entries, "isn't a full history"). The spreadsheet is noted but not relied on, because I couldn't open it. |
| Medium | The data model must separate server retirement from catalog removal, closure from merger, and state completeness limits. | Accepted. Catalog removals are left out and the page says so, merged is its own status, "before 2013" is shown where EA gives no date, and the cutoff is stated. |
| Low | Some cited pages couldn't be checked by the Critic (GameRant, TheGamer, wiredlain). | I opened GameRant and TheGamer on 2026-10-22. The GameRant link is removed, since EA's own lists replace it. TheGamer stays as an example of a listicle. wiredlain's scope is confirmed from its repository. |

Round 2: [Re-score by Critic (gpt-6-sol, effort high)](https://github.com/ajustinjames/project-100/pull/51#issuecomment-6353144957), recommending **advance**. The Critic explicitly accepts that the revision resolves the Critical finding, and found the High resolved. It marked both Mediums and the Low partly resolved, and raised these:

| Severity | Finding | Response |
|---|---|---|
| Medium (round 1, partly resolved) | The spreadsheet deserves a direct comparison. | Accepted. I opened it through its CSV export (about 157 games with release and closure dates) and added it to the table. |
| Medium (round 1, partly resolved) | Event distinctions and completeness limits. | Covered by the three new findings below. |
| Low (round 1, partly resolved) | TheGamer and wiredlain couldn't be read by the Critic. | TheGamer opened for me on 2026-10-22, and wiredlain's scope is confirmed from its repository. No claim rests on them alone. |
| High | "Every retirement EA lists for that year" is too broad: EA's pages include feature closures (DiRT Rally 2.0's website and Racenet Clubs) and demo removals. | Accepted. Inclusion rules are now stated (Proposed solution, item 4): online play or services ended counts; partial changes get a *feature closure* label; catalog, demo, and store removals are left out. The advantage claim is narrowed to those rules. |
| Medium | The date model needs an unknown-date path. | Accepted. Item 6: unknown dates are shown as given, age is left out without a meaningful start date, and undated entries are grouped and counted separately. |
| Medium | Fix the cutoff before assembling the dataset. | Accepted. The cutoff is 22 October 2026, and later events on EA's pages are left out. |

The Critic also found Games That Weren't, which is now in the table. These responses clarify rules and narrow a claim, without changing the audience, scope, track, or kind of advantage, so no further re-score is needed (and the one round is used). The build brief carries the classification, unknown-date, and cutoff rules, and gates the prototype on a hand-checked sample.

## Decision

<!-- Step 6, dated lines; the latest one is the candidate's state (docs/APP_ACCEPTANCE.md#6-select-or-reject): "YYYY-MM-DD: Selected for Labs because ...", "YYYY-MM-DD: Blocked: awaiting <approval kind> (<link>)", "YYYY-MM-DD: Benched: ranked below the cut (total N/20)", or "YYYY-MM-DD: Rejected because ...". Add a new line for each change; don't edit old ones. -->

2026-10-22: Selected for Labs because it scored 13/20 after the revise round, the Critic explicitly accepted that the revision resolves the Critical finding, and it is the only eligible candidate (no benched candidates are waiting). The critique shaped it from a live tracker into a fixed archive with stated inclusion and date rules.

2026-10-22: Blocked: awaiting sensitive-subject ([#53](https://github.com/ajustinjames/project-100/issues/53))
