# Candidate: Deck Listening

<!-- Keep it short. Follow the workflow in docs/APP_ACCEPTANCE.md (steps 4 to 6). Link evidence, and only link pages you have opened and checked. -->

**Idea source:** Idea generator (`gpt-6-astra`, effort `medium`).

## Problem

Many language learners keep audio in their Anki flashcards: a recorded word, an example sentence. They want to hear those recordings again away from the screen, on a walk or a commute, as extra listening. Anki plays a card's audio only inside a review, where each card has to be flipped and graded, and doing that changes the review schedule.

Evidence that people keep asking, and that the workarounds are poor:

- A 2025 request on the Anki forum asks for audio from a deck's cards to play in sequence "like a playlist" for commutes and exercise, without affecting scheduling. The answers are a fiddly auto-advance set-up that buries cards, with the warning that "there are some bugs with this feature, so this method might not work", and an add-on of which the answer says "Currently, the add-on only works on Windows". ([Anki Forums, 2025](https://forums.ankiweb.net/t/play-card-audio-in-sequence-like-a-playlist/66189))
- A 2021 request asks for "passive play" that doesn't affect review times: "Anki is great for focused learning but doesn't have the same amount of usefulness for passive learning." ([Anki Forums, 2021](https://forums.ankiweb.net/t/suggestion-for-feature-automatically-play-deck-for-passive-learning-passive-play/10540))
- In 2024 a user found that the "Export deck to audio" add-on produced only silent files. The reply confirms it "appears to have been broken for a while" and offers a PowerShell and ffmpeg script instead. ([Anki Forums, 2024](https://forums.ankiweb.net/t/is-export-deck-to-audio-still-usable/43262))
- An older add-on that exports cards to audio files needs ffmpeg installed and manual installation from source. ([anki-handsfree](https://github.com/angel333/anki-handsfree))
- A third-party write-up states the gap plainly: Anki "has no audio-only mode, no background playback". ([Kotoba](https://kotobaapp.com/anki-while-driving))

## Audience

Language learners who use Anki decks with audio on the cards, whether decks they made or shared decks they downloaded. They would come back whenever they want a listening session, which for someone studying daily is most days, and re-export when their deck has grown.

## Proposed solution

A browser app that reads a file the learner already has:

1. **Open a deck export.** In Anki, export the deck as an `.apkg` file with media, and open it here. It is read in the browser and never uploaded.
2. **Choose what to hear.** The app lists the deck's note types and their fields, and shows which fields contain audio. The learner picks the fields and their order, for example "word, then sentence".
3. **Shape the session.** Order (deck order, shuffled, or newest first), how many cards, a pause between clips and between cards, how many times each clip repeats, and an optional filter by tag.
4. **Listen.** Play, pause, skip, and back, with the card's text on screen for a glance. It uses the browser's media controls, so headphone buttons and the lock screen work where the browser supports that.
5. **Keep it.** The opened deck's audio and the session settings are saved in the browser, so tomorrow's session doesn't need the file again. Delete a deck at any time.

It never writes to Anki, never changes scheduling, and generates no speech: cards without recorded audio are skipped and counted.

## Existing alternatives

| Alternative | Link | Does well | Falls short for this audience |
|---|---|---|---|
| Reviewing in Anki with auto-advance (the default) | [Anki Forums, 2025](https://forums.ankiweb.net/t/play-card-audio-in-sequence-like-a-playlist/66189) | Built in; no export. | It is a review: it needs a set-up that buries cards, the forum answer warns it is buggy, and it interacts with scheduling. |
| "Export Card to Audio" add-on | [AnkiWeb](https://ankiweb.net/shared/info/1117983796), [forum answer](https://forums.ankiweb.net/t/play-card-audio-in-sequence-like-a-playlist/66189) | Turns notes into an MP3, with text-to-speech where a field has no audio. | Windows only, per the forum answer. Desktop Anki only. A new export for each session. |
| "Export deck to audio" add-on | [Anki Forums, 2024](https://forums.ankiweb.net/t/is-export-deck-to-audio-still-usable/43262) | Did this job some years ago. | Reported broken: silent output. |
| anki-handsfree add-on | [GitHub](https://github.com/angel333/anki-handsfree) | Exports question and answer audio with a configurable delay, on Windows, Mac, and Linux. | Needs ffmpeg and manual installation from source; four commits and no releases. |
| Kotoba | [kotobaapp.com](https://kotobaapp.com/anki-while-driving) | Free, audio-only, spoken answers. | Its own Japanese vocabulary only. It doesn't play the learner's deck. |

I could not open the AnkiWeb add-on page's text in this session, so the Windows-only limit is quoted from the forum answer. I did not run the add-ons.

## What this does better

1. **It works where the add-ons don't.** Add-ons run only in desktop Anki, and the working one is Windows-only. This runs in a browser, so a learner on a Mac, Linux, a Chromebook, or a phone can use it with an exported file.
2. **Listening is a playlist, not a review.** It plays chosen audio fields with chosen pauses and repeats, and can't alter scheduling, because it only reads an export. The built-in workaround is a modified review.

## Likely scope and shape

- Client-only static app. The deck's audio and the settings are stored in IndexedDB under `p100:deck-listening:` with a versioned format.
- Reading an `.apkg` means: unzip the package; decompress the collection, which current Anki compresses with Zstandard; read it as an SQLite database; and read the media list. Older-format exports ("Support older Anki versions") skip the Zstandard step. ([format description](https://eikowagenknecht.com/posts/understanding-the-anki-apkg-format/))
- Likely runtime dependencies, each for a genuinely hard format, to be chosen in the build brief: an SQLite reader (`sql.js`, MIT), a Zstandard decoder (`fzstd`, MIT), and possibly a zip reader (`fflate`, MIT). Size Sieve ran pdf.js under this site's content security policy only with WebAssembly off ([RETRO](../../apps/size-sieve/RETRO.md)), and `sql.js` is normally WebAssembly, so this needs checking first.
- Pure, testable core: extracting `[sound:...]` references from note fields, building a playlist from settings. Fixtures are tiny decks made for the tests.
- Rough size: 2,500 to 3,500 lines including tests. No Cloudflare services, no media assets.
- Privacy class: `local-only`. The deck stays in the browser. Nothing is uploaded.

**Labs feasibility gate.** This is a format-reading app, so the first build task is a measurement, before any player UI, with the criteria written on the build brief first ([APP_ACCEPTANCE.md](../../docs/APP_ACCEPTANCE.md#measuring-a-feasibility-gate)). Discard unless all of these hold:

- An `.apkg` exported from the current Anki release in its default (new) format, and one in the older format, both open in the browser under the site's content security policy, in Chromium and WebKit.
- For at least five freely shared audio decks from different authors, plus one deck made by hand as ground truth, the clips found per note match a count made independently from the deck's database.
- A deck with 2,000 audio clips opens on a mid-range phone without running out of memory.

## Screen results

- Useful and specific: pass. Anki users with audio decks, for regular listening sessions.
- Not already well solved: pass. The built-in route is a buggy review workaround; the add-ons are broken, Windows-only, or need ffmpeg.
- Not a thin wrapper / generic generator: pass. It reads a file format and plays what is in it.
- Not justified by SEO, monetization, novelty alone, or use of AI: pass. No AI, no generated speech.
- Runs within baseline budget: pass. Static files only.
- No sensitive subject: pass.
- No accounts / personal data / UGC / external API (or approval requested): pass. It reads the learner's own deck locally.
- Maintainable by a weaker model: pass if the feasibility gate passes. The format handling is the risk.

## Risks

- **The export step.** The learner must export the deck from Anki and open the file here, and repeat that to pick up new cards. That friction may be enough to put people off. It is the price of not needing an add-on.
- **Anki's format changes.** The package format changed in 2022 and may change again. The app depends on reading it, and a change would need a maintenance fix.
- **Dependencies and the content security policy.** See scope. If SQLite can't run under the site's policy without WebAssembly, the app needs an owner decision on the policy or is discarded.
- **Storage limits.** A deck's audio can be hundreds of megabytes. Browsers may refuse or evict it. The app must show the size and handle refusal.
- **Background playback on phones** is limited in browsers, especially on iOS. If audio stops when the screen locks, the main use (listening while walking) is weakened. Test early.
- **Shared decks are often copyrighted.** The app plays the learner's own copy locally and has no sharing.

## Open questions

- Should it also export the session as a single audio file? Proposed: no; that needs audio encoding and is what the add-ons attempt.
- Should it read Anki's card templates to find "front" and "back"? Proposed: no; let the learner pick fields, which is simpler and clearer.

## Escalations needed

None. It reads the user's own file in the browser, stores it locally, has no accounts, and sends nothing. A deck's cards are study material; the app has no fields that ask for personal details. It touches no sensitive subject and uses no external API.

## Critique

<!-- Step 6: link the Critic's PR comment, then respond to every finding: what changed, or why it was dismissed. For each dismissed Critical or High finding, also link the Critic's explicit acceptance or the resolved disagreement outcome that permits advancing. -->

| Severity | Finding | Response |
|---|---|---|

## Decision

<!-- Step 6, one dated line: "YYYY-MM-DD: Selected for Labs because ..." or "YYYY-MM-DD: Rejected because ..." -->
