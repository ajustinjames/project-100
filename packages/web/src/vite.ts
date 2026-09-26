// Vite plugins that apply Project 100 standards.
//
// project100(): for an app, driven by the app's app.json:
//   - sets `base` to the app's deploy path (/<slug>/ or /labs/<slug>/)
//   - injects head tags (title, description, robots, canonical, Open Graph, analytics)
//   - replaces the footer placeholder with the AI disclosure footer (build fails if missing)
// Usage in an app's vite.config.ts:  plugins: [project100()]
// The built output is checked independently by `pnpm p100 check-builds`.
//
// project100Site(): for the site's own pages in site/ (home page, Labs index, 404), driven by
// the whole registry. See site/README.md.

import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { type AppMeta, countByStatus, loadRegistry, validateRegistry } from "@project-100/registry";
import type { Plugin } from "vite";
import {
  COUNTER_PLACEHOLDER,
  LABS_APPS_PLACEHOLDER,
  LIVE_APPS_PLACEHOLDER,
  renderAppList,
  renderCounter,
} from "./directory.ts";
import {
  FOOTER_PLACEHOLDER,
  headTags,
  pageHeadTags,
  renderFooter,
  renderSiteFooter,
} from "./html.ts";
import { ANALYTICS_TOKEN_ENV, appPath, SITE_ORIGIN } from "./site.ts";

function analyticsToken(): string | null {
  return process.env[ANALYTICS_TOKEN_ENV]?.trim() || null;
}

/** Checks the rules every page shares. `file` is relative to the project root. */
function checkPageSource(file: string, html: string, generated: string): void {
  if (!html.includes(FOOTER_PLACEHOLDER)) {
    throw new Error(`${file}: missing ${FOOTER_PLACEHOLDER}. Every page needs the footer.`);
  }
  if (/<title[\s>]/i.test(html)) {
    throw new Error(`${file}: remove <title>; it is generated from ${generated}.`);
  }
}

export function project100(): Plugin {
  let root: string;
  let meta: AppMeta;

  return {
    name: "project-100",

    config(userConfig) {
      root = resolve(userConfig.root ?? process.cwd());
      meta = JSON.parse(readFileSync(resolve(root, "app.json"), "utf8")) as AppMeta;
      return { base: appPath(meta) };
    },

    transformIndexHtml(html, context) {
      const file = relative(root, context.filename).replaceAll("\\", "/");
      checkPageSource(file, html, "app.json");
      // "index.html" → "", "about.html" → "about.html", "docs/index.html" → "docs/"
      const pagePath = file.replace(/(^|\/)index\.html$/, "$1");
      const tags = headTags(meta, {
        origin: SITE_ORIGIN,
        analyticsToken: analyticsToken(),
        pagePath,
      });
      return {
        // A function replacement, so "$" sequences in the footer are never special.
        html: html.replace(FOOTER_PLACEHOLDER, () => renderFooter(meta, SITE_ORIGIN)),
        tags: tags.map((tag) => ({ ...tag, injectTo: "head" as const })),
      };
    },
  };
}

/** One of the site's own pages. Its URL path follows from its file name. */
export interface SitePage {
  title: string;
  description: string;
  /** Only the home page is indexable. Indexable pages also get analytics in production. */
  indexable: boolean;
}

export interface SiteOptions {
  /** Repository root, where apps/ and candidates/ are. */
  repoRoot: string;
  /** Every HTML page, keyed by its path relative to the site root, e.g. "labs/index.html". */
  pages: Record<string, SitePage>;
}

export function project100Site(options: SiteOptions): Plugin {
  let root: string;
  let live: AppMeta[];
  let labs: AppMeta[];
  let liveCount: number;

  return {
    name: "project-100-site",

    config(userConfig) {
      root = resolve(userConfig.root ?? process.cwd());
      const { entries, errors } = loadRegistry(options.repoRoot);
      const problems = [...errors, ...validateRegistry(entries)];
      // Like `pnpm p100 status`: the counter and listings are only trustworthy if all entries are.
      if (problems.length > 0)
        throw new Error(
          `the registry is invalid (run pnpm p100 validate):\n${problems.join("\n")}`,
        );
      live = entries.filter((e) => e.meta.status === "live").map((e) => e.meta);
      labs = entries.filter((e) => e.meta.status === "labs").map((e) => e.meta);
      liveCount = countByStatus(entries).live;
      const input = Object.keys(options.pages).map((file) => resolve(root, file));
      return { base: "/", build: { rolldownOptions: { input } } };
    },

    transformIndexHtml(html, context) {
      const file = relative(root, context.filename).replaceAll("\\", "/");
      const page = options.pages[file];
      if (!page) throw new Error(`${file}: add this page to the pages in site/vite.config.ts`);
      checkPageSource(file, html, "site/vite.config.ts");
      if (page.indexable && html.includes(LABS_APPS_PLACEHOLDER)) {
        throw new Error(`${file}: a page listing Labs apps must not be indexable`);
      }
      // "index.html" → "/", "labs/index.html" → "/labs/", "404.html" → "/404.html"
      const path = `/${file.replace(/(^|\/)index\.html$/, "$1")}`;
      const tags = pageHeadTags(
        { ...page, path, analytics: page.indexable },
        { origin: SITE_ORIGIN, analyticsToken: analyticsToken() },
      );
      // Function replacements, so "$" sequences in app names are never special.
      const body = html
        .replace(FOOTER_PLACEHOLDER, () => renderSiteFooter())
        .replace(COUNTER_PLACEHOLDER, () => renderCounter(liveCount))
        .replace(LIVE_APPS_PLACEHOLDER, () =>
          renderAppList(live, "No apps are live yet. The first ones are still being built."),
        )
        .replace(LABS_APPS_PLACEHOLDER, () => renderAppList(labs, "Nothing is in Labs right now."));
      return { html: body, tags: tags.map((tag) => ({ ...tag, injectTo: "head" as const })) };
    },
  };
}
