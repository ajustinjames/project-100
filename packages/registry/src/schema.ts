// The shape of every `app.json` file in the repository.
// Field meanings and lifecycle rules are documented in docs/ARCHITECTURE.md and docs/LIFECYCLE.md.
// If you change this file, bump SCHEMA_VERSION only for breaking changes and update validate.ts.

export const SCHEMA_VERSION = 1;

/** The finish line: this many applications live at the same time. */
export const LIVE_TARGET = 100;

export const STATUSES = ["candidate", "rejected", "labs", "live", "archived"] as const;
export type Status = (typeof STATUSES)[number];

/** How an application handles user data. See docs/PRIVACY_AND_DATA.md. */
export const PRIVACY_CLASSES = ["none", "local-only", "server-anonymous", "personal-data"] as const;
export type PrivacyClass = (typeof PRIVACY_CLASSES)[number];

/** "standard" is the project-wide Cloudflare Web Analytics beacon. See docs/PRIVACY_AND_DATA.md. */
export const ANALYTICS_MODES = ["none", "standard", "custom"] as const;
export type AnalyticsMode = (typeof ANALYTICS_MODES)[number];

/** Things that need an explicit project-owner decision. See docs/AI_ROLES.md. */
export const APPROVAL_KINDS = [
  "launch",
  "archive",
  "sensitive-subject",
  "external-api",
  "personal-data",
  "accounts",
  "user-generated-content",
  "recurring-cost",
  "infrastructure",
] as const;
export type ApprovalKind = (typeof APPROVAL_KINDS)[number];

export interface Approval {
  kind: ApprovalKind;
  /** ISO date (YYYY-MM-DD) the owner approved. */
  date: string;
  /** Link to the GitHub issue, PR, or comment containing the owner's approval. */
  ref: string;
  note?: string;
}

export interface AppMeta {
  schemaVersion: typeof SCHEMA_VERSION;
  /** Permanent numeric ID, assigned when the app enters Labs. Never reused. null for unbuilt candidates. */
  id: number | null;
  /** URL- and directory-safe name. Also the deploy path. */
  slug: string;
  name: string;
  status: Status;
  /** One-sentence public description (used for meta description and the directory). */
  description: string;
  /** The problem the application solves, in plain language. */
  problem: string;
  /** Free-form lowercase kebab-case category, e.g. "productivity". */
  category: string;
  dates: {
    created: string;
    launched: string | null;
    archived: string | null;
  };
  /** Which ajj-design system the app builds on, e.g. "hardline" or "glassline". null only for candidates. */
  design: { system: string | null };
  /** Third-party runtime dependencies (package.json "dependencies" minus ajj-design and shared packages). */
  dependencies: string[];
  /** Workspace packages used, e.g. "@project-100/web". */
  sharedPackages: string[];
  privacy: PrivacyClass;
  analytics: AnalyticsMode;
  monetization: { eligible: boolean };
  approvals: Approval[];
  /** Required when status is "rejected". */
  rejection: { date: string; reason: string } | null;
}

/**
 * Slugs that would collide with site-level paths: the site's own pages, Cloudflare's /cdn-cgi/
 * namespace, and paths the static-asset router maps elsewhere (/index → /, /404 → 404.html).
 */
export const RESERVED_SLUGS = [
  "labs",
  "cdn-cgi",
  "index",
  "404",
  "assets",
  "api",
  "about",
  "apps",
  "static",
  "robots",
  "sitemap",
  "favicon",
  "well-known",
];

/** Approval refs must link into this repository (an issue, PR, or comment where the owner approved). */
export const APPROVAL_REF_PREFIX = "https://github.com/ajustinjames/project-100/";

/** Marker left in RETRO.md until a real retrospective is written. */
export const RETRO_INCOMPLETE_MARKER = "<!-- retro:incomplete -->";

/** The PRIVACY.md line stating the app's data class, e.g. **Classification:** `local-only`. */
export const PRIVACY_CLASSIFICATION = /^\*\*Classification:\*\* `([a-z-]+)`/m;
