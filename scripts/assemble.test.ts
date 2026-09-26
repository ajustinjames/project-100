import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppMeta } from "../packages/registry/src/index.ts";
import { assembleSite } from "./lib/assemble.ts";

// Built pages as check.ts expects them. These fixtures stand in for real Vite output.
const PUBLIC_PAGE = "<title>X</title><footer data-p100-footer></footer>";
const HIDDEN_PAGE = `<title>X</title><meta name="robots" content="noindex, nofollow"><footer data-p100-footer></footer>`;

let root: string;
let outDir: string;

function write(path: string, text: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

/** An app.json for the fixture. Assembly trusts it; validation is tested in packages/registry. */
function app(slug: string, status: AppMeta["status"], overrides: Partial<AppMeta> = {}): AppMeta {
  return {
    schemaVersion: 1,
    id: status === "candidate" ? null : 1,
    slug,
    name: slug,
    status,
    description: `About ${slug}.`,
    problem: "A problem.",
    category: "test",
    dates: { created: "2026-01-01", launched: null, archived: null },
    design: { system: "hardline" },
    dependencies: [],
    sharedPackages: ["@project-100/web"],
    privacy: "none",
    analytics: "standard",
    monetization: { eligible: false },
    approvals: [],
    rejection: null,
    ...overrides,
  };
}

function assemble(apps: AppMeta[], today = "2026-09-26"): string[] {
  return assembleSite({ root, apps, outDir, origin: "https://example.com", today });
}

const read = (path: string) => readFileSync(join(outDir, path), "utf8");
const archivedDates = { created: "2026-01-01", launched: "2026-02-01", archived: "2026-06-01" };

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "p100-site-"));
  outDir = join(root, "dist");
  write("site/dist/index.html", PUBLIC_PAGE);
  write("site/dist/labs/index.html", HIDDEN_PAGE);
  write("site/dist/404.html", HIDDEN_PAGE);
  write("site/dist/assets/style.css", "");
});

afterEach(() => rmSync(root, { recursive: true }));

describe("assembleSite", () => {
  it("publishes the site pages and nothing else from an empty registry", () => {
    expect(assemble([])).toEqual(["/"]);
    expect(readdirSync(outDir).sort()).toEqual([
      "404.html",
      "_headers",
      "assets",
      "index.html",
      "labs",
      "robots.txt",
      "sitemap.xml",
    ]);
    expect(readdirSync(join(outDir, "labs"))).toEqual(["index.html"]);
    expect(read("sitemap.xml")).toContain("<loc>https://example.com/</loc>");
    expect(read("sitemap.xml").match(/<loc>/g)).toHaveLength(1);
    expect(read("robots.txt")).toContain("Sitemap: https://example.com/sitemap.xml");
    expect(read("_headers")).toContain("Content-Security-Policy");
  });

  it("puts each app at the path its status decides, and hides Labs", () => {
    const apps = [
      app("shown", "live"),
      app("hidden", "labs"),
      app("idea", "candidate"),
      app("dropped", "rejected"),
      app("retired", "archived", { dates: archivedDates }),
    ];
    write("apps/shown/dist/index.html", PUBLIC_PAGE);
    write("apps/shown/dist/assets/app.js", "");
    write("apps/hidden/dist/index.html", HIDDEN_PAGE);
    // Leftover builds of unpublished apps and the template must never be copied.
    write("apps/dropped/dist/index.html", HIDDEN_PAGE);
    write("apps/retired/dist/index.html", HIDDEN_PAGE);
    write("templates/app/dist/index.html", HIDDEN_PAGE);

    expect(assemble(apps)).toEqual(["/", "/shown/", "/labs/hidden/"]);
    expect(existsSync(join(outDir, "shown/index.html"))).toBe(true);
    expect(existsSync(join(outDir, "shown/assets/app.js"))).toBe(true);
    expect(existsSync(join(outDir, "labs/hidden/index.html"))).toBe(true);
    expect(existsSync(join(outDir, "hidden"))).toBe(false);
    for (const gone of ["idea", "dropped", "retired", "app-template", "labs/dropped"])
      expect(existsSync(join(outDir, gone)), gone).toBe(false);

    expect(read("sitemap.xml")).toContain("<loc>https://example.com/shown/</loc>");
    expect(read("sitemap.xml")).not.toContain("hidden");
    expect(read("robots.txt")).not.toContain("labs");
    expect(read("_headers")).toContain("/labs/*\n  X-Robots-Tag: noindex");
  });

  it("serves archived apps with local data during the grace period, then a tombstone", () => {
    const keeps = app("keeps-data", "archived", { privacy: "local-only", dates: archivedDates });
    write("apps/keeps-data/dist/index.html", HIDDEN_PAGE);

    expect(assemble([keeps], "2026-08-29")).toEqual(["/", "/keeps-data/"]);
    expect(read("keeps-data/index.html")).toBe(HIDDEN_PAGE);
    expect(read("sitemap.xml")).not.toContain("keeps-data");

    expect(assemble([keeps], "2026-08-30")).toEqual(["/", "/keeps-data/"]);
    expect(read("keeps-data/index.html")).toContain("keeps-data has been archived");
    expect(read("keeps-data/index.html")).toContain("noindex, nofollow");
  });

  it("removes stale output from earlier builds", () => {
    write("dist/old-app/index.html", PUBLIC_PAGE);
    write("dist/labs/old-lab/index.html", HIDDEN_PAGE);
    write("dist/stray.txt", "");
    assemble([]);
    expect(existsSync(join(outDir, "old-app"))).toBe(false);
    expect(existsSync(join(outDir, "labs/old-lab"))).toBe(false);
    expect(existsSync(join(outDir, "stray.txt"))).toBe(false);
  });

  it("fails before writing anything if a published page breaks the web standards", () => {
    write("dist/previous.txt", "");
    // A Labs page without noindex, e.g. built from the wrong status.
    write("apps/leaky/dist/index.html", PUBLIC_PAGE);
    expect(() => assemble([app("leaky", "labs")])).toThrow("noindex");
    // A live app whose build predates its launch.
    write("apps/stale/dist/index.html", HIDDEN_PAGE);
    expect(() => assemble([app("stale", "live")])).toThrow("live page is marked noindex");
    // The Labs index must never be indexable.
    write("site/dist/labs/index.html", PUBLIC_PAGE);
    expect(() => assemble([])).toThrow(
      "site/dist/labs/index.html: non-live page is missing noindex",
    );
    expect(existsSync(join(outDir, "previous.txt"))).toBe(true);
  });

  it("fails if a published app was not built", () => {
    expect(() => assemble([app("unbuilt", "labs")])).toThrow("apps/unbuilt/dist not found");
  });
});
