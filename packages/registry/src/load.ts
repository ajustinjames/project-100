// Reads every apps/*/app.json and candidates/*/app.json. Node-only (uses the filesystem).

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { AppMeta, Status } from "./schema.ts";
import { STATUSES } from "./schema.ts";
import type { PackageJson, RegistryEntry } from "./validate.ts";

const LOCATIONS = ["apps", "candidates"] as const;

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, "utf8"));
}

/** Loads all registry entries under `rootDir`. Problems reading files are returned as errors. */
export function loadRegistry(rootDir: string): { entries: RegistryEntry[]; errors: string[] } {
  const entries: RegistryEntry[] = [];
  const errors: string[] = [];

  for (const location of LOCATIONS) {
    const base = join(rootDir, location);
    if (!existsSync(base)) continue;
    const dirs = readdirSync(base, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("."))
      .map((d) => d.name)
      .sort();

    for (const name of dirs) {
      const dir = `${location}/${name}`;
      const metaFile = join(rootDir, dir, "app.json");
      if (!existsSync(metaFile)) {
        errors.push(`${dir}: missing app.json`);
        continue;
      }
      let meta: AppMeta;
      let packageJson: PackageJson | null = null;
      try {
        meta = readJson(metaFile) as AppMeta;
        const pkgFile = join(rootDir, dir, "package.json");
        if (existsSync(pkgFile)) packageJson = readJson(pkgFile) as PackageJson;
      } catch (error) {
        errors.push(`${dir}: invalid JSON (${(error as Error).message})`);
        continue;
      }
      const retroFile = join(rootDir, dir, "RETRO.md");
      const retro = existsSync(retroFile) ? readFileSync(retroFile, "utf8") : null;
      const privacyFile = join(rootDir, dir, "PRIVACY.md");
      const privacyDoc = existsSync(privacyFile) ? readFileSync(privacyFile, "utf8") : null;
      entries.push({ dir, location, meta, packageJson, retro, privacyDoc });
    }
  }

  return { entries, errors };
}

/** Counts entries by status, e.g. for the Project 100 counter. */
export function countByStatus(entries: RegistryEntry[]): Record<Status, number> {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const { meta } of entries) {
    if (STATUSES.includes(meta.status)) counts[meta.status] += 1;
  }
  return counts;
}

/** The next unused numeric id. IDs are never reused, including ids of rejected or archived apps. */
export function nextId(entries: RegistryEntry[]): number {
  const ids = entries.map((e) => e.meta.id).filter((id): id is number => typeof id === "number");
  return ids.length === 0 ? 1 : Math.max(...ids) + 1;
}
