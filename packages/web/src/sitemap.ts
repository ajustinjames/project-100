// Sitemap and robots.txt for the whole site. Only live apps are ever listed; Labs never are.

import type { AppMeta } from "@project-100/registry";
import { escapeHtml } from "./html.ts";
import { appPath } from "./site.ts";

export function renderSitemap(apps: Pick<AppMeta, "slug" | "status">[], origin: string): string {
  const urls = [
    `${origin}/`,
    ...apps.filter((a) => a.status === "live").map((a) => origin + appPath(a)),
  ];
  const body = urls.map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/**
 * robots.txt deliberately does not mention /labs/: listing it would advertise it, and blocking
 * crawling would stop crawlers from seeing the noindex directives Labs pages carry.
 */
export function renderRobots(origin: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
}
