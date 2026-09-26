// Which registry entries the assembled site publishes, and where. Driven only by app.json, so
// changing an app's status is all it takes to move, hide, or retire it. See docs/LIFECYCLE.md.

import type { AppMeta } from "@project-100/registry";
import { appPath } from "./site.ts";

/** How long an archived app that keeps user data stays online so people can export it. */
export const ARCHIVE_GRACE_DAYS = 90;

/**
 * One thing to put in the assembled site:
 * - "app": copy the app's built dist/ to `path`
 * - "tombstone": write a short "this app was archived" page at `path`
 */
export interface Publication {
  kind: "app" | "tombstone";
  meta: AppMeta;
  path: string;
}

/** Adds days to a YYYY-MM-DD date. */
function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The date an archived app's grace period ends, or null if it gets none. */
export function graceEnds(meta: Pick<AppMeta, "status" | "privacy" | "dates">): string | null {
  // Only apps that may keep data in the browser get a grace period; "none" stores nothing.
  if (meta.status !== "archived" || meta.privacy === "none" || meta.dates.archived === null)
    return null;
  return addDays(meta.dates.archived, ARCHIVE_GRACE_DAYS);
}

/**
 * Everything the site publishes, given today's date (YYYY-MM-DD):
 * - live → the app at /<slug>/
 * - labs → the app at /labs/<slug>/ (hidden: noindex, not listed publicly, not in the sitemap)
 * - archived, keeps user data, within the grace period → the app at /<slug>/
 * - archived, keeps user data, after the grace period → a tombstone at /<slug>/
 * - archived without user data, candidate, rejected → nothing
 */
export function publications(metas: AppMeta[], today: string): Publication[] {
  const result: Publication[] = [];
  for (const meta of metas) {
    if (meta.status === "live" || meta.status === "labs") {
      result.push({ kind: "app", meta, path: appPath(meta) });
    } else if (meta.status === "archived") {
      const ends = graceEnds(meta);
      if (ends === null) continue;
      result.push({ kind: today < ends ? "app" : "tombstone", meta, path: appPath(meta) });
    }
  }
  return result;
}
