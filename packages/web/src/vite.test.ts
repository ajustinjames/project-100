import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { project100Site, type SiteOptions } from "./vite.ts";

const PAGES: SiteOptions["pages"] = {
  "index.html": { title: "Home", description: "Home page.", indexable: true },
  "labs/index.html": { title: "Labs", description: "Labs index.", indexable: false },
};
const HOME = "<main><!-- p100:counter --><!-- p100:live-apps --></main><!-- p100:footer -->";
const LABS = "<main><!-- p100:labs-apps --></main><!-- p100:footer -->";

let repoRoot: string;

function writeJson(path: string, value: unknown): void {
  mkdirSync(join(repoRoot, path, ".."), { recursive: true });
  writeFileSync(join(repoRoot, path), JSON.stringify(value));
}

/** A valid Labs app on disk. (A live fixture would need an owner approval, so none is used.) */
function addLabsApp(slug: string, name: string): void {
  writeJson(`apps/${slug}/app.json`, {
    schemaVersion: 1,
    id: 1,
    slug,
    name,
    status: "labs",
    description: `About ${name}.`,
    problem: "A problem.",
    category: "test",
    dates: { created: "2026-09-01", launched: null, archived: null },
    design: { system: "hardline" },
    dependencies: [],
    sharedPackages: ["@project-100/web"],
    privacy: "none",
    analytics: "standard",
    monetization: { eligible: false },
    approvals: [],
    rejection: null,
  });
  writeJson(`apps/${slug}/package.json`, {
    name: `@project-100/app-${slug}`,
    private: true,
    scripts: { build: "vite build", typecheck: "tsc -p ." },
    dependencies: { "@ajustinjames/hardline-tokens": "^0.1.0" },
    devDependencies: { "@project-100/web": "workspace:*" },
  });
}

/** Runs the plugin's hooks the way Vite would, for one page. */
function transform(file: string, html: string): string {
  const plugin = project100Site({ repoRoot, pages: PAGES });
  const siteRoot = join(repoRoot, "site");
  (plugin.config as (c: object) => unknown)({ root: siteRoot });
  const result = (plugin.transformIndexHtml as (h: string, c: object) => { html: string })(html, {
    filename: join(siteRoot, file),
  });
  return result.html;
}

beforeEach(() => {
  repoRoot = mkdtempSync(join(tmpdir(), "p100-web-"));
});

afterEach(() => rmSync(repoRoot, { recursive: true }));

describe("project100Site", () => {
  it("renders an honest empty state for an empty registry", () => {
    const home = transform("index.html", HOME);
    expect(home).toContain("<strong>0</strong> of 100 apps live");
    expect(home).toContain("No apps are live yet.");
    expect(home).toContain("data-p100-footer");
    expect(transform("labs/index.html", LABS)).toContain("Nothing is in Labs right now.");
  });

  it("lists Labs apps only on the Labs index, never on the home page", () => {
    addLabsApp("tide-table", "Tide Table");
    const home = transform("index.html", HOME);
    expect(home).toContain("<strong>0</strong> of 100 apps live");
    expect(home).not.toContain("tide-table");
    expect(transform("labs/index.html", LABS)).toContain(
      '<a href="/labs/tide-table/">Tide Table</a>',
    );
  });

  it("refuses an invalid registry, unknown pages, and indexable Labs listings", () => {
    writeJson("apps/broken/app.json", { slug: "broken" });
    expect(() => transform("index.html", HOME)).toThrow("registry is invalid");
    rmSync(join(repoRoot, "apps/broken"), { recursive: true });
    expect(() => transform("other.html", HOME)).toThrow("add this page");
    expect(() => transform("index.html", `${HOME}${LABS}`)).toThrow("must not be indexable");
  });
});
