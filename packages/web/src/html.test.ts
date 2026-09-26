import { describe, expect, it } from "vitest";
import { AI_DISCLOSURE, renderFooter, renderHead } from "./html.ts";
import { renderRobots, renderSitemap } from "./sitemap.ts";

const app = {
  slug: "tide-table",
  name: "Tide <Table>",
  description: 'Shows "tides".',
  analytics: "standard" as const,
};
const options = { origin: "https://example.com", analyticsToken: "abc123" };

describe("renderHead", () => {
  it("marks Labs noindex and skips canonical, Open Graph, and analytics", () => {
    const head = renderHead({ ...app, status: "labs" }, options);
    expect(head).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(head).toContain("<title>Tide &lt;Table&gt; (Labs)</title>");
    expect(head).not.toContain("canonical");
    expect(head).not.toContain("og:");
    expect(head).not.toContain("cloudflareinsights");
  });

  it("gives live apps canonical, Open Graph, and the analytics beacon", () => {
    const head = renderHead({ ...app, status: "live" }, options);
    expect(head).not.toContain("noindex");
    expect(head).toContain('<link rel="canonical" href="https://example.com/tide-table/">');
    expect(head).toContain('content="Shows &quot;tides&quot;."');
    expect(head).toContain("static.cloudflareinsights.com/beacon.min.js");
  });

  it("omits analytics without a token or when the app opts out", () => {
    const live = { ...app, status: "live" as const };
    expect(renderHead(live, { ...options, analyticsToken: null })).not.toContain("beacon");
    expect(renderHead({ ...live, analytics: "none" }, options)).not.toContain("beacon");
  });
});

describe("renderFooter", () => {
  it("always discloses AI involvement and flags Labs", () => {
    const labs = renderFooter({ status: "labs" }, null);
    expect(labs).toContain(AI_DISCLOSURE);
    expect(labs).toContain("Labs prototype");
    expect(renderFooter({ status: "live" }, null)).not.toContain("Labs");
  });
});

describe("sitemap and robots", () => {
  it("lists only live apps", () => {
    const xml = renderSitemap(
      [
        { slug: "a", status: "live" },
        { slug: "b", status: "labs" },
        { slug: "c", status: "archived" },
      ],
      "https://example.com",
    );
    expect(xml).toContain("<loc>https://example.com/a/</loc>");
    expect(xml).not.toContain("/b/");
    expect(xml).not.toContain("/c/");
  });

  it("does not mention labs in robots.txt", () => {
    expect(renderRobots("https://example.com")).not.toContain("labs");
  });
});
