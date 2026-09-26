import type { AppMeta } from "@project-100/registry";
import { describe, expect, it } from "vitest";
import { renderAppList, renderCounter } from "./directory.ts";
import { CONTENT_SECURITY_POLICY, renderHeaders } from "./headers.ts";
import { pageHeadTags, renderSiteFooter, renderTags, renderTombstone } from "./html.ts";
import { graceEnds, publications } from "./publish.ts";
import { appPath } from "./site.ts";

function app(slug: string, overrides: Partial<AppMeta> = {}): AppMeta {
  return {
    schemaVersion: 1,
    id: 1,
    slug,
    name: slug,
    status: "labs",
    description: `About ${slug}.`,
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
    ...overrides,
  };
}

const archivedDates = { created: "2026-01-01", launched: "2026-02-01", archived: "2026-06-01" };

describe("publications", () => {
  it("publishes live apps publicly and Labs apps under /labs/ only", () => {
    const result = publications(
      [
        app("shown", { status: "live" }),
        app("hidden", { status: "labs" }),
        app("idea", { status: "candidate", id: null }),
        app("dropped", { status: "rejected" }),
      ],
      "2026-09-26",
    );
    expect(result.map((p) => [p.kind, p.path])).toEqual([
      ["app", "/shown/"],
      ["app", "/labs/hidden/"],
    ]);
  });

  it("keeps archived apps with local data online for the grace period, then tombstones them", () => {
    const keeps = app("keeps-data", {
      status: "archived",
      privacy: "local-only",
      dates: archivedDates,
    });
    const stateless = app("stateless", {
      status: "archived",
      privacy: "none",
      dates: archivedDates,
    });
    expect(graceEnds(keeps)).toBe("2026-08-30");
    expect(graceEnds(stateless)).toBeNull();

    const during = publications([keeps, stateless], "2026-08-29");
    expect(during.map((p) => [p.kind, p.path])).toEqual([["app", "/keeps-data/"]]);
    const after = publications([keeps, stateless], "2026-08-30");
    expect(after.map((p) => [p.kind, p.path])).toEqual([["tombstone", "/keeps-data/"]]);
  });

  it("keeps archived apps at their public path", () => {
    expect(appPath({ slug: "old", status: "archived" })).toBe("/old/");
  });
});

describe("directory", () => {
  it("counts live apps against the target", () => {
    expect(renderCounter(0)).toContain("<strong>0</strong> of 100 apps live");
    expect(renderCounter(1)).toContain("of 100 app live");
  });

  it("lists apps by name with escaped text, or an honest empty state", () => {
    const html = renderAppList(
      [
        app("zeta", { name: "Zeta", status: "live" }),
        app("alpha", { name: "A <b>", status: "live" }),
      ],
      "Nothing yet.",
    );
    expect(html.indexOf("/alpha/")).toBeLessThan(html.indexOf("/zeta/"));
    expect(html).toContain("A &lt;b&gt;");
    expect(renderAppList([], "Nothing <yet>.")).toBe(
      '<p class="p100-empty">Nothing &lt;yet&gt;.</p>',
    );
  });
});

describe("site pages", () => {
  const home = { title: "Home", description: "D", path: "/", indexable: true, analytics: true };

  it("gives the home page a canonical URL and production-only analytics", () => {
    const head = renderTags(
      pageHeadTags(home, { origin: "https://example.com", analyticsToken: "t" }),
    );
    expect(head).toContain('<link rel="canonical" href="https://example.com/">');
    expect(head).toContain("beacon");
    const local = renderTags(
      pageHeadTags(home, { origin: "https://example.com", analyticsToken: null }),
    );
    expect(local).not.toContain("beacon");
  });

  it("keeps non-indexable pages noindex and free of analytics", () => {
    const labs = { ...home, path: "/labs/", indexable: false };
    const head = renderTags(
      pageHeadTags(labs, { origin: "https://example.com", analyticsToken: "t" }),
    );
    expect(head).toContain("noindex, nofollow");
    expect(head).not.toContain("beacon");
    expect(head).not.toContain("canonical");
  });

  it("discloses AI involvement on site pages and tombstones", () => {
    expect(renderSiteFooter()).toContain("primarily by AI under human oversight");
    const tombstone = renderTombstone(app("old", { name: "Old & Gone", dates: archivedDates }));
    expect(tombstone).toContain("<title>Old &amp; Gone (Archived)</title>");
    expect(tombstone).toContain("noindex, nofollow");
    expect(tombstone).toContain("data-p100-footer");
    expect(tombstone).toContain("/apps/old/RETRO.md");
  });
});

describe("renderHeaders", () => {
  const headers = renderHeaders();

  it("sends the security baseline everywhere", () => {
    expect(headers).toMatch(/^\/\*\n {2}Content-Security-Policy: default-src 'self';/);
    expect(headers).toContain("X-Content-Type-Options: nosniff");
    expect(headers).toContain("Referrer-Policy: strict-origin-when-cross-origin");
    expect(headers).toContain("Permissions-Policy: accelerometer=()");
  });

  it("never allows inline or third-party scripts beyond the analytics beacon", () => {
    expect(CONTENT_SECURITY_POLICY).toContain(
      "script-src 'self' https://static.cloudflareinsights.com;",
    );
    // ajj-design needs inline style attributes; <style> elements and scripts stay strict.
    expect(CONTENT_SECURITY_POLICY).toContain("style-src 'self';");
    expect(CONTENT_SECURITY_POLICY.match(/unsafe-inline/g)).toHaveLength(1);
    expect(CONTENT_SECURITY_POLICY).toContain("style-src-attr 'unsafe-inline'");
  });

  it("marks Labs and Cloudflare preview hosts noindex, never the custom domain", () => {
    expect(headers).toContain("/labs/*\n  X-Robots-Tag: noindex");
    expect(headers).toContain("https://:version.:project.pages.dev/*\n  X-Robots-Tag: noindex");
    expect(headers).not.toContain("hundred.ajustinjames.com");
    expect(headers).not.toMatch(/^\/\*\n(?: {2}.*\n)* {2}X-Robots-Tag/);
  });
});
