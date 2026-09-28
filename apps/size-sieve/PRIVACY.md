# Privacy: Size Sieve

<!-- Must be accurate at all times. Update in the same change that alters data behavior. See docs/PRIVACY_AND_DATA.md. -->

**Classification:** `local-only` (must match `privacy` in app.json)

**Current state:** the app is still the Labs template scaffold. It doesn't yet read, store, or send anything beyond requests for its own static files. The sections below describe the designed behavior. The PR that implements pattern opening or storage must update this file if the behavior differs.

## What data the app handles

- The text of a pattern you open (a PDF on your device) or paste.
- The size you choose, and the resolved pattern.
- No personal data: no name, email, account, or location.

## Where data is stored

Only in your browser. Saved patterns and the chosen size go in IndexedDB under the `p100:size-sieve:` prefix. PDFs are read in the browser and aren't stored as files by the app. You can export saved patterns to a JSON file on your own device, and import them back.

## What leaves the device

- Requests for the app's own static files.
- On live deployments: the project-wide Cloudflare Web Analytics beacon (no cookies, no cross-site tracking). See docs/PRIVACY_AND_DATA.md. Labs pages get no beacon.
- Pattern content never leaves the device.

## Third parties

- Cloudflare (hosting and privacy-preserving analytics).
- The planned PDF library (`pdfjs-dist`) is bundled with the app and makes no network requests to third parties.

## Retention and deletion

Saved patterns stay in your browser until you delete them in the app or clear the site's data in your browser. Nothing is kept anywhere else.
