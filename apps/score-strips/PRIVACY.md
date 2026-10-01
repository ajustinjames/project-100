# Privacy: Score Strips

<!-- Must be accurate at all times. Update in the same change that alters data behavior. See docs/PRIVACY_AND_DATA.md. -->

**Classification:** `local-only` (must match `privacy` in app.json)

**Current state:** the app is still the Labs template scaffold. It doesn't yet read, store, or send anything beyond requests for its own static files. The sections below describe the designed behavior. The PR that implements opening or saving scores must update this file if the behavior differs.

## What data the app handles

- Sheet music you open: a PDF, or photos or scans of pages, from your own device.
- The strips you mark on each page, the reading order, and the place you reached.
- Display preferences (contrast, magnification).
- No personal data is asked for: no name, email, account, or location. A purchased PDF may have the buyer's name printed on it; the app doesn't read or use it, and stores it only as part of the file you opened (`local-only` under the owner's ruling on [#21](https://github.com/ajustinjames/project-100/issues/21)).

## Where data is stored

Only in your browser. Saved pieces (the file, its strips, and your place) go in IndexedDB under the `p100:score-strips:` prefix, and preferences in `localStorage` under the same prefix. You can export a piece's strip layout to a file on your own device and import it back.

## What leaves the device

- Requests for the app's own static files.
- On live deployments: the project-wide Cloudflare Web Analytics beacon (no cookies, no cross-site tracking). See docs/PRIVACY_AND_DATA.md. Labs pages get no beacon.
- Scores never leave the device. There is no upload and no sharing.

## Third parties

- Cloudflare (hosting and privacy-preserving analytics).
- The planned PDF library (`pdfjs-dist`) is bundled with the app and makes no network requests to third parties.

## Retention and deletion

Saved pieces stay in your browser until you delete them in the app or clear the site's data in your browser. The browser may also clear them if the device runs short of storage. Nothing is kept anywhere else.
