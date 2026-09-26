// Checks a change (a PR) against the base revision: lifecycle history must be preserved, status
// transitions must be legal, and owner-gated changes must be flagged. See docs/AI_ROLES.md#merging.
// This guards against careless agents, not malicious ones: agents share the owner's GitHub identity.

import type { AppMeta, Status } from "../../packages/registry/src/index.ts";

/** Status changes an agent may make in a PR. Staying the same is always allowed. */
const ALLOWED_TRANSITIONS: Record<Status, Status[]> = {
  candidate: ["rejected", "labs"],
  rejected: ["candidate", "labs"], // revival
  labs: ["rejected", "live"],
  live: ["archived"],
  archived: ["labs"], // revival
};

/** Paths only the owner may change (checked as prefixes, except wrangler config anywhere). */
const OWNER_GATED_PATHS = [
  ".github/",
  "scripts/",
  "packages/registry/",
  "docs/PROJECT_CHARTER.md",
  "docs/AI_ROLES.md",
];
const WRANGLER_CONFIG = /(^|\/)wrangler\.(jsonc?|toml)$/;

const bySlug = (metas: AppMeta[]) => new Map(metas.map((m) => [m.slug, m]));

/** Errors for changes that rewrite history: deleted entries, changed or reused ids, illegal transitions. */
export function transitionErrors(base: AppMeta[], head: AppMeta[]): string[] {
  const errors: string[] = [];
  const headBySlug = bySlug(head);
  const baseBySlug = bySlug(base);
  const maxBaseId = Math.max(0, ...base.map((m) => m.id ?? 0));

  for (const before of base) {
    const after = headBySlug.get(before.slug);
    if (!after) {
      errors.push(
        `${before.slug}: entries are permanent history; mark it rejected or archived instead of deleting it`,
      );
      continue;
    }
    if (before.id !== null && after.id !== before.id)
      errors.push(`${before.slug}: id ${before.id} is permanent and cannot change to ${after.id}`);
    if (
      after.status !== before.status &&
      !ALLOWED_TRANSITIONS[before.status]?.includes(after.status)
    )
      errors.push(
        `${before.slug}: "${before.status}" → "${after.status}" is not an allowed transition`,
      );
  }
  for (const after of head) {
    const before = baseBySlug.get(after.slug);
    if (after.id !== null && (before?.id ?? null) === null && after.id <= maxBaseId)
      errors.push(
        `${after.slug}: new id ${after.id} must be greater than ${maxBaseId}, the highest id on the base branch (rebase and renumber)`,
      );
  }
  return errors;
}

/** Reasons this change needs the owner to merge it. Empty means agents may merge it themselves. */
export function ownerGatedReasons(
  base: AppMeta[],
  head: AppMeta[],
  changedFiles: string[],
): string[] {
  const reasons: string[] = [];
  for (const file of changedFiles) {
    if (OWNER_GATED_PATHS.some((p) => file.startsWith(p)) || WRANGLER_CONFIG.test(file))
      reasons.push(`changes ${file}`);
  }
  const baseBySlug = bySlug(base);
  for (const after of head) {
    const before = baseBySlug.get(after.slug);
    if ((after.status === "live" || after.status === "archived") && after.status !== before?.status)
      reasons.push(`${after.slug}: status becomes "${after.status}"`);
    if (JSON.stringify(after.approvals) !== JSON.stringify(before?.approvals ?? []))
      reasons.push(`${after.slug}: approvals change`);
    if (after.monetization.eligible !== (before?.monetization.eligible ?? false))
      reasons.push(`${after.slug}: monetization eligibility changes`);
  }
  return reasons;
}
