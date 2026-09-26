# Lifecycle

Every idea that gets recorded has an `app.json` with a `status`. The rules below are enforced by `pnpm p100 validate` where practical.

## Statuses

| Status | Meaning | Location | Has id | Counts toward 100 |
|---|---|---|---|---|
| `candidate` | Proposed, not built | `candidates/<slug>/` | no | no |
| `rejected` | Declined as a candidate, or a discarded Labs prototype | `candidates/<slug>/` or `apps/<slug>/` | only if it reached Labs | no |
| `labs` | Hidden prototype | `apps/<slug>/` | yes | no |
| `live` | Launched, public, maintained | `apps/<slug>/` | yes | **yes** |
| `archived` | Retired, kept as history | `apps/<slug>/` | yes | no |

At most 100 apps may be `live` at once. Archive one to free a slot.

```
candidate ──▶ labs ──▶ live ──▶ archived
    │           │                   │
    ▼           ▼                   ▼
 rejected    rejected        (revival: same app in Labs)
```

## Transitions

| From → To | Who decides | Required | How |
|---|---|---|---|
| (idea) → `candidate` | AI | Passed the [screen and research](APP_ACCEPTANCE.md#gate-1-screen-before-anything-is-recorded); [critiqued](APP_ACCEPTANCE.md#5-adversarial-critique) before its PR merges; no TODOs | `pnpm p100 candidate <slug> "<Name>"`, then a candidate PR ([steps 4–6](APP_ACCEPTANCE.md#gate-2-candidate-proposal)) |
| `candidate` → `rejected` | AI or owner | `rejection: { date, reason }` | edit `app.json` |
| `candidate` → `labs` | AI, unless an [escalation](AI_ROLES.md#escalation) applies | Selected after critique; needed approvals recorded | `pnpm p100 promote <slug>` ([steps 7–8](APP_ACCEPTANCE.md#gate-3-entering-labs)) |
| `labs` → `rejected` | AI | `rejection`, completed `RETRO.md` | see [below](#discarding-a-labs-prototype) |
| `labs` → `live` | **Owner** | Launch packet, `launch` approval, `dates.launched` | see [Launching](#launching) |
| `live` → `archived` | **Owner** | `archive` approval, `dates.archived`, completed `RETRO.md` | see [Archiving](#archiving) |

Only these transitions and [revivals](#revival) are allowed, and registry entries are never deleted. On every PR, `pnpm p100 check-changes` enforces this against `main`, and marks launch and archive PRs as owner-merged ([AI_ROLES.md](AI_ROLES.md#merging)).

## IDs

- Assigned once, when a candidate is promoted to Labs (`pnpm p100 promote`). Candidates don't have ids.
- IDs are never reused, even after rejection or archive. App #001 is simply the first app to reach Labs.
- IDs are not slots. The 100 is a count of `live` apps, not a range of ids.
- If two branches promote at the same time, the PR that merges second fails CI. Rebase and renumber its new id; an id that never reached `main` was never used.

## Labs

Labs apps:

- are served from `/labs/<slug>/`, never from the public paths
- get `noindex, nofollow` and a visible "experimental" footer line (both added automatically by `@project-100/web` for any non-live status)
- are not listed in the public directory or sitemap, and are not linked from normal navigation. They are listed on the hidden Labs index (`/labs/`), which opens when someone types `labs` on the home page (see [CLOUDFLARE.md](CLOUDFLARE.md#labs))
- are never monetized (`monetization.eligible` must be `false`)
- get no analytics beacon

Hidden is not secret: the repository is public, so anyone can find Labs apps. Never put anything confidential in Labs.

## Discarding a Labs prototype

AI may discard a prototype without approval:

1. Set `status: "rejected"` and `rejection: { date, reason }`.
2. Delete the code (`src/`, `package.json`, `index.html`, and config), keeping `app.json`, `APP.md`, `PROPOSAL.md`, and `RETRO.md`.
3. Write a short `RETRO.md` covering what was learned, and remove the `retro:incomplete` marker. `pnpm p100 validate` requires real content.

The id stays retired.

## Launching

1. Meet [launch readiness](APP_ACCEPTANCE.md#gate-4-launch-readiness) and open the launch packet issue.
2. After owner approval, open a PR (owner-merged) that:
   - sets `status: "live"` and `dates.launched`
   - adds `{ "kind": "launch", "date": "...", "ref": "<link to the owner's approval>" }` to `approvals`
   - sets `monetization.eligible` only if [MONETIZATION.md](MONETIZATION.md) allows it
3. The app moves from `/labs/<slug>/` to `/<slug>/` automatically, because the path is derived from status.

## Maintaining live apps

Live apps must keep working. The Maintainer role:

- merges Dependabot updates after CI passes, fixing any breakage
- fixes bugs and keeps `APP.md` and `PRIVACY.md` accurate
- watches for dead external dependencies and platform deprecations
- runs a periodic audit (`pnpm p100 validate` plus a manual review of each live app) and files archive recommendations when warranted

## Archiving

Consider archiving when an app:

- shows little or no demonstrated usefulness
- has become redundant, or is superseded by another Project 100 app
- has become disproportionately expensive to maintain
- depends on an external service that is no longer available
- has developed unacceptable security or privacy risk
- no longer meets project standards

Process:

1. Open an "Archive recommendation" issue with evidence.
2. Draft `RETRO.md` (see the template sections) in a PR.
3. After owner approval: set `status: "archived"`, `dates.archived`, and add the `archive` approval.
4. Remove the app from the directory and sitemap (automatic, driven by status). If the app keeps user data locally, keep serving it with an "archived" notice and a working export for a grace period (default 90 days) before replacing it with a tombstone page linking to the retrospective. `pnpm build:site` does this automatically for any archived app whose `privacy` is not `none`: it stays at `/<slug>/` (noindex, no analytics) until 90 days after `dates.archived`, and its footer shows the archived notice and removal date. Then a tombstone replaces it. The app's code and build must keep working until then, and keeping the export working is the app's job. Archived apps with `privacy: "none"` are simply removed.
5. Decide whether any of its code should move to, or stay in, a shared package.

Security or privacy emergencies can take an app offline immediately. Formal archiving follows.

## Revival

An archived or rejected idea can come back through the normal review process. Keep its slug. Open a PR that updates `PROPOSAL.md` with what changed and why the idea deserves another try, preserving the earlier rejection reason and decision links. It gets the same [critique and selection](APP_ACCEPTANCE.md#5-adversarial-critique) as a new candidate, including resolution of dismissed Critical or High findings.

**Rejected before Labs** (`candidates/<slug>/`, `id: null`):

1. If selected again, set `status: "candidate"` and clear `rejection` to `null` in the revival PR. Keep the entry in `candidates/` with `id: null`, record the new dated decision in `PROPOSAL.md`, and merge after critique and selection. If rejected again, keep status `rejected` and record the new reason.
2. Obtain and record any required [owner approvals](APP_ACCEPTANCE.md#7-owner-approval-only-if-an-escalation-applies).
3. Follow the normal [promotion steps](APP_ACCEPTANCE.md#8-promote) from `main`: `pnpm p100 promote <slug>` creates the app scaffold and assigns its first id. Record the revival and promotion reason in `APP.md`.

**Previously reached Labs** (`apps/<slug>/`, with a permanent id):

1. After selection and any required owner approvals, restore any removed app code and configuration, set `status: "labs"`, and keep the existing slug and id. Clear `dates.archived` and `rejection` to `null`, and note the revival in `APP.md`. Keep earlier approvals as history. Run `pnpm verify` before merging the revival PR.
2. Going live again follows the normal launch process and needs a **new** `launch` approval. For an archived app, it must be dated after the last `archive` approval (enforced by `pnpm p100 validate`).
