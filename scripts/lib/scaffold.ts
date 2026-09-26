// Creates candidates and promotes them into Labs apps from the templates/ directory.
// See docs/LIFECYCLE.md for when each step is allowed.

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  type AppMeta,
  loadRegistry,
  nextId,
  SCHEMA_VERSION,
} from "../../packages/registry/src/index.ts";

/** Strings in templates/ that are replaced with the real slug and name. */
const TEMPLATE_SLUG = "app-template";
const TEMPLATE_NAME = "App Template";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface ScaffoldOptions {
  /** Repository root (contains apps/ and candidates/). */
  root: string;
  /** Directory containing app/ and candidate/ templates. */
  templatesDir: string;
  /** Today's date as YYYY-MM-DD. */
  today: string;
}

function writeJson(file: string, value: unknown): void {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function fillTemplate(text: string, slug: string, name: string): string {
  return text.replaceAll(TEMPLATE_SLUG, slug).replaceAll(TEMPLATE_NAME, name);
}

function assertNewSlug(root: string, slug: string): void {
  if (!SLUG.test(slug)) throw new Error(`"${slug}" is not a lowercase kebab-case slug`);
  for (const location of ["apps", "candidates"]) {
    if (existsSync(join(root, location, slug)))
      throw new Error(`${location}/${slug} already exists`);
  }
}

/** Creates candidates/<slug>/ with app.json and PROPOSAL.md. Returns the new directory. */
export function createCandidate(options: ScaffoldOptions, slug: string, name: string): string {
  const { root, templatesDir, today } = options;
  assertNewSlug(root, slug);
  const dir = join(root, "candidates", slug);
  mkdirSync(dir, { recursive: true });

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
  writeFileSync(join(dir, "PROPOSAL.md"), fillTemplate(proposal, slug, name));
  return dir;
}

/** Moves candidates/<slug>/ to apps/<slug>/ as a Labs app built from templates/app. */
export function promoteCandidate(options: ScaffoldOptions, slug: string): string {
  const { root, templatesDir } = options;
  const from = join(root, "candidates", slug);
  const to = join(root, "apps", slug);
  if (!existsSync(join(from, "app.json"))) throw new Error(`candidates/${slug}/app.json not found`);
  if (existsSync(to)) throw new Error(`apps/${slug} already exists`);

  const candidate = JSON.parse(readFileSync(join(from, "app.json"), "utf8")) as AppMeta;
  if (candidate.status !== "candidate") {
    throw new Error(
      `candidates/${slug} has status "${candidate.status}"; only candidates can be promoted`,
    );
  }
  const id = nextId(loadRegistry(root).entries);

  cpSync(join(templatesDir, "app"), to, {
    recursive: true,
    filter: (src) => !/[\\/](node_modules|dist)$/.test(src),
  });
  fillTemplatesInDir(to, slug, candidate.name);

  const template = JSON.parse(readFileSync(join(to, "app.json"), "utf8")) as AppMeta;
  const meta: AppMeta = {
    ...template,
    id,
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
  writeJson(join(to, "app.json"), meta);
  renameSync(join(from, "PROPOSAL.md"), join(to, "PROPOSAL.md"));
  rmSync(from, { recursive: true });
  return to;
}

function fillTemplatesInDir(dir: string, slug: string, name: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      fillTemplatesInDir(path, slug, name);
    } else {
      const text = readFileSync(path, "utf8");
      writeFileSync(path, fillTemplate(text, slug, name));
    }
  }
}
