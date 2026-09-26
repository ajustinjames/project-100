// The site's own listings: the live-app counter and app lists on the home page and the hidden
// Labs index. Pure functions; the site's Vite plugin feeds them the registry.

import { type AppMeta, LIVE_TARGET } from "@project-100/registry";
import { escapeHtml } from "./html.ts";
import { appPath } from "./site.ts";

/** Placeholders the site's HTML pages use. Each is replaced at build time. */
export const COUNTER_PLACEHOLDER = "<!-- p100:counter -->";
export const LIVE_APPS_PLACEHOLDER = "<!-- p100:live-apps -->";
export const LABS_APPS_PLACEHOLDER = "<!-- p100:labs-apps -->";

type ListedApp = Pick<AppMeta, "slug" | "name" | "description" | "status">;

/** The Project 100 counter. `live` comes from countByStatus(entries).live. */
export function renderCounter(live: number): string {
  const apps = live === 1 ? "app" : "apps";
  return `<p class="p100-counter"><strong>${live}</strong> of ${LIVE_TARGET} ${apps} live</p>`;
}

/** A list of apps linking to their paths, sorted by name, or `emptyText` if there are none. */
export function renderAppList(apps: ListedApp[], emptyText: string): string {
  if (apps.length === 0) return `<p class="p100-empty">${escapeHtml(emptyText)}</p>`;
  const items = [...apps]
    .sort((a, b) => a.name.localeCompare(b.name, "en"))
    .map(
      (app) =>
        `  <li><a href="${escapeHtml(appPath(app))}">${escapeHtml(app.name)}</a>` +
        `<p>${escapeHtml(app.description)}</p></li>`,
    );
  return `<ul class="p100-apps">\n${items.join("\n")}\n</ul>`;
}
