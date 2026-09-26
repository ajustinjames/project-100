import { describe, expect, it } from "vitest";
import { type AppMeta, RETRO_INCOMPLETE_MARKER } from "./schema.ts";
import { type RegistryEntry, validateEntry, validateRegistry } from "./validate.ts";

function labsEntry(overrides: Partial<AppMeta> = {}): RegistryEntry {
  const slug = overrides.slug ?? "tide-table";
  return {
    dir: `apps/${slug}`,
    location: "apps",
    meta: {
      schemaVersion: 1,
      id: 1,
      slug,
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
    },
    packageJson: {
      name: `@project-100/app-${slug}`,
      private: true,
      scripts: { build: "vite build", typecheck: "tsc -p ." },
      dependencies: { "@ajustinjames/hardline-components": "^0.1.0" },
      devDependencies: { "@project-100/web": "workspace:*", vite: "^8.0.0" },
    },
    retro: `# Retro\n${RETRO_INCOMPLETE_MARKER}\n`,
  };
}

const launch = {
  kind: "launch" as const,
  date: "2026-09-10",
  ref: "https://github.com/ajustinjames/project-100/issues/1",
};
const completeRetro = `# Retro\n\n## What was learned\n\n${"A real sentence about the app. ".repeat(5)}\n`;

describe("validateEntry", () => {
  it("accepts a well-formed Labs app", () => {
    expect(validateEntry(labsEntry())).toEqual([]);
  });

  it("rejects unknown fields and bad shapes", () => {
    const entry = labsEntry();
    (entry.meta as unknown as Record<string, unknown>).extra = true;
    entry.meta.slug = "Not A Slug";
    const errors = validateEntry(entry).join("\n");
    expect(errors).toContain('unknown field "extra"');
    expect(errors).toContain("must be lowercase kebab-case");
  });

  it("rejects leftover TODO placeholders", () => {
    expect(validateEntry(labsEntry({ problem: "TODO: fill in" })).join()).toContain("TODO");
  });

  it("requires owner launch approval to be live", () => {
    const live = labsEntry({
      status: "live",
      dates: { created: "2026-09-01", launched: "2026-09-10", archived: null },
    });
    expect(validateEntry(live).join()).toContain('"launch" approval');
    live.meta.approvals = [launch];
    expect(validateEntry(live)).toEqual([]);
  });

  it("requires a completed retrospective and archive approval to archive", () => {
    const archived = labsEntry({
      status: "archived",
      dates: { created: "2026-09-01", launched: "2026-09-10", archived: "2026-12-01" },
      approvals: [launch],
    });
    const errors = validateEntry(archived).join("\n");
    expect(errors).toContain('"archive" approval');
    expect(errors).toContain("completed RETRO.md");
    archived.meta.approvals.push({ ...launch, kind: "archive", date: "2026-12-01" });
    archived.retro = "# Retro\n\n## What was learned\n\n<!-- fill in -->\n";
    expect(validateEntry(archived).join()).toContain("completed RETRO.md");
    archived.retro = completeRetro;
    expect(validateEntry(archived)).toEqual([]);
  });

  it("requires a fresh launch approval to relaunch a revived app", () => {
    const relaunched = labsEntry({
      status: "live",
      dates: { created: "2026-09-01", launched: "2026-09-10", archived: null },
      approvals: [launch, { ...launch, kind: "archive", date: "2026-12-01" }],
    });
    expect(validateEntry(relaunched).join()).toContain('new "launch" approval');
    relaunched.meta.approvals.push({ ...launch, date: "2027-02-01" });
    expect(validateEntry(relaunched)).toEqual([]);
  });

  it("requires approval refs to link into this repository", () => {
    const entry = labsEntry({ approvals: [{ ...launch, kind: "external-api", ref: "trust me" }] });
    expect(validateEntry(entry).join()).toContain("ref");
  });

  it("requires a retrospective for discarded Labs apps", () => {
    const discarded = labsEntry({
      status: "rejected",
      rejection: { date: "2026-10-01", reason: "Not useful enough." },
    });
    expect(validateEntry(discarded).join()).toContain("discarded Labs apps");
    discarded.retro = completeRetro;
    expect(validateEntry(discarded)).toEqual([]);
  });

  it("requires Labs and live apps to use the project web standards and build scripts", () => {
    const entry = labsEntry({ sharedPackages: [] });
    entry.packageJson = { ...entry.packageJson, devDependencies: {}, scripts: {} };
    const errors = validateEntry(entry).join("\n");
    expect(errors).toContain("@project-100/web");
    expect(errors).toContain('"build" script');
  });

  it("rejects reserved slugs", () => {
    expect(validateEntry(labsEntry({ slug: "labs" })).join()).toContain("reserved");
  });

  it("never allows Labs to be monetized", () => {
    expect(validateEntry(labsEntry({ monetization: { eligible: true } })).join()).toContain(
      "monetization",
    );
  });

  it("requires approval for personal data before an app enters apps/", () => {
    expect(validateEntry(labsEntry({ privacy: "personal-data" })).join()).toContain(
      '"personal-data" approval',
    );
    const candidate = labsEntry({
      status: "candidate",
      id: null,
      design: { system: null },
      privacy: "personal-data",
    });
    candidate.location = "candidates";
    candidate.dir = "candidates/tide-table";
    candidate.packageJson = null;
    expect(validateEntry(candidate)).toEqual([]);
  });

  it("keeps app.json in sync with package.json", () => {
    const entry = labsEntry({ dependencies: [], sharedPackages: [] });
    entry.packageJson = {
      name: "wrong",
      private: true,
      dependencies: { "@ajustinjames/glassline-components": "^0.1.0", "date-fns": "^4.0.0" },
      optionalDependencies: { "@ajustinjames/other-thing": "^1.0.0" },
    };
    const errors = validateEntry(entry).join("\n");
    expect(errors).toContain('name must be "@project-100/app-tide-table"');
    expect(errors).toContain("@ajustinjames/hardline-tokens or @ajustinjames/hardline-components");
    expect(errors).toContain(
      "[@ajustinjames/glassline-components, date-fns, @ajustinjames/other-thing]",
    );
  });

  it("keeps candidates in candidates/ without ids", () => {
    const entry = labsEntry({ status: "candidate" });
    expect(validateEntry(entry).join()).toContain("candidates belong in candidates/");
    entry.location = "candidates";
    entry.dir = "candidates/tide-table";
    expect(validateEntry(entry).join()).toContain("do not have an id");
  });
});

describe("validateRegistry", () => {
  it("rejects duplicate ids and slugs", () => {
    const a = labsEntry({ slug: "one" });
    const b = labsEntry({ slug: "two" });
    const c = labsEntry({ slug: "one", id: 3 });
    const errors = validateRegistry([a, b, c]).join("\n");
    expect(errors).toContain("id 1 is already used");
    expect(errors).toContain('slug "one" is already used');
  });
});
