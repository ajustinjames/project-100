# Candidate: Giving to Scale

<!-- Keep it short. Follow the workflow in docs/APP_ACCEPTANCE.md (steps 4 to 6). Link evidence, and only link pages you have opened and checked. -->

**Idea source:** Owner, 2026-10-22. This is an owner-made exception to [idea ownership](../../docs/PROJECT_CHARTER.md#idea-ownership): the owner shared a Threads post by comedian Gianmarco Soresi ("There should be some kind of calculator where whenever a billionaire donates some amount of money, you can quickly [see] what percentage that is of their net worth, apply it to your own net worth and see how much of a sacrifice it actually is") and asked for a beautifully designed version that shows the scale of the difference. It went through no screen; it goes through critique and selection like any candidate. Not tagged typical or unusual.

**Track:** utility.

## Problem

When the news reports that a very rich person gave $100 million, the figure is hard to judge. What it means depends on the share of their fortune, and turning that into something you can feel means dividing by hand and applying the share to your own money. Newspapers do this sum for readers: the Washington Post worked out that Jeff Bezos's 2020 gifts were [the equivalent of $85 for the median American](https://www.thewrap.com/jeff-bezos-charity-washington-post). The size of a fortune is also hard to picture, so even the right number doesn't convey the gap.

The task recurs whenever a large gift is in the news, which is often. The idea has also been built several times since the post (see alternatives), which shows people want it.

## Audience

People who read about a large donation and want to know what it amounts to: news readers, and people discussing a gift online who want a figure to share. They come back each time a gift is in the news. This is a modest audience with an occasional task, not a daily tool.

## Proposed solution

One page, three numbers, typed by the user: the gift, the giver's fortune, and your own net worth or, in income mode, your yearly income.

1. **The answer first.** One large sentence: "For you, that's like giving **$21**." The percentage beneath it, and an everyday comparison ("about a takeaway lunch").
2. **True scale.** The fortune drawn as a long scrolling bar, with the gift as a slice in it at its real proportion, with no minimum width that inflates small gifts. Your equivalent is drawn alongside. When a slice would be under a pixel, the page says so and shows how far you would scroll to see one pixel of gift, rather than drawing it bigger.
3. **The reverse.** "To give the same share as you giving $500, they would have to give $2.4B."
4. **Income mode.** Many people's net worth is zero or negative, which makes a share of it meaningless. Comparing with yearly income still works. The page says plainly that a fortune is an estimate and mostly not cash, that a pledge may be paid over years, and that it uses the figures you enter.
5. **Share.** A link that holds the gift and the fortune, never your own figure, so a friend opens the same comparison and enters their own.

There is no list of named people and no fortune figures shipped with the app. The user copies both numbers from the article they are reading.

## Existing alternatives

| Alternative | Link | Does well | Tradeoffs for this audience |
|---|---|---|---|
| Doing the division by hand, or a newspaper doing it | [TheWrap on the Washington Post's sum](https://www.thewrap.com/jeff-bezos-charity-washington-post) | Free; a journalist chooses fair figures. | Only for the gifts a paper covers, at its median household, not your own money. |
| Sacrifice Meter (the strongest) | [sacrificemeter.com](https://sacrificemeter.com/) | Free, and good. Type any gift; a lookup of about 225 donors fills in a dated Forbes estimate, which you can edit; your net worth is typed in. Draws the gift to scale against the fortune, gives an everyday comparison ("a movie ticket"), how fast the fortune regrows it, and share buttons. I read its page source on 2026-10-22: no analytics or ad scripts, labelled inputs, and ARIA markup. | It draws the gift "at least 2px wide so it shows up at all", which inflates the smallest gifts. No income mode is mentioned, so a zero or negative net worth has no useful answer. Carries a promotional box for the consultancy that built it. Its donor list needs updating as fortunes change. |
| NoCharity | [nocharity.onrender.com](https://nocharity.onrender.com/) | Free; compares by monthly or yearly income in several currencies; credits the same post. | A fixed list of 17 billionaires with their recorded giving, picked with arrows; I saw no way to enter a new gift. Side-by-side cards with emoji, no scale drawing. |

A search also listed Pennies To Them (penniestothem.com), which works the same way, but it didn't load for me on 2026-10-22, so I haven't verified it.

## What this does better

Checked against Sacrifice Meter, the strongest:

1. **True scale with no inflation.** The gift's slice is drawn at its real proportion of a scrolling fortune, never widened to a minimum; when it is under a pixel, the page says how much scrolling one pixel of gift takes. Checkable: for a $10M gift from a $200B fortune, the drawn slice is 1/20,000 of the bar.
2. **Income mode.** A useful answer for someone whose net worth is zero or negative, which Sacrifice Meter doesn't offer. Checkable: entering a negative net worth prompts the income comparison instead of a negative or nonsensical figure.

Also: no donor list, so nothing goes out of date and no figures about named people are published by us; no ads, tracking, or promotion; works offline once loaded. Design quality is the owner's main aim but isn't checkable until a prototype exists.

## Likely scope and shape

- Client-only static page. Nothing stored; the user's own figure never leaves the page. The share link holds only the gift and the fortune.
- Pure, testable core: share, equivalent, reverse equivalent, scale and scroll lengths, amount parsing ("100M", "$2.4 billion"), and the everyday comparison table.
- Rough size: 800 to 1,500 lines including tests. No dependencies beyond the defaults, no Cloudflare services. All drawing in HTML and CSS; no images or artwork.
- Privacy class: `none`.

## Screen results

- Useful task, used more than once: yes, whenever a large gift is in the news; occasional rather than frequent.
- Value comes from the software itself, not an API or AI model: yes, arithmetic and drawing.
- Not for search traffic, ads, novelty alone, or use of AI: yes. The case is the scale drawing and income mode, not traffic.
- No ongoing human curation or moderation: yes, because there is no donor list. A list would need curation and is out of scope.
- Runs within baseline budget: yes, a static page.
- No sensitive subject: **close to one.** The arithmetic is user-driven with no recommendation, which the charter says is not sensitive. But an app about billionaires' giving, framed as "how much of a sacrifice it actually is", is close to political commentary. So I'm escalating rather than arguing it doesn't apply.
- No accounts / personal data / UGC / external API (or approval requested): yes. The user's own figure is typed in and never stored or sent.

## Risks

- **Sacrifice Meter is already good.** The advantage is real but narrow; this may come down to execution and design.
- **It can read as a political statement.** The wording must stay factual: shares and equivalents, no judgement of anyone. The user supplies all figures.
- **Net worth is a poor measure of what someone can give.** Fortunes are estimates, mostly not cash, and gifts may be pledges paid over years. The page has to say this without burying the result.
- **Occasional use.** People will use it when a gift is in the news, not weekly.

## Open questions

- Currency: is one currency (no conversion) enough for the prototype? Proposed: yes; the arithmetic doesn't depend on the currency, and the symbol can be chosen.
- Which everyday comparisons, and from what source for their prices? Proposed: a short table of round, clearly approximate amounts, stated as approximate.

## Escalations needed

- `sensitive-subject`: close to political commentary (see the screen results). Requested from the owner before any building.

## Critique

<!-- Step 6: link the Critic's PR comment, copy its scores, then respond to every finding: what changed, or why it was dismissed. For each dismissed Critical finding, also link the Critic's explicit acceptance or the resolved disagreement outcome that permits advancing. If there was a revise round, give both sets of scores. -->

| Usefulness | Advantage | Feasibility | Upkeep | Total |
|---|---|---|---|---|
| | | | | /20 |

| Severity | Finding | Response |
|---|---|---|

## Decision

<!-- Step 6, dated lines; the latest one is the candidate's state (docs/APP_ACCEPTANCE.md#6-select-or-reject): "YYYY-MM-DD: Selected for Labs because ...", "YYYY-MM-DD: Blocked: awaiting <approval kind> (<link>)", "YYYY-MM-DD: Benched: ranked below the cut (total N/20)", or "YYYY-MM-DD: Rejected because ...". Add a new line for each change; don't edit old ones. -->
