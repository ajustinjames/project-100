# Privacy: Giving to Scale

<!-- Must be accurate at all times. Update in the same change that alters data behavior. See docs/PRIVACY_AND_DATA.md. -->

**Classification:** `none` (must match `privacy` in app.json)

## What data the app handles

Three amounts the user types: a gift, the giver's fortune, and the user's own net worth or yearly income. An optional fourth, "If I gave", for the reverse comparison. The currency choice. All arithmetic happens in the browser.

## Where data is stored

Nowhere. Nothing you enter is saved. Your own figure stays on this page in memory while you use it.

## What leaves the device

- Requests for the app's own static files.
- On live deployments: the project-wide Cloudflare Web Analytics beacon (no cookies, no cross-site tracking). See docs/PRIVACY_AND_DATA.md.
- Only if the user presses "Share this gift": a link is handed to the device's share sheet, or copied to the clipboard. The link carries the gift, the fortune, and the currency in the URL fragment (`#v=1&gift=…&fortune=…&cur=…`), never the user's own figure or the "If I gave" amount. Browsers don't send the fragment in requests. Opening the page never writes to the fragment.
- Before launch, the live Cloudflare beacon's payload on a shared link must be captured, and this file must state whether it includes the fragment. Even if it did, the fragment holds no personal data.

## Third parties

- Cloudflare (hosting and privacy-preserving analytics).
- Whatever app or person the user chooses to share a link with.

## Retention and deletion

Not applicable: nothing is retained.
