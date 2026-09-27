// Creates candidates and promotes them into Labs apps from the templates/ directory.
// See docs/LIFECYCLE.md for when each step is allowed.

import {
  closeSync,
  cpSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  type AppMeta,
  loadRegistry,
  nextId,
  type PackageJson,
  PRIVACY_CLASSIFICATION,
  SCHEMA_VERSION,
  slugProblem,
  validateEntry,
} from "../../packages/registry/src/index.ts";

/** Strings in templates/ that are replaced with the real slug and name. */
const TEMPLATE_SLUG = "app-template";
const TEMPLATE_NAME = "App Template";

export interface ScaffoldOptions {
  /** Repository root (contains apps/ and candidates/). */
  root: string;
  /** Directory containing app/ and candidate/ templates. */
  templatesDir: string;
  /** Today's date as YYYY-MM-DD. */
  today: string;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function writeJson(file: string, value: unknown): void {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Plain-text replacement (split/join, so "$" in names is never special). */
function fillText(text: string, slug: string, name: string): string {
  return text.split(TEMPLATE_SLUG).join(slug).split(TEMPLATE_NAME).join(name);
}

function assertValidSlug(slug: string): void {
  const problem = slugProblem(slug);
  if (problem) throw new Error(problem);
}

function assertValidName(name: string): void {
  if (name.trim() === "" || name.length > 60 || /[\r\n]/.test(name))
    throw new Error("name must be one line, 1-60 characters");
}

/** Runs fn while holding .p100.lock, so two local commands never assign the same id at once. */
function withLock<T>(root: string, fn: () => T): T {
  const lock = join(root, ".p100.lock");
  let fd: number;
  try {
    fd = openSync(lock, "wx");
  } catch {
    throw new Error("another p100 command is running (delete .p100.lock if it is stale)");
  }
  try {
    return fn();
  } finally {
    closeSync(fd);
    unlinkSync(lock);
  }
}

/** Creates candidates/<slug>/ with app.json and PROPOSAL.md. Returns the new directory. */
export function createCandidate(options: ScaffoldOptions, slug: string, name: string): string {
  const { root, templatesDir, today } = options;
  assertValidSlug(slug);
  assertValidName(name);
  if (existsSync(join(root, "apps", slug))) throw new Error(`apps/${slug} already exists`);
  mkdirSync(join(root, "candidates"), { recursive: true });
  const dir = join(root, "candidates", slug);
  try {
    mkdirSync(dir); // fails if it already exists
  } catch {
    throw new Error(`candidates/${slug} already exists`);
  }

  const meta: AppMeta = {
    schemaVersion: SCHEMA_VERSION,
    id: null,
    slug,
    name,
    status: "candidate",
    description: "TODO: one sentence describing what it does for the person using it.",
    problem: "TODO: the problem, in plain language.",
    category: "uncategorized",
    dates: { created: today, launched: null, archived: null },
    design: { system: null },
    dependencies: [],
    sharedPackages: [],
    privacy: "none",
    analytics: "standard",
    monetization: { eligible: false },
    approvals: [],
    rejection: null,
  };
  writeJson(join(dir, "app.json"), meta);
  const proposal = readFileSync(join(templatesDir, "candidate", "PROPOSAL.md"), "utf8");
  writeFileSync(join(dir, "PROPOSAL.md"), fillText(proposal, slug, name));
  return dir;
}

/**
 * Moves candidates/<slug>/ to apps/<slug>/ as a Labs app built from templates/app.
 * Builds the app in a staging directory and only moves it into place once it validates,
 * so a failure never leaves a half-promoted candidate.
 */
export function promoteCandidate(options: ScaffoldOptions, slug: string): string {
  const { root, templatesDir } = options;
  assertValidSlug(slug);
  return withLock(root, () => {
    const from = join(root, "candidates", slug);
    const to = join(root, "apps", slug);
    if (!existsSync(join(from, "app.json")))
      throw new Error(`candidates/${slug}/app.json not found`);
    if (existsSync(to)) throw new Error(`apps/${slug} already exists`);

    const candidate = readJson<AppMeta>(join(from, "app.json"));
    if (candidate.status !== "candidate")
      throw new Error(
        `candidates/${slug} is "${candidate.status}"; only candidates can be promoted`,
      );
    assertValidName(candidate.name);

    // Every candidate file except app.json is carried over. Refuse rather than overwrite.
    const carried = readdirSync(from).filter((f) => f !== "app.json");
    const templateFiles = readdirSync(join(templatesDir, "app"));
    const clashes = carried.filter((f) => templateFiles.includes(f));
    if (clashes.length > 0)
      throw new Error(`candidate files clash with the app template: ${clashes.join(", ")}`);

    const staging = join(root, "apps", `.${slug}.staging`);
    rmSync(staging, { recursive: true, force: true });
    try {
      cpSync(join(templatesDir, "app"), staging, {
        recursive: true,
        filter: (src) => !/[\\/](node_modules|dist)$/.test(src),
      });
      fillTemplatesInDir(staging, slug, candidate.name);

      const pkg = readJson<PackageJson>(join(staging, "package.json"));
      pkg.name = `@project-100/app-${slug}`;
      writeJson(join(staging, "package.json"), pkg);

      const template = readJson<AppMeta>(join(staging, "app.json"));
      const meta: AppMeta = {
        ...template,
        id: nextId(loadRegistry(root).entries),
        slug,
        name: candidate.name,
        status: "labs",
        description: candidate.description,
        problem: candidate.problem,
        category: candidate.category,
        dates: { ...candidate.dates },
        privacy: candidate.privacy,
        analytics: candidate.analytics,
        approvals: candidate.approvals,
      };
      writeJson(join(staging, "app.json"), meta);
      for (const file of carried)
        cpSync(join(from, file), join(staging, file), { recursive: true });

      // The template's PRIVACY.md is written for "none". State the real class here.
      const privacyDoc = readFileSync(join(staging, "PRIVACY.md"), "utf8").replace(
        PRIVACY_CLASSIFICATION,
        `**Classification:** \`${meta.privacy}\``,
      );
      writeFileSync(join(staging, "PRIVACY.md"), privacyDoc);

      const errors = validateEntry({
        dir: `apps/${slug}`,
        location: "apps",
        meta,
        packageJson: pkg,
        retro: readFileSync(join(staging, "RETRO.md"), "utf8"),
        privacyDoc,
      });
      if (errors.length > 0) throw new Error(`promotion would be invalid:\n${errors.join("\n")}`);

      renameSync(staging, to);
    } catch (error) {
      rmSync(staging, { recursive: true, force: true });
      throw error;
    }
    rmSync(from, { recursive: true });
    return to;
  });
}

/** Fills slug and name into every text file except JSON (JSON is edited structurally). */
function fillTemplatesInDir(dir: string, slug: string, name: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      fillTemplatesInDir(path, slug, name);
    } else if (!entry.name.endsWith(".json")) {
      const displayName = entry.name.endsWith(".html") ? escapeHtml(name) : name;
      writeFileSync(path, fillText(readFileSync(path, "utf8"), slug, displayName));
    }
  }
}
