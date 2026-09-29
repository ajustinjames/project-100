# Retrospective: Size Sieve

Discarded from Labs on 2026-09-29, the day after it entered, by the Builder (design), Opus 5.5 (`claude-opus-5-5`). App #1.

## Why it was built

Multi-size knitting and crochet patterns print every size's number in each instruction ("cast on 80 (88, 96, 104) sts"). Knitters highlight their own size by hand and still misread. No free, automatic tool did this for any pattern on iPhone, iPad, or a computer: Rowtine is Android-only, TrixiStitches charges for it, InterTwined is iOS-only and uploads patterns to an LLM, and the Tin Can Knits app covers only its own patterns ([PROPOSAL.md](PROPOSAL.md)). The critique made the advantage narrow and checkable, so the app entered Labs with a feasibility gate first: could a deterministic parser resolve real patterns well enough?

## What was learned

- **The core idea works where the format is covered.** Across 619 annotated instruction sequences in 15 patterns (a 10-pattern main cohort and a 5-pattern untouched holdout), the parser never produced a wrong number in an instruction. Every "wrong substitution" the gate counted was a line in the finished-measurements block, replaced with the value that is correct for the chosen size, which the brief said to leave as written.
- **Format variety is the real problem, and it's worse in crochet.** The main cohort was 9 knit and 1 crochet. The holdout, with 3 crochet patterns, exposed shapes the rules had never seen: sequences written entirely in brackets with no leading number (`(58, 66, 74) (82, 90, 98)`), row numbers that are themselves size sequences (`Row (15, 17, 19) (21, 23, 25):`), sub-schemes for a subset of sizes (`94 (105)`), and `xx` placeholders. A rule set good enough for one cohort did not transfer.
- **Each fix round added formats, and each new cohort brought more.** Run 1 missed dashes inside brackets (Berroco, Yarnspirations) and size lists on the line after `SIZES:` (DROPS). The fix round covered those, and the main cohort's median went from 88% to 96% correct. The holdout then fell to 50% on formats nobody had written a rule for. Chasing designers one at a time is exactly the maintenance burden the proposal warned about.
- **Size-list detection is fragile, so the manual fallback matters.** Detection failed on most patterns in run 1 and still failed or miscounted on several after the fix round; on one pattern it found 10 sizes instead of 8. A reader would have had to lean on the "that's not right" path far more than the brief assumed.

## Usage and evidence considered

No users; the app never had a UI. The evidence is the gate: per-pattern results are in [APP.md](APP.md#feasibility-gate-results), with the method, cohorts, and every scoring decision recorded on the [build brief](https://github.com/ajustinjames/project-100/issues/20) before each measurement. Run 1 failed (9 wrong / 420, 2.14%, in 5 patterns). After one fix round, the main cohort still failed (6 wrong / 420, 1.43%) and the holdout failed its median (50% correct, against 80%).

## What worked

- **Pre-registering the gate, the cohort, and the fix-round rules** before looking. It made the result hard to argue with, including by me: after run 1, I proposed rescoring the size-block substitutions as harmless. The Reviewer (Sol) ruled that this moved the goalposts, I accepted, and the untouched holdout later showed that the format problem mattered more than the scoring question.
- **Independent review on every step.** Sol's two brief reviews found the personal-data question (escalated as [#21](https://github.com/ajustinjames/project-100/issues/21)), the need for a hand-annotated denominator, and a gate that could be tuned to its own test set. The PR reviews found real wrong-substitution paths in the parser and a harness alignment that could hide one.
- **Conservative parser design.** Leaving text alone or flagging, rather than guessing, is why there were no wrong numbers in instructions.
- **PDF extraction.** PDF.js with a same-origin worker, and Wasm and worker fetch off, worked under the site's strict CSP. Extraction was byte-identical in Chromium, WebKit, and Node for all six cohort PDFs.
- **Respecting pattern licences.** Patterns stayed local and were never committed; a holdout candidate whose terms forbid copying was dropped before annotation.

## What failed

- **Coverage.** The parser handled the formats in the brief well and little else. That is the gate failure.
- **My brief had an ambiguity.** `94 (105)` fits both "2+ plain numbers with the wrong count → flag" and "a single bracketed value → plain text". The parser chose plain text, so one holdout pattern's sub-schemes were missed instead of flagged. Fixing it would not have changed the verdict (the main cohort failed on its own), but a brief should state exactly one outcome per case.
- **My first scoring rule was wrong.** I left size-block lines out of the annotations, so the harness first counted their (correct) substitutions as non-size false positives. Annotating them explicitly (`inSizeBlock`) from the start would have avoided a confusing first result and a scoring dispute.
- **Two harness bugs reached a real run** (a Node `Buffer` passed to pdf.js, and a "lost" check that scanned from the start of the document). Running the harness on one real file before trusting a summary would have caught both.

## Maintenance burden

It would have been high. Every new designer format needs a rule, a test suite, and a review, and each rule risks wrong substitutions elsewhere. A weaker model maintaining a growing pile of format rules, where a mistake shows a knitter the wrong number, fails the [maintainability test](../../docs/PROJECT_CHARTER.md#maintainability-test).

## Reason for archive

Discarded from Labs (not archived; it was never live). The feasibility gate recorded in APP.md required a pass on both the main cohort and an untouched holdout, after at most one fix round. Neither passed: the main cohort's wrong-substitution rate was 1.43% (limit 1%), and the holdout's median pattern resolved 50% of its sequences (limit 80%).

## Reusable lessons

- Put the gate, its cohort, and any fix-round rules on record before measuring, and use an untouched holdout. It works, and it protects against the builder's own optimism.
- Annotate everything that is a size sequence, including blocks the tool should skip, and mark them; don't encode "should skip" by leaving them out.
- Make a cohort match the audience's real mix. Crochet patterns behaved very differently from knit ones, and a 9-to-1 knit cohort hid that.
- For parsers of human-written formats, measure coverage on a varied sample before building any UI. Here it cost a day, not a product.
- `codex exec` reviewers can't see their own model or effort, so the launching session should record the log header as the evidence. That rule belongs in docs/AI_ROLES.md, which is owner-gated.

## Should code or components remain shared?

No. Nothing was generalized into a shared package. If a future app needs in-browser PDF text extraction under the site CSP, the configuration is in the history of [#23](https://github.com/ajustinjames/project-100/pull/23) (`src/pdf/extract.ts`). The gate method (pre-registered cohort, hand annotation, ordered alignment, untouched holdout) is on the [build brief](https://github.com/ajustinjames/project-100/issues/20).
