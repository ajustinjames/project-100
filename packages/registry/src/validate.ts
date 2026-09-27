// Validation for app.json files. Plain, explicit checks on purpose: every rule is one `if`.
// Rules are explained in docs/LIFECYCLE.md. Keep error messages actionable.

import {
  ANALYTICS_MODES,
  APPROVAL_KINDS,
  APPROVAL_REF_PREFIX,
  type AppMeta,
  type ApprovalKind,
  LIVE_TARGET,
  PRIVACY_CLASSES,
  PRIVACY_CLASSIFICATION,
  RESERVED_SLUGS,
  RETRO_INCOMPLETE_MARKER,
  SCHEMA_VERSION,
  STATUSES,
} from "./schema.ts";

export interface PackageJson {
  name?: string;
  private?: boolean;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/** One app.json plus the facts about its directory that validation needs. */
export interface RegistryEntry {
  /** Repo-relative directory, e.g. "apps/example" or "candidates/example". */
  dir: string;
  location: "apps" | "candidates";
  /** Parsed app.json. Not trusted until validateEntry returns no errors. */
  meta: AppMeta;
  packageJson: PackageJson | null;
  /** Contents of RETRO.md, or null if the file does not exist. */
  retro: string | null;
  /** Contents of PRIVACY.md, or null if the file does not exist. */
  privacyDoc: string | null;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const KNOWN_FIELDS = [
  "schemaVersion",
  "id",
  "slug",
  "name",
  "status",
  "description",
  "problem",
  "category",
  "dates",
  "design",
  "dependencies",
  "sharedPackages",
  "privacy",
  "analytics",
  "monetization",
  "approvals",
  "rejection",
];

/** Returns why a slug is not allowed, or null if it is fine. Shared with the scaffolding CLI. */
export function slugProblem(slug: string): string | null {
  if (!SLUG.test(slug)) return `slug "${slug}" must be lowercase kebab-case`;
  if (slug.length > 40) return `slug "${slug}" is longer than 40 characters`;
  if (RESERVED_SLUGS.includes(slug)) return `slug "${slug}" is reserved`;
  return null;
}

/** True if RETRO.md has real content: no incomplete marker, and prose beyond headings and comments. */
export function isRetroComplete(retro: string | null): boolean {
  if (retro === null || retro.includes(RETRO_INCOMPLETE_MARKER)) return false;
  const prose = retro
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("#"))
    .join("")
    .replace(/\s+/g, "");
  return prose.length >= 100;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isDate = (v: unknown): v is string => typeof v === "string" && ISO_DATE.test(v);
const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((item) => typeof item === "string");
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => list.includes(v as T);
const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join("\n") === [...b].sort().join("\n");

/** Checks one app.json. Returns human-readable errors; an empty array means valid. */
export function validateEntry(entry: RegistryEntry): string[] {
  const errors: string[] = [];
  const fail = (message: string) => errors.push(`${entry.dir}/app.json: ${message}`);
  const raw: unknown = entry.meta;

  // 1. Shape. Later rules assume the shape is right, so stop here if it is not.
  if (!isObject(raw)) {
    fail("must be a JSON object");
    return errors;
  }
  for (const key of Object.keys(raw)) {
    if (!KNOWN_FIELDS.includes(key)) fail(`unknown field "${key}"`);
  }
  if (raw.schemaVersion !== SCHEMA_VERSION) fail(`schemaVersion must be ${SCHEMA_VERSION}`);
  if (!(raw.id === null || (Number.isInteger(raw.id) && (raw.id as number) >= 1)))
    fail("id must be a positive integer or null");
  if (typeof raw.slug !== "string") fail("slug must be a string");
  else if (slugProblem(raw.slug)) fail(slugProblem(raw.slug) as string);
  for (const field of ["name", "description", "problem"]) {
    if (!isText(raw[field])) fail(`${field} must be a non-empty string`);
    else if ((raw[field] as string).includes("TODO")) fail(`${field} still contains TODO`);
  }
  if (!(typeof raw.category === "string" && SLUG.test(raw.category)))
    fail("category must be lowercase kebab-case");
  if (!oneOf(STATUSES, raw.status)) fail(`status must be one of: ${STATUSES.join(", ")}`);
  const dates = raw.dates;
  if (
    !isObject(dates) ||
    !isDate(dates.created) ||
    !(dates.launched === null || isDate(dates.launched)) ||
    !(dates.archived === null || isDate(dates.archived))
  )
    fail(
      "dates must be { created: YYYY-MM-DD, launched: YYYY-MM-DD|null, archived: YYYY-MM-DD|null }",
    );
  const design = raw.design;
  if (
    !isObject(design) ||
    !(design.system === null || (typeof design.system === "string" && SLUG.test(design.system)))
  )
    fail('design must be { system: "<ajj-design system name>" | null }');
  if (!isStringArray(raw.dependencies)) fail("dependencies must be an array of package names");
  if (!isStringArray(raw.sharedPackages)) fail("sharedPackages must be an array of package names");
  if (!oneOf(PRIVACY_CLASSES, raw.privacy))
    fail(`privacy must be one of: ${PRIVACY_CLASSES.join(", ")}`);
  if (!oneOf(ANALYTICS_MODES, raw.analytics))
    fail(`analytics must be one of: ${ANALYTICS_MODES.join(", ")}`);
  if (!isObject(raw.monetization) || typeof raw.monetization.eligible !== "boolean")
    fail("monetization must be { eligible: boolean }");
  if (!Array.isArray(raw.approvals)) {
    fail("approvals must be an array");
  } else {
    for (const approval of raw.approvals) {
      if (
        !isObject(approval) ||
        !oneOf(APPROVAL_KINDS, approval.kind) ||
        !isDate(approval.date) ||
        typeof approval.ref !== "string" ||
        !approval.ref.startsWith(APPROVAL_REF_PREFIX)
      )
        fail(
          `each approval must be { kind: ${APPROVAL_KINDS.join("|")}, date: YYYY-MM-DD, ref: "${APPROVAL_REF_PREFIX}..." }`,
        );
    }
  }
  const rejection = raw.rejection;
  if (
    !(
      rejection === null ||
      (isObject(rejection) && isDate(rejection.date) && isText(rejection.reason))
    )
  )
    fail('rejection must be null or { date: YYYY-MM-DD, reason: "..." }');
  if (errors.length > 0) return errors;

  // 2. Lifecycle rules.
  const meta = raw as unknown as AppMeta;
  const has = (kind: ApprovalKind) => meta.approvals.some((a) => a.kind === kind);
  const latest = (kind: ApprovalKind) =>
    meta.approvals
      .filter((a) => a.kind === kind)
      .map((a) => a.date)
      .sort()
      .pop() ?? null;
  const dirName = entry.dir.split("/").pop();

  if (dirName !== meta.slug) fail(`directory name "${dirName}" must equal slug "${meta.slug}"`);

  if (entry.location === "candidates") {
    if (meta.status !== "candidate" && meta.status !== "rejected")
      fail(`entries in candidates/ must be "candidate" or "rejected", not "${meta.status}"`);
    if (meta.id !== null) fail("candidates do not have an id yet (id is assigned on promotion)");
  } else {
    if (meta.status === "candidate") fail("candidates belong in candidates/, not apps/");
    if (meta.id === null) fail("apps in apps/ must have an id");
    if (meta.design.system === null) fail("apps must name the ajj-design system they use");
  }

  if (meta.status === "rejected" && meta.rejection === null)
    fail("rejected entries need a rejection { date, reason }");
  if (meta.status === "rejected" && entry.location === "apps" && !isRetroComplete(entry.retro))
    fail("discarded Labs apps need a completed RETRO.md (see docs/LIFECYCLE.md)");
  if (meta.status !== "rejected" && meta.rejection !== null)
    fail('rejection must be null unless status is "rejected"');

  if (meta.status === "live" || meta.status === "archived") {
    if (meta.dates.launched === null) fail(`${meta.status} apps need dates.launched`);
    if (!has("launch")) fail(`${meta.status} apps need a "launch" approval from the project owner`);
  }
  const lastArchive = latest("archive");
  const lastLaunch = latest("launch");
  if (meta.status === "live" && lastArchive !== null && (lastLaunch ?? "") <= lastArchive)
    fail('a revived app needs a new "launch" approval dated after its last archive approval');
  if (meta.status === "archived") {
    if (meta.dates.archived === null) fail("archived apps need dates.archived");
    if (!has("archive")) fail('archived apps need an "archive" approval from the project owner');
    if (!isRetroComplete(entry.retro))
      fail(
        `archived apps need a completed RETRO.md (real content, and ${RETRO_INCOMPLETE_MARKER} removed)`,
      );
  } else if (meta.dates.archived !== null) {
    fail('dates.archived must be null unless status is "archived"');
  }
  if (meta.dates.launched !== null && meta.dates.launched < meta.dates.created)
    fail("dates.launched is before dates.created");
  if (
    meta.dates.archived !== null &&
    meta.dates.launched !== null &&
    meta.dates.archived < meta.dates.launched
  )
    fail("dates.archived is before dates.launched");

  if (meta.monetization.eligible && meta.status !== "live")
    fail("only live apps may be monetization-eligible (never Labs)");
  // Candidates may declare personal data while the owner decides; nothing reaches apps/ without approval.
  if (meta.privacy === "personal-data" && entry.location === "apps" && !has("personal-data"))
    fail('privacy "personal-data" needs a "personal-data" approval from the project owner');
  // PRIVACY.md is what users read, so it must state the same class. Discarded apps are exempt.
  if (entry.location === "apps" && meta.status !== "rejected") {
    const stated = entry.privacyDoc?.match(PRIVACY_CLASSIFICATION)?.[1] ?? null;
    if (stated !== meta.privacy)
      fail(
        `PRIVACY.md must state **Classification:** \`${meta.privacy}\` to match privacy (docs/PRIVACY_AND_DATA.md)`,
      );
  }

  // 3. app.json must agree with package.json, so the registry stays truthful.
  if ((meta.status === "labs" || meta.status === "live") && entry.packageJson === null)
    fail(`${meta.status} apps need a package.json`);
  if (entry.packageJson !== null) {
    const pkg = entry.packageJson;
    const runtime = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.optionalDependencies ?? {}),
    ];
    const all = [...runtime, ...Object.keys(pkg.devDependencies ?? {})];
    const designPackages = [
      `@ajustinjames/${meta.design.system}-tokens`,
      `@ajustinjames/${meta.design.system}-components`,
    ];
    const expectedName = `@project-100/app-${meta.slug}`;
    if (pkg.name !== expectedName) fail(`package.json name must be "${expectedName}"`);
    if (pkg.private !== true) fail('package.json must set "private": true');
    if (!runtime.some((name) => designPackages.includes(name)))
      fail(`package.json must depend on ${designPackages.join(" or ")} (ajj-design)`);
    const shared = all.filter((name) => name.startsWith("@project-100/"));
    if (!sameSet(shared, meta.sharedPackages))
      fail(`sharedPackages must list exactly: [${shared.join(", ")}]`);
    if (meta.status === "labs" || meta.status === "live") {
      if (!shared.includes("@project-100/web"))
        fail("labs and live apps must use @project-100/web (project web standards)");
      for (const script of ["build", "typecheck"]) {
        if (!pkg.scripts?.[script]) fail(`package.json needs a "${script}" script`);
      }
    }
    const thirdParty = runtime.filter(
      (name) => !name.startsWith("@project-100/") && !designPackages.includes(name),
    );
    if (!sameSet(thirdParty, meta.dependencies))
      fail(
        `dependencies must list exactly the third-party runtime dependencies: [${thirdParty.join(", ")}]`,
      );
  }

  return errors;
}

/** Checks every entry plus rules that span entries (unique ids/slugs, the live cap). */
export function validateRegistry(entries: RegistryEntry[]): string[] {
  const errors = entries.flatMap(validateEntry);
  const seenSlugs = new Map<string, string>();
  const seenIds = new Map<number, string>();
  for (const { dir, meta } of entries) {
    if (!isObject(meta)) continue; // already reported by validateEntry
    const slugOwner = seenSlugs.get(meta.slug);
    if (slugOwner) errors.push(`${dir}: slug "${meta.slug}" is already used by ${slugOwner}`);
    else seenSlugs.set(meta.slug, dir);
    if (typeof meta.id === "number") {
      const idOwner = seenIds.get(meta.id);
      if (idOwner) errors.push(`${dir}: id ${meta.id} is already used by ${idOwner}`);
      else seenIds.set(meta.id, dir);
    }
  }
  const live = entries.filter((e) => isObject(e.meta) && e.meta.status === "live").length;
  if (live > LIVE_TARGET)
    errors.push(`${live} apps are live but only ${LIVE_TARGET} slots exist; archive one first`);
  return errors;
}
