// Vite plugin that applies Project 100 standards to an app, driven by the app's app.json:
//   - sets `base` to the app's deploy path (/<slug>/ or /labs/<slug>/)
//   - injects head tags (title, description, robots, canonical, Open Graph, analytics)
//   - replaces the footer placeholder with the AI disclosure footer (build fails if missing)
// Usage in an app's vite.config.ts:  plugins: [project100()]
// The built output is checked independently by `pnpm p100 check-builds`.

import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import type { AppMeta } from "@project-100/registry";
import type { Plugin } from "vite";
import { FOOTER_PLACEHOLDER, headTags, renderFooter } from "./html.ts";
import { ANALYTICS_TOKEN_ENV, appPath, SITE_ORIGIN } from "./site.ts";

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
      if (!html.includes(FOOTER_PLACEHOLDER)) {
        throw new Error(`${file}: missing ${FOOTER_PLACEHOLDER}. Every page needs the footer.`);
      }
      if (/<title[\s>]/i.test(html)) {
        throw new Error(`${file}: remove <title>; it is generated from app.json.`);
      }
      // "index.html" → "", "about.html" → "about.html", "docs/index.html" → "docs/"
      const pagePath = file.replace(/(^|\/)index\.html$/, "$1");
      const tags = headTags(meta, {
        origin: SITE_ORIGIN,
        analyticsToken: process.env[ANALYTICS_TOKEN_ENV]?.trim() || null,
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
