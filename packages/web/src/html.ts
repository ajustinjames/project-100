// Renders the <head> tags and footer every Project 100 app page must have.
// Pure functions (no filesystem, no env) so they are easy to test and reuse.

import type { AppMeta } from "@project-100/registry";
import { appPath, REPOSITORY_URL, SITE_NAME } from "./site.ts";

/** Put this comment in each HTML page where the Project 100 footer should go. */
export const FOOTER_PLACEHOLDER = "<!-- p100:footer -->";

export const AI_DISCLOSURE =
  "conceived, designed, built, and maintained primarily by AI under human oversight.";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export interface HeadOptions {
  /** Site origin without trailing slash, or null if unknown. */
  origin: string | null;
  /** Cloudflare Web Analytics token, or null to omit the beacon. */
  analyticsToken: string | null;
}

type HeadMeta = Pick<AppMeta, "slug" | "name" | "description" | "status" | "analytics">;

/** Head tags: title, description, robots, canonical, Open Graph, analytics. */
export function renderHead(meta: HeadMeta, options: HeadOptions): string {
  const isLive = meta.status === "live";
  const title = isLive ? meta.name : `${meta.name} (Labs)`;
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}">`,
  ];

  if (!isLive) {
    // Labs (and anything not live) must never be indexed.
    tags.push('<meta name="robots" content="noindex, nofollow">');
    return tags.join("\n    ");
  }

  const url = options.origin ? `${options.origin}${appPath(meta)}` : null;
  if (url) tags.push(`<link rel="canonical" href="${escapeHtml(url)}">`);
  tags.push(
    '<meta property="og:type" content="website">',
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:title" content="${escapeHtml(meta.name)}">`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}">`,
  );
  if (url) tags.push(`<meta property="og:url" content="${escapeHtml(url)}">`);

  if (meta.analytics === "standard" && options.analyticsToken) {
    const beacon = escapeHtml(JSON.stringify({ token: options.analyticsToken }));
    tags.push(
      `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon="${beacon}"></script>`,
    );
  }
  return tags.join("\n    ");
}

/** The subtle, footer-level Project 100 disclosure. Apps style `.p100-footer` themselves. */
export function renderFooter(meta: Pick<AppMeta, "status">, origin: string | null): string {
  const home = origin ? `${origin}/` : REPOSITORY_URL;
  const lines = [];
  if (meta.status !== "live") {
    lines.push("<p>Experimental Labs prototype. It may change or disappear without notice.</p>");
  }
  lines.push(`<p>Part of <a href="${escapeHtml(home)}">${SITE_NAME}</a>: ${AI_DISCLOSURE}</p>`);
  return `<footer class="p100-footer" data-p100-footer>\n  ${lines.join("\n  ")}\n</footer>`;
}
