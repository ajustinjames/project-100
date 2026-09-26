// Project 100 command line. Run with `pnpm p100 <command>`.
// Keep commands few and boring; lifecycle edits not covered here are made by editing app.json
// and checked by `pnpm p100 validate`.

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  countByStatus,
  LIVE_TARGET,
  loadRegistry,
  validateRegistry,
} from "../packages/registry/src/index.ts";
import { createCandidate, promoteCandidate } from "./lib/scaffold.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const scaffold = {
  root,
  templatesDir: join(root, "templates"),
  today: new Date().toISOString().slice(0, 10),
};

const USAGE = `Usage: pnpm p100 <command>

  validate                 Check every app.json against the lifecycle rules
  status                   Show the Project 100 counter
  list [--json]            List all registry entries
  candidate <slug> <name>  Create candidates/<slug>/ (app.json + PROPOSAL.md)
  promote <slug>           Move a candidate into apps/<slug>/ as a Labs app with a new id
`;

function main(args: string[]): number {
  const [command, ...rest] = args;
  const { entries, errors: loadErrors } = loadRegistry(root);

  switch (command) {
    case "validate": {
      const errors = [...loadErrors, ...validateRegistry(entries)];
      for (const error of errors) console.error(`✗ ${error}`);
      if (errors.length > 0) return 1;
      console.log(`✓ ${entries.length} registry entries valid`);
      return 0;
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

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  process.exitCode = 1;
}
