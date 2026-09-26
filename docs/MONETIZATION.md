# Monetization

Monetization is secondary. Revenue may help cover the operating budget. It never decides which apps get built or how they behave.

## Rules

- Never choose or rank ideas because they look monetizable.
- Never distort UX to create ad impressions: no interstitials, no artificial page splits, no forced waits, and no ads placed where they would be mistaken for app controls.
- Never overload an app with ads. At most one unobtrusive placement per view, and none inside core interactive workflows.
- Never monetize Labs. `monetization.eligible` must be `false` unless the app is `live` (enforced by `pnpm p100 validate`).
- Paid features, donations, or sponsorships need owner approval, like any new infrastructure or third party.

## Eligibility

`monetization.eligible: true` means an app may carry ads if and when the project has an approved ad setup. A live app is eligible only if:

- ads would not harm its core use (e.g. not in focus or accessibility-critical tools)
- its audience and subject matter are appropriate for advertising
- the owner agreed to eligibility (it can be part of the launch approval)

## Current state

**No ad provider is approved, and no ad code exists.** Ad networks generally involve cookies, tracking, and consent obligations. Adopting one needs owner approval covering:

- the provider, and what it collects
- consent handling in the jurisdictions that require it
- the effect on each app's `PRIVACY.md` and data classification
- performance impact

After approval, shared ad support belongs in a small shared package (e.g. `@project-100/ads`). Apps opt in explicitly, and placement stays a deliberate per-app decision. Build it only then.

## Tracking revenue

When revenue exists, record it (in aggregate, with no user data) in a doc the owner chooses, so the budget rule in the [charter](PROJECT_CHARTER.md#budget-and-infrastructure) ("revenue sustainably covers the extra cost") can be checked with evidence.
