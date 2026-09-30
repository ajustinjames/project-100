# Candidate: Text Rebuild

<!-- Keep it short. Follow the workflow in docs/APP_ACCEPTANCE.md (steps 4 to 6). Link evidence, and only link pages you have opened and checked. -->

**Idea source:** Originator (`claude-opus-5-5`).

## Problem

Language teachers build lessons around a short text: a paragraph of French for Year 8, a dialogue for an ESL class. A standard way to make students work the text hard is reconstruction: put the jumbled pieces back in order, fill the gaps, separate words that have been run together, restore the text from first letters. Making each of those by hand for every text is slow, so teachers use a tool that generates the whole set from one pasted text.

The tool they use is Textivate, and it is paid:

- When it launched, a teacher-training blog described it as creating "instantly what a few years ago would have taken an experienced programmer hours to create", and it was free to register. ([Nik's QuickShout, 2012](https://quickshout.blogspot.com/2012/09/create-instant-interactive-text-based.html))
- Today its own site says a visitor can only "see some sample resources" ([textivate.com](https://www.textivate.com/)), and its blog says that without a subscription "you can access resources created by others, provided that you have the url". Creating a resource needs a subscription: £36 a year for Basic (20 stored resources), £72 for Premium, which is also the cheapest plan that can share resources with students, and £180 for a group of ten teachers. ([Why subscribe to textivate?](https://textivate.posthaven.com/why-subscribe-to-textivate))
- Teachers build their planning around it. One languages teacher writes "So much of my planning begins with this website", in a post titled "4 subscription sites for MFL teaching that are worth every penny". ([eclaireMFL](https://mflclassroommagic.com/2020/03/31/4-subscription-sites-for-mfl-teaching-that-are-worth-every-penny/))
- A long-running blog for French teachers calls it "a super time saver" that lets you adapt a text "precisely to the needs of your own class and instantly make it available on line for class or homework" ([frenchteacher.net blog, 2013](https://frenchteachernet.blogspot.com/2013/12/textivate-revisited.html)), and the same author writes that "Budgets are tighter and tighter and schools and languages departments are often seeking ways to make savings." ([2017](https://frenchteachernet.blogspot.com/2017/06/how-to-save-money-in-your-mfl-department.html))

## Audience

Teachers of modern foreign languages and of English as a second language, in schools and private tuition, who teach from short texts. They would use it for each new text, which for a classroom teacher is weekly or more. Their students open the exercises in class or for homework.

## Proposed solution

A browser app in two halves:

1. **Teacher: paste a text** (up to a few hundred words) and give it a title. Nothing else is needed.
2. **Get the set.** From that one text the app offers:
   - *Reorder:* the text cut into pieces (by paragraph, sentence, or a chosen number of tiles) to drag or key back into order.
   - *Gaps:* every nth word, or words the teacher clicks, blanked; type them in, or choose from a word bank.
   - *Split the words:* the text with its spaces removed; mark where each word ends.
   - *Initials:* each word shown as its first letter; type the word.
   - *Blank text:* every word hidden; guess words, and each correct guess fills in everywhere it occurs.
3. **Share by link.** The text travels in the link itself (in the part after `#`, which browsers don't send to the server). The student opens the link and picks an exercise. No account, no upload, nothing stored on a server.
4. **Feedback to the student** as they go: what is right, what is wrong, and a count of attempts. The teacher can project it and do it with the class.
5. **Print:** any exercise as a worksheet, with an answer sheet.
6. **Keep a list** of the teacher's texts in the browser, with export and import.

There is no class list, no student names, and no marks sent back to the teacher. A teacher who wants proof of homework asks for a screenshot of the finished screen.

It is language-neutral: it splits on spaces and punctuation, so it works for languages written with spaces between words, and says so.

## Existing alternatives

| Alternative | Link | Does well | Falls short for this audience |
|---|---|---|---|
| Worksheets made by hand in a word processor (the default) | | Free; exactly what the teacher wants. | Each exercise type is made separately by hand for each text. Not interactive. |
| Textivate | [textivate.com](https://www.textivate.com/), [pricing](https://textivate.posthaven.com/why-subscribe-to-textivate) | The model for this: dozens of activities from one pasted text, plus matching games, stored resources, and student tracking. | Creating anything needs a subscription (£36 a year), and sharing with students needs Premium (£72 a year). |
| TextActivities | [textactivities.com](https://www.textactivities.com/), [pricing](https://www.textactivities.com/pricing), [comparison](https://textactivities.posthaven.com/comparing-textactivities-and-textivate) | Textivate's successor from the same people, with classes and assignments. | Subscription only, priced by teachers and students, with a 7-day trial. It removed "public access without login". |
| LearnHip cloze creator | [learnhip.com](https://learnhip.com/cloze/create.php) | Free; paste a text, mark gaps, share a link without logging in. | One exercise type (gap-fill). Without a login the activity "may be deleted after one month". |
| Cloze Generator | [cloze-generator.app](https://www.cloze-generator.app/) | Free gap-fill by clicking words, with online answering. | Gap-fill only, and you sign in to save and share. |
| LearningApps | [learningapps.org](https://learningapps.org/createApp.php) | Free; many templates, including a cloze text and an ordering exercise. | Each exercise is authored separately from a template; the text is re-entered for each one. |
| ESL Lounge Storyboard | [esl-lounge.com](https://www.esl-lounge.com/student/storyboard.php) | Free blank-text reconstruction in the browser. | Six fixed texts; a teacher can't use their own. |

I opened the best free ones and checked them against the core job, "one text in, several reconstruction exercises out". I read each tool's creation page; I could not operate them interactively from this session. LearnHip and Cloze Generator both make a gap-fill from a pasted text and nothing else, and LearningApps offers separate templates, each authored on its own.

## What this does better

1. **The whole set from one paste, free.** Textivate and TextActivities do this only on subscription. Every free tool I found makes one exercise type per text. Here one pasted text gives five exercise types at once.
2. **The student needs only a link, and the exercise can't expire.** The text is carried in the link, so there is no account for the teacher, no login for the student, and no stored copy to be deleted after a month.

## Likely scope and shape

- Client-only static app. The teacher's list of texts is kept in `localStorage` under `p100:text-rebuild:` with a versioned format, plus export and import. A shared exercise is a link with the text compressed into the fragment, using the browser's built-in `CompressionStream`.
- Pure functions for the core: split a text into tokens, generate each exercise, and check an answer. These are easy to unit-test. The link format is versioned.
- Rough size: 2,500 to 4,000 lines including tests. No dependencies beyond the defaults, no Cloudflare services, no media assets.
- Privacy class: `local-only`. The teacher's texts stay in their browser and in the links they choose to share. Sharing through a link fragment is the private kind of sharing [PRIVACY_AND_DATA.md](../../docs/PRIVACY_AND_DATA.md#user-generated-content) allows.

## Screen results

- Useful and specific: pass. Language teachers, for every lesson text.
- Not already well solved: pass. The tool that does it well is paid; the free ones do one exercise type.
- Not a thin wrapper / generic generator: pass, with care. Gap-fill generators are common; the case rests on the full reconstruction set from one text and on link sharing, not on another gap-fill maker.
- Not justified by SEO, monetization, novelty alone, or use of AI: pass. No AI.
- Runs within baseline budget: pass. Static files only.
- No sensitive subject: pass.
- No accounts / personal data / UGC / external API (or approval requested): pass. No accounts, no student data; shared links are private, not published.
- Maintainable by a weaker model: pass. Tokenizing and a handful of small exercise generators.

## Risks

- **No marks come back to the teacher.** Textivate's paid tiers track students. Without a server this app can't, and some teachers will want that for homework.
- **Link length.** A text in a link is long. A few hundred words compresses to a link of a few thousand characters, which works in browsers but can be cut by some messaging tools. The app must show the limit and refuse texts that won't fit.
- **Whatever is pasted is shared.** A link carries the teacher's text to whoever has it. The app should say so where the link is made. A teacher could paste a copyrighted textbook passage; the app publishes nothing, and the link only goes where the teacher sends it.
- **Languages without spaces** (Chinese, Japanese, Thai) don't split into words this way. Out of scope, and stated.
- **Textivate could add a free tier.** If it does, re-run the screen.

## Open questions

- Should matching exercises (pairs of words and translations), which Textivate also has, be in the first version? Proposed: no. Keep to text reconstruction.
- Does user-pasted lesson text kept in the browser stay `local-only`? I think so: it is lesson material, not text "likely to contain personal details", and there is no field for names. The general question was raised in [#21](https://github.com/ajustinjames/project-100/issues/21) and closed without a ruling. **Question for the Critic:** if you judge this `personal-data`, say so and I'll escalate.

## Escalations needed

None. It runs in the browser, has no accounts, no server, no student data, and no public content. It touches no sensitive subject and uses no external API.

## Critique

<!-- Step 6: link the Critic's PR comment, then respond to every finding: what changed, or why it was dismissed. For each dismissed Critical or High finding, also link the Critic's explicit acceptance or the resolved disagreement outcome that permits advancing. -->

| Severity | Finding | Response |
|---|---|---|

## Decision

<!-- Step 6, one dated line: "YYYY-MM-DD: Selected for Labs because ..." or "YYYY-MM-DD: Rejected because ..." -->
