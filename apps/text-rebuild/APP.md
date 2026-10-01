# Text Rebuild

<!-- Keep this document current. It is the product and architecture record for this app. -->

## Problem

Language teachers make students work a short text hard with reconstruction exercises: put the pieces back in order, fill the gaps, split run-together words, restore the text from first letters. The tool that makes the whole set from one pasted text, Textivate, needs a subscription to create anything (£36 a year) and Premium to share with students (£72), and its successor is subscription-only ([Textivate](https://textivate.posthaven.com/why-subscribe-to-textivate)). The free tools each make one exercise type. Full evidence in [PROPOSAL.md](PROPOSAL.md#problem).

## Audience

Teachers of French, Spanish, German, Italian, and English as a second language who don't have a Textivate subscription: private tutors, ESL teachers outside UK schools, teachers whose department doesn't pay for it, trainee teachers. They would use it for each new lesson text. Their students open the exercises from a link.

## Scope

**In scope:**

- Paste a text (up to a few hundred words) and get reconstruction exercises from it: reorder, gaps, split the words, initials, blank text. Which of these the first version needs is decided by the preregistered lesson tasks (see Product decisions).
- Share an exercise set as a link that carries the text; students work it with feedback, no login.
- Print any exercise with an answer sheet; keyboard-operable throughout.
- Keep a list of the teacher's texts in the browser, with export and import.

**Explicitly out of scope:**

- Accounts, class lists, student names, marks sent back to the teacher.
- Matching games (word and translation pairs).
- Languages written without spaces between words.
- Any server storage, AI, or analytics.

## Alternatives researched

Full comparison in [PROPOSAL.md](PROPOSAL.md#existing-alternatives). In short:

- **Textivate** and **TextActivities**: the full set from one text, but subscription only.
- **LearnHip** and **Cloze Generator**: free gap-fill from a pasted text; one exercise type.
- **Free Classroom Tools**: free single transformations, each a separate tool.
- **LearningApps**: free templates, each exercise authored separately.
- **TeachVid**: reconstruction tied to video, five free resources. **Cloze Wizard**: Mac-only worksheets.

## Product decisions

- 2026-10-01: Entered Labs as app #3. Selected after two critique rounds and an arbitration ([candidate PR #31](https://github.com/ajustinjames/project-100/pull/31), [round 1](https://github.com/ajustinjames/project-100/pull/31#issuecomment-5932932843), [round 2](https://github.com/ajustinjames/project-100/pull/31#issuecomment-5933023119), [arbitration](https://github.com/ajustinjames/project-100/pull/31#issuecomment-5933107159)) because teachers without a subscription have no free tool that makes a set of reconstruction exercises from one text and shares it by link. No escalations apply.
- 2026-10-01: Untested hypotheses, recorded as the arbitration requires: that teachers without a subscription would adopt this, and which mix of activities they want.
- 2026-10-01: Feasibility gate, put on the build brief before implementation. Preregister representative lesson tasks drawn from teacher accounts, and let them decide the activities needed. Correctness: on at least ten real texts (two each in French, Spanish, German, Italian, and ESL) and an untouched holdout of five, every word splits correctly (elisions, hyphens, apostrophes, numbers), every exercise accepts every right answer and rejects wrong ones, links open identically in Chromium and WebKit and stay under the length limit, every exercise works by keyboard alone and prints legibly. Time: a positive time saving against the strongest suitable free workflow giving an equivalent result, and at most two minutes to make and share. One fix round, then the holdout. Discard on failure.
- 2026-10-01: `analytics` is `none`, because a shared link carries the teacher's text and a beacon could report the URL.

## Architecture

Planned, to be settled in the build brief: a client-only static app. Pure functions tokenize a text per language rules, generate each exercise, and check answers. A shared exercise is a versioned link with the text compressed into the fragment with the browser's `CompressionStream`. The teacher's texts are in `localStorage` under `p100:text-rebuild:`, versioned. Print CSS for worksheets. No Cloudflare services.

## Dependencies

<!-- Each third-party dependency and why a small amount of our own code would not do. See docs/DEPENDENCIES.md. -->

None beyond ajj-design (`hardline`).

## Shared packages

- `@project-100/web` — head metadata, disclosure footer.

## Assets and licenses

<!-- Every third-party font, icon set, image, or sound: source, license, and where it is used. AI must not generate media. -->

None.

## Tradeoffs and known limitations

- No marks come back to the teacher; there is no server.
- A link carries the whole text to whoever has it, and can't be revoked.
- Long texts make long links, which some messaging tools may cut; the app refuses texts that won't fit.

## Launch packet

<!-- Filled in before requesting launch approval. See docs/APP_ACCEPTANCE.md#launch-packet. -->
