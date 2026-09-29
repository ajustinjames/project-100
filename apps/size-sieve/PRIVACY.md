# Privacy: Size Sieve

<!-- Must be accurate at all times. Update in the same change that alters data behavior. See docs/PRIVACY_AND_DATA.md. -->

**Classification:** `local-only` (must match `privacy` in app.json)

**Current state:** the app contains a PDF text extraction module, but no UI calls it yet. The app does not currently accept pattern text, store user content, or send anything beyond requests for its own static files. The feasibility harness runs locally in Node and is not part of the deployed app.

## What data the app handles

- No user content is handled by the current UI.
- When the extractor is called by a future reader, it reads the selected PDF bytes in the browser and returns plain text; that module does not save or transmit the PDF.
- The planned reader will also handle pasted text and a chosen size.

## Where data is stored

The current app does not persist user content. The planned reader and storage will keep saved patterns and the chosen size in browser IndexedDB under the p100:size-sieve: prefix. PDFs will be read in the browser and will not be stored as files by the app.

## What leaves the device

- Requests for the app's own static files.
- On live deployments: the project-wide Cloudflare Web Analytics beacon (no cookies, no cross-site tracking). See docs/PRIVACY_AND_DATA.md. Labs pages get no beacon.
- Pattern content never leaves the device.

## Third parties

- Cloudflare (hosting and privacy-preserving analytics).
- The PDF library (pdfjs-dist) is an app dependency used by the extractor, but the current UI does not load it. When called, it processes the provided PDF bytes locally and makes no third-party network requests.

## Retention and deletion

The current app keeps no user content. When browser storage is implemented, saved patterns will stay in your browser until you delete them in the app or clear the site's data. Nothing will be kept anywhere else.
