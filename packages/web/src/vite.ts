// Vite plugin that applies Project 100 standards to an app, driven by the app's app.json:
//   - sets `base` to the app's deploy path (/<slug>/ or /labs/<slug>/)
//   - injects head tags (title, description, robots, canonical, Open Graph, analytics)
//   - replaces the footer placeholder with the AI disclosure footer (build fails if missing)
// Usage in an app's vite.config.ts:  plugins: [project100()]

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AppMeta } from "@project-100/registry";
import type { Plugin } from "vite";
import { FOOTER_PLACEHOLDER, renderFooter, renderHead } from "./html.ts";
import { ANALYTICS_TOKEN_ENV, appPath, SITE_ORIGIN } from "./site.ts";

export function project100(): Plugin {
  let meta: AppMeta;

  return {
    name: "project-100",

    config(userConfig) {
      const root = resolve(userConfig.root ?? process.cwd());
      meta = JSON.parse(readFileSync(resolve(root, "app.json"), "utf8")) as AppMeta;
      return { base: appPath(meta) };
    },

    transformIndexHtml(html, context) {
      if (!html.includes(FOOTER_PLACEHOLDER)) {
        throw new Error(
          `${context.path}: missing ${FOOTER_PLACEHOLDER}. Every page needs the Project 100 footer.`,
        );
      }
      if (/<title>/i.test(html)) {
        throw new Error(`${context.path}: remove <title>; it is generated from app.json.`);
      }
      const head = renderHead(meta, {
        origin: SITE_ORIGIN,
        analyticsToken: process.env[ANALYTICS_TOKEN_ENV]?.trim() || null,
      });
      return html
        .replace("</head>", `  ${head}\n  </head>`)
        .replace(FOOTER_PLACEHOLDER, renderFooter(meta, SITE_ORIGIN));
    },
  };
}
