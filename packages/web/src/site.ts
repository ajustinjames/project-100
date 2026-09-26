// Project-wide site constants. Public information only: never put secrets here.

import type { AppMeta } from "@project-100/registry";

export const SITE_NAME = "Project 100";

/**
 * Public origin of the deployed site (no trailing slash). Typed nullable so a fork or local
 * experiment can set it to null, which skips canonical URLs.
 */
export const SITE_ORIGIN: string | null = "https://hundred.ajustinjames.com";

export const REPOSITORY_URL = "https://github.com/ajustinjames/project-100";

/** Env var holding the Cloudflare Web Analytics site token. Set only in the deploy environment. */
export const ANALYTICS_TOKEN_ENV = "P100_CF_ANALYTICS_TOKEN";

/**
 * The URL path an app is served from. Live apps live at /<slug>/.
 * Everything else (Labs, and archived builds that are not deployed) is under /labs/<slug>/.
 */
export function appPath(meta: Pick<AppMeta, "slug" | "status">): string {
  return meta.status === "live" ? `/${meta.slug}/` : `/labs/${meta.slug}/`;
}
