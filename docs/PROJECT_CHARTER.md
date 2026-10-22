# Project Charter

This is the canonical policy for Project 100. Other documents add detail and must not contradict it. Only the project owner changes this charter.

## Mission

Project 100 is an experiment: can AI autonomously originate, research, scope, design, build, review, maintain, and archive useful web applications?

**The finish line is 100 applications live and maintained at the same time.**

- Only apps with status `live` count toward the 100.
- Archiving an app frees its slot. Archived apps stay in project history, keep their retrospective, and may be revived through the normal process.
- The registry (`pnpm p100 status`) is the source of truth for the count.

## Operating model

AI does about 90% of the work: it originates ideas, rejects weak ones before the owner sees them, researches, scopes, designs, prototypes, builds, tests, reviews other agents' work, improves shared packages and `ajj-design`, maintains live apps, and recommends archives.

The project owner handles:

- approvals and vetoes
- launch approval (Labs → live)
- archive approval
- unusual infrastructure, third-party APIs, and recurring costs
- privacy and security escalations
- disagreements between agents
- intervention when AI is stuck

Agents do **not** escalate ordinary implementation decisions. The full decision-rights table and escalation triggers are in [AI_ROLES.md](AI_ROLES.md#escalation).

## Idea ownership

Application ideas must originate from AI. The owner may approve, reject, question, redirect, or add constraints, but does not normally supply ideas. The point is to test AI's judgment about what is worth building.

Agents should compare a range of ideas, rank them, and build the strongest. Gates before Labs stop clear failures and choose between ideas; they don't try to prove an idea right before it exists. A working prototype in Labs is the real test, and discarding one is cheap. There is no target rejection rate. See [APP_ACCEPTANCE.md](APP_ACCEPTANCE.md).

## Product principles

**Favor:**

- genuinely useful software that someone would bookmark or come back to
- creative ideas, clever approaches, underserved problems, unusual niches
- familiar tools done well: thoughtful design, easier workflows, accessibility, or useful features offered for free
- small, understandable implementations; low-code when it solves the problem well
- software a weaker or local AI model could maintain in the future

**Avoid:**

- generic AI slop
- copies with no clear practical value for their intended users
- calculators, converters, formatters, generators, or dashboards without a useful task and a credible reason for someone to choose them
- thin wrappers around APIs, and generic AI wrappers
- SEO-content sites disguised as applications
- unnecessary architecture or dependencies
- anything needing manual ongoing operations or constant human content curation

There is no fixed size limit. Scope follows the problem: prefer focused apps, but allow a larger one when that is the natural solution.

**Familiar tools done well are a main route to the 100, not an exception.** Most useful web software is a timer, a viewer, a planner, a printable, or an estimator. A version with no ads, no upload, no account, fewer steps, or a better phone experience is worth building. Expect most apps to come from this route, and the rest from underserved niches. The two are the [utility and niche tracks](APP_ACCEPTANCE.md#two-tracks).

Originality is optional. Similarity to an existing app is not a reason to reject an idea. Better execution, a more pleasant or accessible experience, less setup, or making useful paid functionality free can be a real reason to build another. Describe the benefit concretely; a new feature or an underserved niche is not required.

## Sensitive subjects

Agents must not autonomously build applications involving:

- medicine, diagnosis, or health treatment recommendations
- politics, elections, or political persuasion
- misinformation-sensitive subjects
- other high-stakes factual domains (for example legal, financial, or safety advice)

Anything close to these needs explicit owner approval (`sensitive-subject`) **before implementation**, including Labs. When uncertain, escalate rather than stretching the rule.

The rule is about advice and claims, not whole areas of life. These are **not** sensitive subjects on their own, so they need no approval:

- arithmetic the user drives, with no recommendation: a loan amortization table, splitting a bill, a savings-goal schedule
- timers, logs, and reminders the user sets up: an interval timer for exercise, a reminder at times the user enters, a habit tracker
- displaying, converting, or reorganizing the user's own documents and files, including for accessibility
- low-stakes reference material copied from an authoritative published source and linked to it (unit tables, paper and screw sizes, needle sizes), with no interpretation. This never covers health, medicine, money, law, or safety references (dosages, clinical reference ranges, tax rates, load or exposure limits), however well sourced.

These remain sensitive and need approval: anything that tells a person what they should do about their health, money, legal position, or safety; anything that interprets symptoms, results, or rules for them; and anything about political candidates, parties, or elections. Escalate a case these lists don't cover.

## Budget and infrastructure

Baseline budget: one consumer Claude subscription, one consumer ChatGPT/Codex subscription, and free Cloudflare infrastructure. Do not assume paid API access. External AI APIs are unavailable by default.

An app may exceed the baseline only with explicit owner approval, or when its own revenue sustainably covers the extra cost.

Implementation preference, in order:

1. browser/client-side
2. local persistence
3. existing shared monorepo capabilities
4. Cloudflare platform services
5. external services, only when clearly justified (owner approval required, see [DEPENDENCIES.md](DEPENDENCIES.md#external-apis))

No speculative infrastructure. Add a service when an app proves it needs it. See [CLOUDFLARE.md](CLOUDFLARE.md).

## Accounts, personal data, and user content

- Accounts and logins are discouraged (not prohibited) and need owner approval.
- No personal data by default. Any personal-data handling needs owner approval before implementation.
- Public user-generated content (forums, comments, uploads, feeds, anything needing moderation) is prohibited without owner approval.

Details: [PRIVACY_AND_DATA.md](PRIVACY_AND_DATA.md).

## Maintainability test

Before any significant architectural decision, ask:

> Could a weaker local AI model reasonably understand and repair this repository in five years?

Prefer recoverability over sophistication. Avoid unnecessary abstraction, heavy indirection, clever framework tricks, unjustified metaprogramming, and generated code that is hard to reason about.

## Design and media

Every app uses `ajj-design` as its design-system foundation. AI must not generate original media (images, illustrations, video, audio, icons, logos, or custom or decorative SVG artwork). See [DESIGN_AND_ASSETS.md](DESIGN_AND_ASSETS.md).

## SEO

SEO exists to help useful apps get discovered. It must never drive app selection. Do not create keyword-stuffed content, mass-generated landing pages, doorway pages, thin content, or pages whose main purpose is search traffic. Labs is never indexed. The mechanics are in [ARCHITECTURE.md](ARCHITECTURE.md#seo).

## AI disclosure

Don't make AI the marketing message, and don't hide it. Every app page shows a subtle, footer-level disclosure that it is part of Project 100 and is conceived, designed, built, and maintained primarily by AI under human oversight. `@project-100/web` renders it. Never claim or imply human authorship that did not happen.

## Monetization

Monetization is secondary and never drives idea selection or UX. Labs is never monetized. See [MONETIZATION.md](MONETIZATION.md).

## Public repository

Everything is public source. For now only the project owner contributes; external pull requests are not assumed or depended on. Never commit secrets, credentials, private API keys, private analytics configuration, or private user information. See [SECURITY.md](../SECURITY.md).
