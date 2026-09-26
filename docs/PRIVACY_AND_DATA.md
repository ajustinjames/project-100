# Privacy and Data

Default posture: **collect nothing, keep user data on the user's device, and say exactly what happens.**

## Data classification

Every app declares one class in `app.json` (`privacy`) and explains it in `PRIVACY.md`.

| Class | Meaning | Approval |
|---|---|---|
| `none` | The app stores and sends nothing about the user beyond requests for static files and standard analytics. | no |
| `local-only` | User data is stored only in the browser (`localStorage`, IndexedDB, or files the user opens and saves). | no |
| `server-anonymous` | Some data reaches our servers (a Worker) but it isn't personal and can't identify anyone. | no, but document it carefully |
| `personal-data` | Anything that is or could identify a person: email, name, account, IP-linked records, precise location, free text likely to contain personal details. | **yes** (`personal-data`) |

When unsure between two classes, pick the stricter one.

## Personal data

Any personal-data handling must be necessary, minimized, documented, securely designed, and **approved by the owner before implementation**. The approval request must state what is collected, why, where it is stored, who can access it, how long it is kept, and how users delete it.

## Accounts

Accounts are discouraged, not prohibited. They need `accounts` approval and substantial product value that local storage, export/import files, or shareable URLs can't deliver. Prefer those alternatives.

## User-generated content

Public user-generated content is prohibited by default: forums, comments, public uploads, social feeds, community boards, or anything else needing moderation or abuse handling. It needs `user-generated-content` approval.

Sharing that stays private is fine without approval, for example encoding a user's own data in a URL fragment they choose to share.

## Analytics and telemetry

- **Standard:** Cloudflare Web Analytics on live apps (`"analytics": "standard"`). It is cookieless, aggregate, and privacy-preserving. It is disclosed in each `PRIVACY.md` and needs no per-app justification.
- **None:** set `"analytics": "none"` if even standard analytics isn't appropriate.
- **Custom** (anything beyond the standard): needs a clear reason, minimal data, documentation in `PRIVACY.md` and `APP.md`, and disclosure to users where appropriate. It must never collect personal data without `personal-data` approval.
- **Never:** fingerprinting, session recording, cross-site tracking, third-party ad or marketing pixels, or selling or sharing data.

## Browser storage

All apps share one origin (see [CLOUDFLARE.md](CLOUDFLARE.md#deployment-model)), so:

- Prefix every `localStorage` key and IndexedDB database name with `p100:<slug>:` so apps can never collide.
- Never store secrets or credentials in browser storage.
- Version stored data (e.g. a `version` field) and handle older versions when loading, so updates never destroy user data.
- Apps that keep meaningful user data should offer export (and ideally import), so the data outlives the app.
- Treat every string from storage, URLs, or files as untrusted. Render with `textContent` and DOM APIs rather than `innerHTML`, and never `eval`.

## Third-party requests

By default, apps make no requests to third parties. Self-host fonts and libraries instead of loading them from public CDNs. The only default exception is the Cloudflare Web Analytics beacon on live apps. Anything else is a dependency decision ([DEPENDENCIES.md](DEPENDENCIES.md)), and must be listed in `PRIVACY.md`.

## Secrets and repository hygiene

The repository is public. Never commit secrets, API keys, tokens, private analytics configuration, `.env` or `.dev.vars` files, or any user data. If a secret is committed, treat it as leaked: rotate it immediately and tell the owner. See [SECURITY.md](../SECURITY.md).

## PRIVACY.md requirements

Every app's `PRIVACY.md` states, even when the answer is "nothing":

- its classification (matching `app.json`)
- what data it handles, and where it is stored
- what leaves the device, and to whom
- the third parties involved
- retention and deletion

Update it in the same PR that changes data behavior. A reviewer should treat any mismatch between `PRIVACY.md` and the code as a blocking bug.
