import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadRegistry, validateRegistry } from "../packages/registry/src/index.ts";
import { createCandidate, promoteCandidate } from "./lib/scaffold.ts";

const templatesDir = join(import.meta.dirname, "..", "templates");
let root: string;
let options: { root: string; templatesDir: string; today: string };

function allFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? allFiles(join(dir, e.name)) : [join(dir, e.name)],
  );
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "p100-"));
  mkdirSync(join(root, "apps"));
  mkdirSync(join(root, "candidates"));
  options = { root, templatesDir, today: "2026-09-26" };
});

afterEach(() => rmSync(root, { recursive: true }));

describe("scaffolding", () => {
  it("creates a candidate that fails validation until TODOs are filled in", () => {
    createCandidate(options, "tide-table", "Tide Table");
    const { entries } = loadRegistry(root);
    expect(entries[0]?.meta.status).toBe("candidate");
    expect(validateRegistry(entries).join()).toContain("TODO");
    expect(() => createCandidate(options, "tide-table", "Again")).toThrow("already exists");
  });

  it("promotes a candidate into a valid Labs app with the next id", () => {
    const dir = createCandidate(options, "tide-table", "Tide Table");
    const metaFile = join(dir, "app.json");
    const meta = JSON.parse(readFileSync(metaFile, "utf8"));
    writeFileSync(
      metaFile,
      JSON.stringify({ ...meta, description: "Shows tides.", problem: "Tides are hard to read." }),
    );

    const appDir = promoteCandidate(options, "tide-table");
    const { entries, errors } = loadRegistry(root);
    expect(errors).toEqual([]);
    expect(validateRegistry(entries)).toEqual([]);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.meta).toMatchObject({ id: 1, status: "labs", slug: "tide-table" });

    for (const file of allFiles(appDir)) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toContain("app-template");
      expect(text, file).not.toContain("App Template");
    }
  });
});
