// The <head> tags and footer every Project 100 app page must have.
// Pure functions (no filesystem, no env) so they are easy to test and reuse.

import type { AppMeta } from "@project-100/registry";
import { graceEnds } from "./publish.ts";
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

/** What a page's head tags depend on. Apps derive this from app.json; site pages define it. */
export interface PageHead {
  title: string;
  description: string;
  /** URL path from the site root, e.g. "/" or "/tide-table/about.html". */
  path: string;
  /** Only indexable pages get canonical, Open Graph, and analytics. The rest are noindex. */
  indexable: boolean;
  /** Whether the standard analytics beacon may be added (it still needs a token). */
  analytics: boolean;
}

/** Head tags: title, description, robots, canonical, Open Graph, analytics. */
export function pageHeadTags(page: PageHead, options: Omit<HeadOptions, "pagePath">): HeadTag[] {
  const tags: HeadTag[] = [
    { tag: "title", children: escapeHtml(page.title) },
    { tag: "meta", attrs: { name: "description", content: page.description } },
  ];

  if (!page.indexable) {
    // Labs (and anything not live) must never be indexed.
    tags.push({ tag: "meta", attrs: { name: "robots", content: "noindex, nofollow" } });
    return tags;
  }

  const url = options.origin ? `${options.origin}${page.path}` : null;
  if (url) tags.push({ tag: "link", attrs: { rel: "canonical", href: url } });
  tags.push(
    { tag: "meta", attrs: { property: "og:type", content: "website" } },
    { tag: "meta", attrs: { property: "og:site_name", content: SITE_NAME } },
    { tag: "meta", attrs: { property: "og:title", content: page.title } },
    { tag: "meta", attrs: { property: "og:description", content: page.description } },
  );
  if (url) tags.push({ tag: "meta", attrs: { property: "og:url", content: url } });

  if (page.analytics && options.analyticsToken) {
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

type HeadMeta = Pick<AppMeta, "slug" | "name" | "description" | "status" | "analytics">;

/** Head tags for one page of an app, from its app.json. */
export function headTags(meta: HeadMeta, options: HeadOptions): HeadTag[] {
  const isLive = meta.status === "live";
  const label = meta.status === "archived" ? "Archived" : "Labs";
  return pageHeadTags(
    {
      title: isLive ? meta.name : `${meta.name} (${label})`,
      description: meta.description,
      path: `${appPath(meta)}${options.pagePath ?? ""}`,
      indexable: isLive,
      analytics: meta.analytics === "standard",
    },
    options,
  );
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
export function renderFooter(
  meta: Pick<AppMeta, "status" | "privacy" | "dates">,
  origin: string | null,
): string {
  const home = origin ? `${origin}/` : REPOSITORY_URL;
  const lines = [];
  if (meta.status === "archived") {
    const ends = graceEnds(meta);
    lines.push(
      ends
        ? `<p>This app is archived. It stays online until ${ends} so you can export your data.</p>`
        : "<p>This app is archived.</p>",
    );
  } else if (meta.status !== "live") {
    lines.push("<p>Experimental Labs prototype. It may change or disappear without notice.</p>");
  }
  lines.push(`<p>Part of <a href="${escapeHtml(home)}">${SITE_NAME}</a>: ${AI_DISCLOSURE}</p>`);
  return `<footer class="p100-footer" data-p100-footer>\n  ${lines.join("\n  ")}\n</footer>`;
}

/** The disclosure footer for the site's own pages (home page, Labs index, 404). */
export function renderSiteFooter(): string {
  return [
    '<footer class="p100-footer" data-p100-footer>',
    `  <p>${SITE_NAME} apps are ${AI_DISCLOSURE} <a href="${REPOSITORY_URL}">Source on GitHub</a>.</p>`,
    "</footer>",
  ].join("\n");
}

/** The page left at /<slug>/ once an archived app's grace period is over. Unstyled on purpose. */
export function renderTombstone(meta: Pick<AppMeta, "slug" | "name" | "dates">): string {
  const name = escapeHtml(meta.name);
  const retro = `${REPOSITORY_URL}/blob/main/apps/${meta.slug}/RETRO.md`;
  const head = renderTags(
    pageHeadTags(
      {
        title: `${meta.name} (Archived)`,
        description: `${meta.name} was part of ${SITE_NAME} and has been archived.`,
        path: `/${meta.slug}/`,
        indexable: false,
        analytics: false,
      },
      { origin: null, analyticsToken: null },
    ),
  );
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="data:," />
    ${head.replaceAll("\n", "\n    ")}
  </head>
  <body>
    <main>
      <h1>${name} has been archived</h1>
      <p>${name} was archived on ${meta.dates.archived ?? "an earlier date"} and is no longer available.</p>
      <p><a href="${retro}">Read its retrospective</a> or <a href="/">see the apps that are live now</a>.</p>
    </main>
    ${renderSiteFooter().replaceAll("\n", "\n    ")}
  </body>
</html>
`;
}
