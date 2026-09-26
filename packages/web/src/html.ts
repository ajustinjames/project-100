// The <head> tags and footer every Project 100 app page must have.
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

/**
 * One head element. Same shape as Vite's HtmlTagDescriptor: attribute values are raw (the
 * serializer escapes them); `children` is inserted as-is, so it must already be escaped.
 */
export interface HeadTag {
  tag: string;
  attrs?: Record<string, string>;
  children?: string;
}

export interface HeadOptions {
  /** Site origin without trailing slash, or null if unknown. */
  origin: string | null;
  /** Cloudflare Web Analytics token, or null to omit the beacon. */
  analyticsToken: string | null;
  /** This page's path inside the app, e.g. "" for index.html or "about.html". */
  pagePath?: string;
}

type HeadMeta = Pick<AppMeta, "slug" | "name" | "description" | "status" | "analytics">;

/** Head tags: title, description, robots, canonical, Open Graph, analytics. */
export function headTags(meta: HeadMeta, options: HeadOptions): HeadTag[] {
  const isLive = meta.status === "live";
  const title = isLive ? meta.name : `${meta.name} (Labs)`;
  const tags: HeadTag[] = [
    { tag: "title", children: escapeHtml(title) },
    { tag: "meta", attrs: { name: "description", content: meta.description } },
  ];

  if (!isLive) {
    // Labs (and anything not live) must never be indexed.
    tags.push({ tag: "meta", attrs: { name: "robots", content: "noindex, nofollow" } });
    return tags;
  }

  const url = options.origin ? `${options.origin}${appPath(meta)}${options.pagePath ?? ""}` : null;
  if (url) tags.push({ tag: "link", attrs: { rel: "canonical", href: url } });
  tags.push(
    { tag: "meta", attrs: { property: "og:type", content: "website" } },
    { tag: "meta", attrs: { property: "og:site_name", content: SITE_NAME } },
    { tag: "meta", attrs: { property: "og:title", content: meta.name } },
    { tag: "meta", attrs: { property: "og:description", content: meta.description } },
  );
  if (url) tags.push({ tag: "meta", attrs: { property: "og:url", content: url } });

  if (meta.analytics === "standard" && options.analyticsToken) {
    tags.push({
      tag: "script",
      attrs: {
        defer: "",
        src: "https://static.cloudflareinsights.com/beacon.min.js",
        "data-cf-beacon": JSON.stringify({ token: options.analyticsToken }),
      },
      children: "",
    });
  }
  return tags;
}

/** Serializes head tags to HTML (for tests and non-Vite use). */
export function renderTags(tags: HeadTag[]): string {
  return tags
    .map(({ tag, attrs = {}, children }) => {
      const attrText = Object.entries(attrs)
        .map(([key, value]) => ` ${key}="${escapeHtml(value)}"`)
        .join("");
      return children === undefined
        ? `<${tag}${attrText}>`
        : `<${tag}${attrText}>${children}</${tag}>`;
    })
    .join("\n");
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
