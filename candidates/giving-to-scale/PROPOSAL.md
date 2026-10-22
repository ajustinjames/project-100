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

1. **The answer first, as numbers.** One large sentence: "The same share of your net worth is **$21**." The exact share of the fortune beneath it. The answer never depends on the drawing being visible.
2. **True scale, in support.** The fortune drawn as a long scrolling bar, with the gift as a slice in it at its real proportion, never widened to a minimum. Your equivalent is drawn alongside at the same proportion of your own figure. When the gift's slice is under a pixel, the page says so in words ("the gift is 1/20,000 of their fortune: to show it as one pixel, the bar would be 20,000 pixels long, about 25 phone screens"), and an optional "walk the fortune" control scrolls the whole length to the slice.
3. **The reverse.** "To give the same share as you giving $500, they would have to give $2.4B."
4. **Same percentage of your yearly income.** A second, explicitly labelled illustration for people whose net worth is zero or negative, where a share of it means nothing. It is worded as "the same percentage of your yearly income", never as an equal sacrifice, because a share of wealth and a share of income are different measures. Net worth stays the main comparison.
5. **Honest limits, briefly.** The page says that a fortune is an estimate and mostly not cash, that a pledge may be paid over years, and that it uses the figures you enter.
6. **Share.** A link that holds the gift and the fortune, never your own figure, so a friend opens the same comparison and enters their own.

There is no list of named people and no fortune figures shipped with the app. The user copies both numbers from the article they are reading.

**Design boundary (owner direction, 2026-10-22):** we don't borrow Sacrifice Meter's features. No everyday-price comparisons, no "fortune regrows it in", no count of gifts they could make, no per-day matching amount, and no cheque layout. The design is built around the scale drawing and the reverse view.

## Existing alternatives

