// Claude Code PreToolUse hook for Bash, configured in .claude/settings.json. Reads the hook input
// (JSON) from stdin and exits with code 2, which blocks the command, if lib/guard.ts refuses it.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { guardProblem } from "./lib/guard.ts";

interface HookInput {
  cwd?: string;
  tool_input?: { command?: unknown };
}

function currentBranch(cwd: string | undefined): string | null {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null; // not in a git checkout; only the explicit checks apply
  }
}

const input = JSON.parse(readFileSync(0, "utf8")) as HookInput;
const command = input.tool_input?.command;
if (typeof command === "string") {
  const problem = guardProblem(command, currentBranch(input.cwd));
  if (problem) {
    console.error(`Blocked by scripts/agent-guard.ts: ${problem}`);
    process.exitCode = 2;
  }
}
