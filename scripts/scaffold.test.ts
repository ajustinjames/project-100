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

/** Replaces the TODO placeholders a new candidate starts with. */
function fillIn(candidateDir: string): void {
  const file = join(candidateDir, "app.json");
  const meta = JSON.parse(readFileSync(file, "utf8"));
  const filled = { ...meta, description: "Shows tides.", problem: "Tides are hard to read." };
  writeFileSync(file, JSON.stringify(filled));
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
    fillIn(createCandidate(options, "tide-table", "Tide Table"));

    const appDir = promoteCandidate(options, "tide-table");
    const { entries, errors } = loadRegistry(root);
    expect(errors).toEqual([]);
    expect(validateRegistry(entries)).toEqual([]);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.meta).toMatchObject({ id: 1, status: "labs", slug: "tide-table" });
    expect(existsSync(join(root, "candidates", "tide-table"))).toBe(false);

    for (const file of allFiles(appDir)) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toContain("app-template");
      expect(text, file).not.toContain("App Template");
    }
  });

  it("handles names with quotes, markup, and $ sequences safely", () => {
    const name = 'A "quoted" <b>$&</b> name';
    fillIn(createCandidate(options, "odd-name", name));
    const appDir = promoteCandidate(options, "odd-name");
    expect(JSON.parse(readFileSync(join(appDir, "app.json"), "utf8")).name).toBe(name);
    const html = readFileSync(join(appDir, "index.html"), "utf8");
    expect(html).toContain("A &quot;quoted&quot; &lt;b&gt;$&amp;&lt;/b&gt; name");
    expect(readFileSync(join(appDir, "README.md"), "utf8")).toContain(name);
  });

  it("states the candidate's privacy class in PRIVACY.md", () => {
    const dir = createCandidate(options, "tide-table", "Tide Table");
    fillIn(dir);
    const file = join(dir, "app.json");
    const meta = JSON.parse(readFileSync(file, "utf8"));
    writeFileSync(file, JSON.stringify({ ...meta, privacy: "local-only" }));
    const appDir = promoteCandidate(options, "tide-table");
    expect(readFileSync(join(appDir, "PRIVACY.md"), "utf8")).toContain(
      "**Classification:** `local-only`",
    );
    expect(validateRegistry(loadRegistry(root).entries)).toEqual([]);
  });

  it("carries extra candidate files into the app", () => {
    const dir = createCandidate(options, "tide-table", "Tide Table");
    fillIn(dir);
    writeFileSync(join(dir, "RESEARCH.md"), "notes");
    const appDir = promoteCandidate(options, "tide-table");
    expect(readFileSync(join(appDir, "RESEARCH.md"), "utf8")).toBe("notes");
  });

  it("changes nothing when promotion fails", () => {
    const unfinished = createCandidate(options, "unfinished", "Unfinished"); // still has TODOs
    expect(() => promoteCandidate(options, "unfinished")).toThrow("TODO");
    const clashing = createCandidate(options, "clashing", "Clashing");
    fillIn(clashing);
    writeFileSync(join(clashing, "README.md"), "mine");
    expect(() => promoteCandidate(options, "clashing")).toThrow("clash");

    expect(readdirSync(join(root, "apps"))).toEqual([]);
    expect(existsSync(join(unfinished, "app.json"))).toBe(true);
    expect(existsSync(join(clashing, "README.md"))).toBe(true);
    expect(existsSync(join(root, ".p100.lock"))).toBe(false);
  });

  it("refuses to promote a personal-data candidate without the owner's approval", () => {
    const dir = createCandidate(options, "tide-table", "Tide Table");
    fillIn(dir);
    const file = join(dir, "app.json");
    const meta = JSON.parse(readFileSync(file, "utf8"));
    writeFileSync(file, JSON.stringify({ ...meta, privacy: "personal-data" }));
    expect(validateRegistry(loadRegistry(root).entries)).toEqual([]);
    expect(() => promoteCandidate(options, "tide-table")).toThrow('"personal-data" approval');
    expect(readdirSync(join(root, "apps"))).toEqual([]);
  });

  it("rejects slugs the validator would reject", () => {
    expect(() => createCandidate(options, "labs", "Labs")).toThrow("reserved");
    expect(() => createCandidate(options, "a".repeat(41), "Long")).toThrow("40 characters");
    expect(readdirSync(join(root, "candidates"))).toEqual([]);
  });

  it("refuses to run while another command holds the lock", () => {
    fillIn(createCandidate(options, "tide-table", "Tide Table"));
    writeFileSync(join(root, ".p100.lock"), "");
    expect(() => promoteCandidate(options, "tide-table")).toThrow("another p100 command");
  });
});
