# Privacy: Text Rebuild

<!-- Must be accurate at all times. Update in the same change that alters data behavior. See docs/PRIVACY_AND_DATA.md. -->

**Classification:** `local-only` (must match `privacy` in app.json)

**Current state:** the app is still the Labs template scaffold. It doesn't yet read, store, or send anything beyond requests for its own static files. The sections below describe the designed behavior. The PR that implements texts, links, or storage must update this file if the behavior differs.

## What data the app handles

- Texts a teacher pastes in, with a title.
- Students' answers while they work an exercise, kept in the page only.
- No personal data is asked for: no names, class lists, emails, accounts, or marks.

## Where data is stored

- The teacher's list of texts is kept in their browser, in `localStorage` under the `p100:text-rebuild:` prefix, and can be exported to a file on their own device and imported back.
- A shared exercise is a link with the text compressed into the part after `#`. Browsers don't send that part to the server, so it isn't stored anywhere by us.
- Students' answers are not saved.

## What leaves the device

- Requests for the app's own static files. The part of a link after `#` is not sent with them.
- No analytics: `analytics` is `none`, so no beacon is sent even when live, because a shared link carries the teacher's text.
- **A shared link contains the whole text.** Anyone the teacher sends it to, and any messaging app or learning platform it is posted in, can read the text. The app says so where the link is made.

## Third parties

- Cloudflare (hosting only).

## Retention and deletion

Saved texts stay in the teacher's browser until they delete them in the app or clear the site's data. A link lasts as long as someone keeps it; it can't be revoked, because nothing is stored on a server.
