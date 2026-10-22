# Privacy: Giving to Scale

<!-- Must be accurate at all times. Update in the same change that alters data behavior. See docs/PRIVACY_AND_DATA.md. -->

**Classification:** `none` (must match `privacy` in app.json)

## What data the app handles

Three amounts the user types: a gift, the giver's fortune, and the user's own net worth. All arithmetic happens in the browser.

## Where data is stored

Nowhere. Nothing you enter is saved. Your own figure stays on this page in memory while you use it.

## What leaves the device

- Requests for the app's own static files.
- On live deployments: the project-wide Cloudflare Web Analytics beacon (no cookies, no cross-site tracking). See docs/PRIVACY_AND_DATA.md.
- This prototype does not create share links. A planned share link will carry the gift, the fortune, and the currency, never the user's own figure.

## Third parties

- Cloudflare (hosting and privacy-preserving analytics).

## Retention and deletion

Not applicable: nothing is retained.
