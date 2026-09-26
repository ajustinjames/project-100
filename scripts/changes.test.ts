import { describe, expect, it } from "vitest";
import type { AppMeta } from "../packages/registry/src/index.ts";
import { ownerGatedReasons, transitionErrors } from "./lib/changes.ts";

function app(overrides: Partial<AppMeta>): AppMeta {
  return {
    schemaVersion: 1,
    id: 1,
    slug: "tide-table",
    name: "Tide Table",
    status: "labs",
    description: "Shows tides.",
    problem: "Tides are hard to read.",
    category: "outdoors",
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

describe("transitionErrors", () => {
  it("allows normal lifecycle moves", () => {
    expect(transitionErrors([app({})], [app({ status: "live" })])).toEqual([]);
    expect(transitionErrors([app({ status: "live" })], [app({ status: "archived" })])).toEqual([]);
  });

  it("rejects deleting entries, changing ids, and illegal transitions", () => {
    expect(transitionErrors([app({})], []).join()).toContain("permanent history");
    expect(transitionErrors([app({})], [app({ id: 2 })]).join()).toContain("id 1 is permanent");
    expect(
      transitionErrors([app({ status: "live" })], [app({ status: "rejected" })]).join(),
    ).toContain("not an allowed transition");
  });

  it("rejects new ids that reuse or undercut the base branch", () => {
    const base = [app({ id: 3, slug: "a" })];
    const head = [app({ id: 3, slug: "a" }), app({ id: 2, slug: "b" })];
    expect(transitionErrors(base, head).join()).toContain("must be greater than 3");
  });
});

describe("ownerGatedReasons", () => {
  it("lets agents merge ordinary Labs work", () => {
    expect(
      ownerGatedReasons(
        [app({})],
        [app({ name: "Tide Table 2" })],
        ["apps/tide-table/src/main.ts"],
      ),
    ).toEqual([]);
  });

  it("flags launches, approvals, monetization, and protected paths", () => {
    const reasons = ownerGatedReasons(
      [app({})],
      [
        app({
          status: "live",
          monetization: { eligible: true },
          approvals: [
            {
              kind: "launch",
              date: "2026-10-01",
              ref: "https://github.com/ajustinjames/project-100/issues/2",
            },
          ],
        }),
      ],
      [".github/workflows/ci.yml", "docs/AI_ROLES.md", "apps/tide-table/wrangler.jsonc"],
    ).join("\n");
    expect(reasons).toContain('status becomes "live"');
    expect(reasons).toContain("approvals change");
    expect(reasons).toContain("monetization");
    expect(reasons).toContain(".github/workflows/ci.yml");
    expect(reasons).toContain("docs/AI_ROLES.md");
    expect(reasons).toContain("wrangler.jsonc");
  });
});
