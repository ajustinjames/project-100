# Candidate: Killed by EA

<!-- Keep it short. Follow the workflow in docs/APP_ACCEPTANCE.md (steps 4 to 6). Link evidence, and only link pages you have opened and checked. -->

**Idea source:** Owner, 2026-10-22. This is an owner-made exception to [idea ownership](../../docs/PROJECT_CHARTER.md#idea-ownership), the same kind as [Giving to Scale](../../apps/giving-to-scale/PROPOSAL.md). The owner asked for "a tracker like Killed by Google that shows all games, studios, projects, etc that were killed by Electronic Arts." It didn't go through the screen. It goes through critique and selection like any other candidate. It isn't tagged typical or unusual.

**Track:** niche.

## Problem

Electronic Arts regularly retires the online services of its older games, often several in a month, and over four decades it has closed or absorbed a long list of studios it acquired. Players who own one of those games want to know whether its multiplayer still works and when it will stop. People who follow the industry want the record: which studios went, when, and what they made.

That record is scattered. Each retirement is a short news item at the time, for example [GameRant, 13 June 2026](https://gamerant.com/ea-game-shutting-down-grid-legends-servers/) (Battlefield Hardline on consoles, Plants vs. Zombies HD, Madden NFL 23, Apex Legends on Switch, NHL 22 and 23, and GRID Legends on consoles, all in one article) and [VGC, October 2022](https://www.videogameschronicle.com/news/ea-is-ending-online-services-for-mirrors-edge-onrush-and-more) (Army of Two, Mercenaries 2, Red Alert 3, Onrush, Mirror's Edge, and more). VGC cited EA's own [service-updates page](https://www.ea.com/service-updates) as the list. When I opened that page on 2026-10-22, it only gave the general policy (games are retired when players fall to "fewer than 1% of all peak online players across all EA titles") and listed no games. So the official list is no longer public in one place. Studio closures are summarised in listicles such as [TheGamer (2019)](https://www.thegamer.com/ea-game-developer-shut-down/). Wikipedia's [list of EA acquisitions](https://en.wikipedia.org/wiki/List_of_acquisitions_by_Electronic_Arts) marks the defunct studios with a dagger but gives no closure year for many of them.

Recurrence: new retirements are announced throughout the year (GameRant says EA shuts games down "pretty much every single month"), and studio closures and cancellations keep coming. For example, EA closed Cliffhanger Games and cancelled its Black Panther game in May 2025 ([GamingOnLinux](https://www.gamingonlinux.com/2025/05/another-dev-gone-ea-cancels-black-panther-and-closes-cliffhanger-games)).

## Audience

- **Players of older EA games** who want to know whether a game's online play still works, or when it ends, before they buy a used copy or plan a last session with friends. They come back when a new wave is announced.
- **People who follow the games industry**, such as enthusiasts, preservationists, and writers, who want a dated, sourced record of what EA closed and when, to settle a discussion or to cite.

It's a reference people come back to occasionally, not a daily tool.

## Proposed solution

A single fast page in the style of Killed by Google: a graveyard list, newest first, with upcoming shutdowns pinned to the top.

1. **Four kinds of entry,** filterable: *studio* (closed, or merged into another EA studio), *online service* (a game's servers retired, by platform), *cancelled* (an announced game that was cancelled), and *product* (a service or other product EA ended, such as Playfish's Facebook games).
2. **Each entry** gives its name, kind, start and end dates, a computed age ("closed 9 years ago, aged 12"), one neutral past-tense sentence, the platforms where relevant, and **at least one source link** to a page that states the fact. Entries with an upcoming date show a countdown.
3. **Search and filters:** text search over names and series, plus filters for kind, decade or year, and platform. The filters live in the URL, so a filtered view can be shared ("everything EA retired in 2025").
4. **Summary counts** at the top (studios closed, games retired, by year), shown as plain numbers with an optional small year-by-year bar chart.
5. **"Data as of <date>"** shown plainly, so a stale list never reads as current.

The data is one versioned JSON file in the repository, validated by tests: required fields, real dates, end after start, a source on every entry, and no duplicates.

Not included: no logos, box art, or screenshots, because they're EA's and its studios' trademarks and fall under the [asset policy](../../docs/DESIGN_AND_ASSETS.md). Each kind gets a text symbol instead. There are no public submissions on the site; corrections go through GitHub issues.

## Existing alternatives

| Alternative | Link | Does well | Tradeoffs for this audience |
|---|---|---|---|
| News search and EA's help pages (the default) | [GameRant](https://gamerant.com/ea-game-shutting-down-grid-legends-servers/), [EA service updates](https://www.ea.com/service-updates) | Current and authoritative when each wave is announced. | One wave per article, nothing cumulative. EA's page listed no games when I opened it on 2026-10-22. |
| Killed by EA (Huskynarr) | [GitHub repo](https://github.com/Huskynarr/killed-by-electronicarts), homepage killedbyea.info | The same idea, built on the Killed by Google format, MIT-licensed. | Last pushed 2022-09-18. The homepage didn't connect on 2026-10-22. Its `graveyard.json` has 12 entries, all studios, with the opening and closing dates swapped (Bullfrog: `dateOpen` 2004, `dateClose` 1987), and its Victory Games entry links to Westwood's Wikipedia page. In practice it's abandoned. |
| EA Graveyard, published as Game Studio Graveyard (the strongest) | [wiredlain.com](https://wiredlain.com/), [repo](https://github.com/Somesingman/ea-graveyard) | Active (last pushed 2026-01-26), MIT-licensed, with studio logos, statuses (closed, revived, declining), search and filters, and a link check in CI. | Studios only: no online service retirements and no cancelled games. It now includes studios from other publishers (Clover, Ensemble, Lionhead), so it's no longer an EA-only record. It loads a third-party script from a Netlify host. Its README says it's "still under construction". |
| Wikipedia | [List of acquisitions by EA](https://en.wikipedia.org/wiki/List_of_acquisitions_by_Electronic_Arts) | Thorough and referenced: 48 acquisitions, with the defunct and merged ones marked. | A table of acquisitions, not a graveyard. Many defunct rows give no closure year, and service retirements aren't covered. |
| Killed by Google (the model) | [killedbygoogle.com](https://killedbygoogle.com/) | The format people know: tombstones, ages, and filters across 308 entries. | Google only. It shows an advertisement slot. |

I read the HTML of the wiredlain site, the Huskynarr data file, and both repositories' metadata through the GitHub API on 2026-10-22.

## What this does better

Checked against EA Graveyard, the strongest:

1. **One record across kinds.** Studios, online service retirements, cancellations, and products in one filterable list, where EA Graveyard covers studios only. Checkable: filtering to *online service* and 2025 lists that year's retirements, and every entry links a source.
2. **Upcoming shutdowns first, with dates.** This answers "does my game's online play still work?", which a studio-only list can't. Checkable: an entry with a future end date appears above the graveyard with a countdown.

Also: no ads, no third-party scripts beyond the project's standard analytics, works offline once loaded, and the "data as of" date is visible.

## Likely scope and shape

- Client-only static page. The data is a JSON file bundled at build time. No Cloudflare services and no external API at runtime.
- Pure, testable core: the data schema and validator, age and countdown calculations, filtering and URL state, and the summary counts.
- Rough size: 800 to 1,500 lines of code including tests, plus the dataset. **The dataset is the main work:** a first version of roughly 100 to 200 entries, each checked against a source I opened.
- Privacy class: `none`.

## Screen results

- Useful task, used more than once: yes. People check a game's online status before an announced date and use the list as a reference. Use is occasional.
- Value comes from the software itself, not an API or AI model: mostly yes. The value is in the sourced dataset and how it's presented. There's no runtime API, and sources are opened by hand while the data is assembled.
- Not for search traffic, ads, novelty alone, or use of AI: yes. The case is a cumulative, sourced record, which EA no longer publishes in one place.
- No ongoing human curation or moderation: **not cleanly.** The historical record is complete as of its date and doesn't become *wrong*, only out of date. Staying current means adding entries when EA announces retirements, several times a year. Each update would be a small data-only PR by the Maintainer, with every new entry's source opened and checked by the schema tests. That is ongoing curation, though light. I'm stating it rather than arguing it away; the Critic should weigh it under Upkeep.
- Runs within baseline budget: yes, a static page.
- No sensitive subject: **close to one.** Every entry is a factual claim about a real company, and the title "Killed by" frames those facts critically. That's close to misinformation-sensitive, so I'm escalating rather than arguing it doesn't apply.
- No accounts / personal data / UGC / external API (or approval requested): yes. There are no submissions on the site; corrections go through GitHub issues.

## Risks

- **Accuracy about a real company.** A wrong date or a misattributed closure is a factual error about EA. Mitigations: a source on every entry, neutral wording ("closed", "online services retired"), "killed" used only in the title as the genre's convention, a "data as of" date, and a corrections link.
- **The name.** "Killed by EA" uses EA's name and frames it critically. It's descriptive use, as with Killed by Google, and there are no logos. The owner should confirm they're comfortable with it (see Open questions).
- **Staleness.** If the Maintainer stops adding retirements, the upcoming section empties and the record falls behind. The "data as of" date keeps that honest.
- **Closed, merged, or rebranded.** Bullfrog merging into EA UK, or DreamWorks Interactive becoming DICE LA, must be shown accurately, not all counted as kills.
- **Dataset effort.** Sourcing well over 100 entries is real work, and sources disagree; dates for Bullfrog and Westwood differ between MobyGames, TheGamer, and Wikipedia.

## Open questions

- Keep the name "Killed by EA", or use a more neutral one such as "EA Graveyard"? Proposed: keep it. It's what the owner asked for, and the genre name is familiar. The owner should confirm it along with the sensitive-subject approval.
- Do merged or rebranded studios count? Proposed: include them with a separate "merged" status, never shown as closed.
- How far back should online service retirements go? Proposed: start with retirements announced from 2010, the earliest waves found in coverage, and show that start date on the page.

## Escalations needed

- `sensitive-subject`: every entry is a factual claim about a named company, under a critical title (see the screen results). Approval will be requested after the critique if the candidate is selected.

## Critique

<!-- Step 6: link the Critic's PR comment, copy its scores, then respond to every finding: what changed, or why it was dismissed. For each dismissed Critical finding, also link the Critic's explicit acceptance or the resolved disagreement outcome that permits advancing. If there was a revise round, give both sets of scores. -->

| Usefulness | Advantage | Feasibility | Upkeep | Total |
|---|---|---|---|---|
| | | | | /20 |

| Severity | Finding | Response |
|---|---|---|

## Decision

<!-- Step 6, dated lines; the latest one is the candidate's state (docs/APP_ACCEPTANCE.md#6-select-or-reject): "YYYY-MM-DD: Selected for Labs because ...", "YYYY-MM-DD: Blocked: awaiting <approval kind> (<link>)", "YYYY-MM-DD: Benched: ranked below the cut (total N/20)", or "YYYY-MM-DD: Rejected because ...". Add a new line for each change; don't edit old ones. -->
