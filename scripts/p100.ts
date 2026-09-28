// Project 100 command line. Run with `pnpm p100 <command>`.
// Keep commands few and boring; lifecycle edits not covered here are made by editing app.json
// and checked by `pnpm p100 validate`.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type AppMeta,
  countByStatus,
  LIVE_TARGET,
  loadRegistry,
  type PackageJson,
  validateRegistry,
} from "../packages/registry/src/index.ts";
import { checkBuilds } from "./lib/builds.ts";
import { ownerGatedReasons, transitionErrors } from "./lib/changes.ts";
import { createCandidate, promoteCandidate } from "./lib/scaffold.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const scaffold = {
  root,
  templatesDir: join(root, "templates"),
  today: new Date().toISOString().slice(0, 10),
};

const USAGE = `Usage: pnpm p100 <command>

  validate                 Check every app.json against the lifecycle rules
  check-builds             Check built pages for the project web standards (after pnpm build)
  check-changes <base-ref> Check this branch against a base: history, transitions, owner-gated changes
  status                   Show the Project 100 counter
  list [--json]            List all registry entries
  candidate <slug> <name>  Create candidates/<slug>/ (app.json + PROPOSAL.md)
  promote <slug>           Move a candidate into apps/<slug>/ as a Labs app with a new id
`;

function main(args: string[]): number {
  const [command, ...rest] = args;
  const { entries, errors: loadErrors } = loadRegistry(root);
  const registryErrors = [...loadErrors, ...validateRegistry(entries)];
  // The counter and list are only trustworthy if every entry is valid.
  if (["validate", "status", "list", "check-changes"].includes(command ?? "")) {
    for (const error of registryErrors) console.error(`✗ ${error}`);
    if (registryErrors.length > 0) return 1;
  }

  switch (command) {
    case "validate": {
      console.log(`✓ ${entries.length} registry entries valid`);
      return 0;
    }
    case "check-builds": {
      const errors = checkBuilds(root, entries);
      for (const error of errors) console.error(`✗ ${error}`);
      if (errors.length > 0) return 1;
      console.log("✓ built pages meet the project web standards");
      return 0;
    }
    case "check-changes": {
      const [baseRef] = rest;
      if (!baseRef) break;
      return checkChanges(
        baseRef,
        entries.map((e) => e.meta),
      );
    }
    case "status": {
      const counts = countByStatus(entries);
      console.log(`Live: ${counts.live}/${LIVE_TARGET}`);
      console.log(
        `Labs: ${counts.labs}  Candidates: ${counts.candidate}  Archived: ${counts.archived}  Rejected: ${counts.rejected}`,
      );
      return 0;
    }
    case "list": {
      if (rest.includes("--json")) {
        const metas = entries.map((e) => e.meta);
        console.log(JSON.stringify(metas, null, 2));
        return 0;
      }
      for (const { meta } of entries) {
        const id = meta.id === null ? "   " : String(meta.id).padStart(3, "0");
        console.log(`${id}  ${meta.status.padEnd(9)}  ${meta.slug.padEnd(30)}  ${meta.name}`);
      }
      return 0;
    }
    case "candidate": {
      const [slug, ...nameParts] = rest;
      if (!slug || nameParts.length === 0) break;
      const dir = createCandidate(scaffold, slug, nameParts.join(" "));
      console.log(`Created ${dir}. Fill in app.json and PROPOSAL.md, then run pnpm p100 validate.`);
      return 0;
    }
    case "promote": {
      const [slug] = rest;
      if (!slug) break;
      const dir = promoteCandidate(scaffold, slug);
      console.log(`Created ${dir}. Next: pnpm install, then complete APP.md and PRIVACY.md.`);
      return 0;
    }
  }
  console.log(USAGE);
  return command ? 1 : 0;
}

function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

function checkChanges(baseRef: string, head: AppMeta[]): number {
  const lines = (text: string) => text.split("\n").filter(Boolean);
  // --no-renames lists both sides of a rename, so moving a file out of a gated path is caught.
  const changedFiles = lines(git("diff", "--no-renames", "--name-only", `${baseRef}...HEAD`));
  const base = lines(git("ls-tree", "-r", "--name-only", baseRef, "--", "apps", "candidates"))
    .filter((path) => /^(apps|candidates)\/[^/]+\/app\.json$/.test(path))
    .map((path) => JSON.parse(git("show", `${baseRef}:${path}`)) as AppMeta);
  const rootScripts = {
    before: (JSON.parse(git("show", `${baseRef}:package.json`)) as PackageJson).scripts,
    after: (JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as PackageJson).scripts,
  };

  const errors = transitionErrors(base, head);
  for (const error of errors) console.error(`✗ ${error}`);
  const reasons = ownerGatedReasons(base, head, changedFiles, rootScripts);
  if (reasons.length > 0) {
    const approved = process.env.P100_OWNER_APPROVED === "true";
    console.log(`${approved ? "✓" : "✗"} Owner-gated change (only the owner merges it):`);
    for (const reason of reasons) console.log(`  - ${reason}`);
    if (!approved) {
      console.error("✗ Needs the owner-approved label, which only the owner applies.");
      return 1;
    }
  }
  if (errors.length > 0) return 1;
  console.log("✓ change checks passed");
  return 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  process.exitCode = 1;
}