| Alternative | Link | Does well | Tradeoffs for this audience |
|---|---|---|---|
| Doing the division by hand, or a newspaper doing it | [TheWrap on the Washington Post's sum](https://www.thewrap.com/jeff-bezos-charity-washington-post) | Free; a journalist chooses fair figures. | Only for the gifts a paper covers, at its median household, not your own money. |
| Sacrifice Meter (the strongest) | [sacrificemeter.com](https://sacrificemeter.com/) | Free, and good. Type any gift; a lookup of about 225 donors fills in a dated Forbes estimate, which you can edit; your net worth is typed in. Draws the gift to scale against the fortune, gives an everyday comparison ("a movie ticket"), how fast the fortune regrows it, and share buttons. I read its page source on 2026-10-22: no analytics or ad scripts, labelled inputs, and ARIA markup. | It draws the gift "at least 2px wide so it shows up at all", which inflates the smallest gifts. No income mode is mentioned, so a zero or negative net worth has no useful answer. Carries a promotional box for the consultancy that built it. Its donor list needs updating as fortunes change. |
| NoCharity | [nocharity.onrender.com](https://nocharity.onrender.com/) | Free; compares by monthly or yearly income in several currencies; credits the same post. | A fixed list of 17 billionaires ("Billionaire 1 of 17") with their recorded giving, picked with arrows; I saw no way to enter a new gift. Side-by-side cards with emoji, no scale drawing. |
| Zuckerberg Donation Equaliser (found by the Critic) | [sometool.ie](https://sometool.ie/zuckerberg-donation-equaliser/) | Free; salary and net-worth modes, and explains that salary mode compares with the giver's yearly gain in wealth. | One fixed gift (Mark Zuckerberg's €150,000 to three GAA clubs); no field to enter another gift or giver; no scale drawing. |
| GiveRate (found by the Critic) | [giverate.org](https://giverate.org/) | Free; works out your own giving rate (annual giving over income), and publishes giving shares with a "Same share of $50K" illustration. | A different job: rates and rankings, not your equivalent of a gift in the news. |

I read the visible text of Sacrifice Meter's and NoCharity's pages from their HTML on 2026-10-22; the quotes above are from that text. A search also listed Pennies To Them (penniestothem.com), but it didn't load for me or the Critic on 2026-10-22, so it is unverified.

## What this does better

Checked against Sacrifice Meter, the strongest:

1. **True scale with no inflation.** Sacrifice Meter says its "sliver is drawn at least 2px wide so it shows up at all". Here the gift's slice is drawn at its real proportion of a scrolling fortune, never widened. When it is under a pixel, the page says so in words and can scroll the whole fortune to it. Checkable: for a $10M gift from a $200B fortune, the drawn slice is 1/20,000 of the bar.
2. **Any gift, with an income illustration.** Of the tools I verified, Sacrifice Meter takes any gift but has no income comparison. NoCharity and the Zuckerberg Equaliser offer income, but only for gifts already on their list or one fixed gift. Checkable: entering any gift and a negative net worth gives a labelled "same percentage of your yearly income" figure instead of a negative or meaningless one.

Also: no donor list, so nothing goes out of date and no figures about named people are published by us; no ads, tracking, or promotion; works offline once loaded. Design quality is the owner's main aim but isn't checkable until a prototype exists.

## Likely scope and shape

- Client-only static page. Nothing stored; the user's own figure never leaves the page. The share link holds only the gift and the fortune.
- Pure, testable core: share, equivalent, reverse equivalent, scale and scroll lengths, and amount parsing ("100M", "$2.4 billion").
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

- Currency: settled after critique. All amounts are entered in one currency, chosen once for the whole page and labelled on every field; there is no conversion. Mixing currencies would give a wrong share.
- How long should the "walk the fortune" scroll be on a phone? Proposed: decide on the prototype; the numeric answer doesn't depend on it.

## Escalations needed

- `sensitive-subject`: close to political commentary (see the screen results). Requested from the owner before any building.

## Critique

<!-- Step 6: link the Critic's PR comment, copy its scores, then respond to every finding: what changed, or why it was dismissed. For each dismissed Critical finding, also link the Critic's explicit acceptance or the resolved disagreement outcome that permits advancing. If there was a revise round, give both sets of scores. -->

Round 1: [Critique by Critic (gpt-6-sol, effort high)](https://github.com/ajustinjames/project-100/pull/46#issuecomment-6339588372), recommending revise. Every finding is accepted; none is dismissed.

| Round | Usefulness | Advantage | Feasibility | Upkeep | Total |
|---|---|---|---|---|---|
| 1 | 3 | 2 | 4 | 4 | 13/20 |
| 2 (after revision) | 3 | 3 | 4 | 4 | 14/20 |

| Severity | Finding | Response |
|---|---|---|
| High | Applying a share of wealth to yearly income doesn't measure an equal sacrifice; the Zuckerberg Donation Equaliser already has salary and net-worth modes for one fixed gift. | Accepted. Net worth is now the main comparison. Income is a separately labelled "same percentage of your yearly income" illustration, never called an equal sacrifice. I opened the Equaliser: one fixed €150,000 gift, no other gift or giver can be entered, no scale drawing. It's added to the alternatives, and the advantage now claims income *for any gift*, not income alone. |
| Medium | Sacrifice Meter and NoCharity couldn't be loaded, so their claimed limitations are unverified. | Accepted, and rechecked. I fetched both pages' HTML on 2026-10-22 and read their visible text. Sacrifice Meter: "The sliver is drawn at least 2px wide so it shows up at all", about 225 Forbes-estimated donors, and no income comparison. NoCharity: "Billionaire 1 of 17" with arrows, income only. The proposal now says how this was checked. Pennies To Them stays unverified and is not relied on. |
| Medium | Add the missed alternatives (GiveRate, the Zuckerberg tool). | Accepted. Both are in the table. I opened GiveRate: it calculates your own giving rate and publishes rankings, a different job. |
| Low | An honest slice will often be invisible; give a readable numeric and text result and make the long scroll optional. | Accepted. The numeric answer leads and never depends on the drawing. A sub-pixel slice is described in words, and "walk the fortune" is optional. |

The owner also set a design boundary after round 1: none of Sacrifice Meter's features (see Proposed solution). That removed the everyday-price comparison.

Round 2: [Re-score by Critic (gpt-6-sol, effort high)](https://github.com/ajustinjames/project-100/pull/46#issuecomment-6339658011), recommending advance. It found the High, the second Medium, and the Low resolved. It marked the first Medium partly resolved, because neither page opened for the Critic; that stays a verification limit, and the case doesn't rest on it alone. It raised two new findings:

| Severity | Finding | Response |
|---|---|---|
| Medium | Gift and fortune must be entered in the same currency; a selectable symbol alone would allow a wrong share. | Accepted. One currency for the whole page, labelled on every field, no conversion (Open questions). |
| Low | Headline "that's like giving $21" is less precise than the explanation. | Accepted. The headline is now "The same share of your net worth is $21". |

Neither change alters the audience, scope, track, or claimed advantage, so no further re-score is needed.

## Decision

<!-- Step 6, dated lines; the latest one is the candidate's state (docs/APP_ACCEPTANCE.md#6-select-or-reject): "YYYY-MM-DD: Selected for Labs because ...", "YYYY-MM-DD: Blocked: awaiting <approval kind> (<link>)", "YYYY-MM-DD: Benched: ranked below the cut (total N/20)", or "YYYY-MM-DD: Rejected because ...". Add a new line for each change; don't edit old ones. -->

2026-10-22: Selected for Labs because it scored 14/20 after the revise round with no Critical finding, it is the only eligible candidate (no benched candidates are waiting), and the critique shaped it: net worth leads, income is a labelled illustration, the numeric answer never depends on the drawing, and one currency per page.

2026-10-22: Blocked: awaiting sensitive-subject ([#47](https://github.com/ajustinjames/project-100/issues/47))
