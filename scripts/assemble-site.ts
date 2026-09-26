// Assembles the deployable site into dist/. Run by `pnpm build:site` after `pnpm build`.
// The logic lives in lib/assemble.ts; see docs/CLOUDFLARE.md#deploys-cloudflare-git-integration.

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegistry, validateRegistry } from "../packages/registry/src/index.ts";
import { SITE_ORIGIN } from "../packages/web/src/site.ts";
import { assembleSite } from "./lib/assemble.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function main(): number {
  if (SITE_ORIGIN === null) throw new Error("SITE_ORIGIN is not set in packages/web/src/site.ts");
  // Publish nothing from an invalid registry: status decides what is public.
  const { entries, errors } = loadRegistry(root);
  const problems = [...errors, ...validateRegistry(entries)];
  for (const problem of problems) console.error(`✗ ${problem}`);
  if (problems.length > 0) return 1;

  const published = assembleSite({
    root,
    apps: entries.map((e) => e.meta),
    outDir: join(root, "dist"),
    origin: SITE_ORIGIN,
    today: new Date().toISOString().slice(0, 10),
  });
  console.log("✓ assembled dist/ with these app and page paths:");
  for (const path of published) console.log(`  ${path}`);
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  process.exitCode = 1;
}
