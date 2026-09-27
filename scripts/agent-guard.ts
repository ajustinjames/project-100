// Claude Code PreToolUse hook for Bash, configured in .claude/settings.json. Reads the hook input
// (JSON) from stdin and exits with code 2, which blocks the command, if lib/guard.ts refuses it.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { guardProblem } from "./lib/guard.ts";

interface HookInput {
  cwd?: string;
  tool_input?: { command?: unknown };
}

/** The branch checked out in `dir` (relative to `cwd`), or null if unknown. */
function branchOf(cwd: string | undefined, dir: string | undefined): string | null {
  const where = resolve(cwd ?? process.cwd(), (dir ?? ".").replace(/^~(?=\/|$)/, homedir()));
  try {
    return execFileSync("git", ["-C", where, "rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null; // not a git checkout, or a directory that doesn't exist yet
  }
}

const input = JSON.parse(readFileSync(0, "utf8")) as HookInput;
const command = input.tool_input?.command;
if (typeof command === "string") {
  const problem = guardProblem(command, (dir) => branchOf(input.cwd, dir));
  if (problem) {
    console.error(`Blocked by scripts/agent-guard.ts: ${problem}`);
    process.exitCode = 2;
  }
}
