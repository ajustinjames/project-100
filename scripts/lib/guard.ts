// Refuses the few shell commands that get around the owner gate (docs/AI_ROLES.md#merging):
// pushing to main, merging past failing checks, editing branch rules, and applying the
// owner-approved label. Agents use the owner's GitHub account, so GitHub can't refuse these for
// them. Like check-changes, this catches careless mistakes: it reads the command text, and a
// determined agent could word around it.

const WRITE_METHOD = /\s(?:-X|--method)[\s=]*(?:PUT|POST|PATCH|DELETE)\b/i;
const ANY_METHOD = /\s(?:-X|--method)\b/;
// gh api sends POST when fields or input are given without an explicit method.
const HAS_FIELDS = /\s(?:-f|-F|--field|--raw-field|--input)\b/;

/** Splits a shell command into simple commands, on &&, ||, ;, |, and newlines. */
function simpleCommands(command: string): string[] {
  return command
    .split(/&&|\|\||[;|\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function pushesToMain(args: string, branch: string | null): boolean {
  const [, ...refspecs] = args.split(/\s+/).filter((arg) => arg && !arg.startsWith("-"));
  if (refspecs.some((ref) => /(?:^|[+:]|refs\/heads\/)main$/.test(ref))) return true;
  // `git push`, `git push origin`, and `git push origin HEAD` push the current branch.
  return branch === "main" && (refspecs.length === 0 || refspecs.includes("HEAD"));
}

/** Why `command` is refused, or null if it may run. `branch` is the current git branch. */
export function guardProblem(command: string, branch: string | null): string | null {
  for (const part of simpleCommands(command)) {
    const push = part.match(/^git\s+(?:-C\s+\S+\s+)?push\b(.*)$/);
    if (push && pushesToMain(push[1] ?? "", branch))
      return "never push to main. Push a branch and open a PR (AGENTS.md#workflow).";

    if (/^gh\s+pr\s+merge\b/.test(part) && /\s--admin\b/.test(part))
      return "never merge with --admin. Wait for CI, or ask the owner (docs/AI_ROLES.md#merging).";

    if (/^gh\s+(?:pr|issue)\s+(?:create|edit)\b/.test(part) && part.includes("owner-approved"))
      return "only the owner applies owner-approved (docs/AI_ROLES.md#merging).";

    if (/^gh\s+api\b/.test(part)) {
      const writes = WRITE_METHOD.test(part) || (!ANY_METHOD.test(part) && HAS_FIELDS.test(part));
      const graphql = /^gh\s+api\s+graphql\b/.test(part);
      if (
        (writes && /\/rulesets\b|\/protection\b/.test(part)) ||
        (graphql && /RepositoryRuleset|BranchProtectionRule/.test(part))
      )
        return "only the owner changes branch rules (docs/AI_ROLES.md#merging).";
      if (
        (writes && /\/pulls\/\d+\/merge\b/.test(part)) ||
        (graphql && /mergePullRequest/.test(part))
      )
        return "merge with `gh pr merge --auto --squash`, not the API (docs/AI_ROLES.md#merging).";
      if (writes && /\/labels\b/.test(part) && part.includes("owner-approved"))
        return "only the owner applies owner-approved (docs/AI_ROLES.md#merging).";
    }
  }
  return null;
}
