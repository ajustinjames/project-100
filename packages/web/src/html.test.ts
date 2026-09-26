import { describe, expect, it } from "vitest";
import { checkBuiltPage } from "./check.ts";
import { AI_DISCLOSURE, type HeadOptions, headTags, renderFooter, renderTags } from "./html.ts";
import { renderRobots, renderSitemap } from "./sitemap.ts";

const app = {
  slug: "tide-table",
  name: "Tide <Table>",
  description: 'Shows "tides".',
  analytics: "standard" as const,
};
const options = { origin: "https://example.com", analyticsToken: "abc123" };
const renderHead = (meta: Parameters<typeof headTags>[0], opts: HeadOptions) =>
  renderTags(headTags(meta, opts));

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

  it("gives each page of a multi-page app its own canonical URL", () => {
    const head = renderHead({ ...app, status: "live" }, { ...options, pagePath: "about.html" });
    expect(head).toContain('href="https://example.com/tide-table/about.html"');
  });

  it("keeps $ sequences in metadata literal", () => {
    const head = renderHead({ ...app, description: "Costs $& $1", status: "live" }, options);
    expect(head).toContain('content="Costs $&amp; $1"');
  });

  it("marks archived apps noindex at their public path", () => {
    const head = renderHead({ ...app, status: "archived" }, options);
    expect(head).toContain("<title>Tide &lt;Table&gt; (Archived)</title>");
    expect(head).toContain("noindex, nofollow");
    expect(head).not.toContain("beacon");
  });

  it("omits analytics without a token or when the app opts out", () => {
    const live = { ...app, status: "live" as const };
    expect(renderHead(live, { ...options, analyticsToken: null })).not.toContain("beacon");
    expect(renderHead({ ...live, analytics: "none" }, options)).not.toContain("beacon");
  });
});

const dataMeta = {
  privacy: "local-only" as const,
  dates: { created: "2026-09-01", launched: "2026-10-01", archived: "2026-12-01" },
};

describe("renderFooter", () => {
  it("always discloses AI involvement and flags Labs", () => {
    const labs = renderFooter({ ...dataMeta, status: "labs" }, null);
    expect(labs).toContain(AI_DISCLOSURE);
    expect(labs).toContain("Labs prototype");
    expect(renderFooter({ ...dataMeta, status: "live" }, null)).not.toContain("Labs");
  });

  it("tells people when an archived app with local data goes away", () => {
    const archived = { ...dataMeta, status: "archived" as const };
    expect(renderFooter(archived, null)).toContain("archived. It stays online until 2027-03-01");
    expect(renderFooter({ ...archived, privacy: "none" }, null)).not.toContain("stays online");
  });
});

describe("checkBuiltPage", () => {
  const good = `<title>X</title><meta name="robots" content="noindex, nofollow"><footer data-p100-footer></footer>`;

  it("accepts a compliant Labs page", () => {
    expect(checkBuiltPage({ status: "labs" }, good)).toEqual([]);
  });

  it("fails closed on missing noindex, footer, or leaked analytics", () => {
    const problems = checkBuiltPage(
      { status: "labs" },
      `<title>X</title><script src="https://static.cloudflareinsights.com/beacon.min.js"></script>`,
    ).join();
    expect(problems).toContain("noindex");
    expect(problems).toContain("footer");
    expect(problems).toContain("analytics");
  });

  it("flags a live page that is still marked noindex (a stale Labs build)", () => {
    expect(checkBuiltPage({ status: "live" }, good).join()).toContain(
      "live page is marked noindex",
    );
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
