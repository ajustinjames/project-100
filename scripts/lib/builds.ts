// Checks every built page of every Labs/live app (and the app template) for the project web
// standards. Run after `pnpm build`.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { AppMeta, RegistryEntry } from "../../packages/registry/src/index.ts";
import { checkBuiltPage } from "../../packages/web/src/check.ts";

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(path);
    return e.name.endsWith(".html") ? [path] : [];
  });
}

export function checkBuilds(root: string, entries: RegistryEntry[]): string[] {
  const targets = entries
    .filter((e) => e.location === "apps" && (e.meta.status === "labs" || e.meta.status === "live"))
    .map((e) => ({ dir: e.dir, meta: e.meta }));
  const template = JSON.parse(
    readFileSync(join(root, "templates/app/app.json"), "utf8"),
  ) as AppMeta;
  targets.push({ dir: "templates/app", meta: template });

  const errors: string[] = [];
  for (const { dir, meta } of targets) {
    const dist = join(root, dir, "dist");
    if (!existsSync(dist)) {
      errors.push(`${dir}: no dist/ (run pnpm build first)`);
      continue;
    }
    const pages = htmlFiles(dist);
    if (pages.length === 0) errors.push(`${dir}: dist/ contains no HTML pages`);
    for (const page of pages) {
      for (const problem of checkBuiltPage(meta, readFileSync(page, "utf8"))) {
        errors.push(`${page.slice(root.length + 1)}: ${problem}`);
      }
    }
  }
  return errors;
}
