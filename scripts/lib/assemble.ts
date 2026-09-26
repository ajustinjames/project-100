// Assembles the deployable site from already-built output (run `pnpm build` first):
//   site/dist/          → /            (home page, Labs index, 404)
//   apps/<slug>/dist/   → /<slug>/ or /labs/<slug>/, as decided by publications()
// plus sitemap.xml, robots.txt, and _headers. The output folder is deleted and rebuilt every
// time, so nothing stale survives. See docs/CLOUDFLARE.md#deploys-cloudflare-git-integration.

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { AppMeta, Status } from "../../packages/registry/src/index.ts";
import { checkBuiltPage } from "../../packages/web/src/check.ts";
import { renderHeaders } from "../../packages/web/src/headers.ts";
import { renderTombstone } from "../../packages/web/src/html.ts";
import { publications } from "../../packages/web/src/publish.ts";
import { renderRobots, renderSitemap } from "../../packages/web/src/sitemap.ts";

export interface AssembleOptions {
  /** Repository root (contains apps/ and site/). */
  root: string;
  /** Every registry entry's app.json, already validated (see scripts/assemble-site.ts). */
  apps: AppMeta[];
  /** Output folder. Deleted and recreated. */
  outDir: string;
  /** Public site origin, without trailing slash. */
  origin: string;
  /** Today's date as YYYY-MM-DD (decides archive grace periods). */
  today: string;
}

/** Every file under `dir`, as paths relative to it with "/" separators. */
function filesIn(dir: string, prefix = ""): string[] {
  return readdirSync(join(dir, prefix), { withFileTypes: true }).flatMap((e) => {
    const path = prefix ? `${prefix}/${e.name}` : e.name;
    return e.isDirectory() ? filesIn(dir, path) : [path];
  });
}

/**
 * Throws if `dir` lacks any of the `required` pages, or if any HTML page in it breaks the web
 * standards for its status (see check.ts).
 */
function checkPages(
  dir: string,
  label: string,
  required: string[],
  statusOf: (page: string) => Status,
): void {
  if (!existsSync(dir)) throw new Error(`${label} not found (run pnpm build first)`);
  for (const page of required) {
    if (!existsSync(join(dir, page))) throw new Error(`${label}/${page} not found`);
  }
  const pages = filesIn(dir).filter((f) => f.endsWith(".html"));
  const problems = pages.flatMap((page) =>
    checkBuiltPage({ status: statusOf(page) }, readFileSync(join(dir, page), "utf8")).map(
      (problem) => `${label}/${page}: ${problem}`,
    ),
  );
  if (problems.length > 0) throw new Error(problems.join("\n"));
}

/**
 * The site's own pages. 404.html matters: without it, Cloudflare Pages would answer every unknown
 * path with the home page.
 */
const SITE_PAGES = ["index.html", "labs/index.html", "404.html"];

/** Builds outDir from the built site and apps. Returns the published URL paths, for logging. */
export function assembleSite(options: AssembleOptions): string[] {
  const { root, apps, outDir, origin, today } = options;
  const siteDist = join(root, "site", "dist");
  const toPublish = publications(apps, today);

  // 1. Check every input first. The home page is public, so it is checked like a live page.
  //    Other site pages (the Labs index, 404) are checked like Labs: noindex, no analytics.
  //    App pages are checked against their own status.
  checkPages(siteDist, "site/dist", SITE_PAGES, (page) =>
    page === "index.html" ? "live" : "labs",
  );
  for (const { kind, meta } of toPublish) {
    if (kind === "app")
      checkPages(
        join(root, "apps", meta.slug, "dist"),
        `apps/${meta.slug}/dist`,
        ["index.html"],
        () => meta.status,
      );
  }

  // 2. Assemble into an empty staging folder, and replace outDir only once everything is written.
  //    Nothing from an earlier build survives, and a failure never leaves a half-built outDir.
  const staging = `${outDir}.staging`;
  rmSync(staging, { recursive: true, force: true });
  const published = ["/"];
  try {
    cpSync(siteDist, staging, { recursive: true });
    for (const { kind, meta, path } of toPublish) {
      const target = join(staging, path);
      if (existsSync(target)) throw new Error(`${path} is already taken by a site file`);
      if (kind === "tombstone") {
        mkdirSync(target, { recursive: true });
        writeFileSync(join(target, "index.html"), renderTombstone(meta));
      } else {
        cpSync(join(root, "apps", meta.slug, "dist"), target, { recursive: true });
      }
      published.push(path);
    }
    writeFileSync(join(staging, "sitemap.xml"), renderSitemap(apps, origin));
    writeFileSync(join(staging, "robots.txt"), renderRobots(origin));
    writeFileSync(join(staging, "_headers"), renderHeaders());
  } catch (error) {
    rmSync(staging, { recursive: true, force: true });
    throw error;
  }
  rmSync(outDir, { recursive: true, force: true });
  renameSync(staging, outDir);
  return published;
}
