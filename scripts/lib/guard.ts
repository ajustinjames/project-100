// Refuses the few shell commands that get around the owner gate (docs/AI_ROLES.md#merging):
// pushing to main, merging past failing checks, editing branch rules, and applying the
// owner-approved label. Agents use the owner's GitHub account, so GitHub can't refuse these for
// them. Like check-changes, this catches careless mistakes: it reads the command text, and a
// determined agent could word around it.

/** The current branch of a directory (undefined: the session's), or null if unknown. */
export type BranchOf = (dir: string | undefined) => string | null;

const WRITE_METHOD = /\s(?:-X|--method)[\s=]*(?:PUT|POST|PATCH|DELETE)\b/i;
const ANY_METHOD = /\s(?:-X|--method)\b/;
// gh api sends POST when fields or input are given without an explicit method.
const HAS_FIELDS = /\s(?:-f|-F|--field|--raw-field|--input)\b/;
// A --label/--add-label value (possibly a quoted, comma-separated list) that includes it.
const OWNER_APPROVED_LABEL =
  /\s(?:--add-label|--label|-l)(?:=|\s+)(?:"[^"]*owner-approved|'[^']*owner-approved|[^\s"']*owner-approved)/;
// Keeps the `<<'EOF'` line of a heredoc and drops its body, which is text, not commands.
const HEREDOC_BODY = /(<<-?\s*(['"]?)(\w+)\2[^\n]*)\n[\s\S]*?\n\3(?=\n|$)/g;

const unquote = (word: string) => word.replace(/^(['"])(.*)\1$/, "$2");

/** Splits a shell command into simple commands on unquoted ;, &, |, and newlines. */
function simpleCommands(command: string): string[] {
  const text = command.replace(HEREDOC_BODY, "$1");
  const parts: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (let i = 0; i < text.length; i++) {
    const char = text[i] as string;
    if (char === "\\") {
      current += char + (text[i + 1] ?? "");
      i++;
    } else if (quote) {
      if (char === quote) quote = null;
      current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      current += char;
    } else if (";&|\n".includes(char)) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

/** The branch `git switch`/`git checkout <args>` moves to, or undefined if it stays put. */
function switchTarget(args: string): string | null | undefined {
  const words = args.split(/\s+/).filter(Boolean).map(unquote);
  if (words.includes("--")) return undefined; // restoring files, not switching
  const create = words.findIndex((w) => /^(?:-[cCbB]|--create|--force-create|--orphan)$/.test(w));
  if (create !== -1) return words[create + 1] ?? null;
  const target = words.find((w) => !w.startsWith("-"));
  if (target === undefined) return undefined;
  return target === "-" ? null : target; // `git switch -` goes to an unknown previous branch
}

function pushesToMain(args: string, branch: string | null): boolean {
  const words = args.split(/\s+/).filter(Boolean).map(unquote);
  if (words.includes("--all") || words.includes("--mirror")) return true;
  const [, ...refspecs] = words.filter((word) => !word.startsWith("-"));
  if (refspecs.some((ref) => /(?:^|[+:]|refs\/heads\/)main$/.test(ref))) return true;
  // `git push`, `git push origin`, and `git push origin HEAD` push the current branch.
  return branch === "main" && (refspecs.length === 0 || refspecs.includes("HEAD"));
}

/** Why `command` is refused, or null if it may run. */
export function guardProblem(command: string, branchOf: BranchOf): string | null {
  let dir: string | undefined; // set by `cd`
  let switched: string | null | undefined; // set by `git switch`/`git checkout` in this command
  for (const raw of simpleCommands(command)) {
    // gh accepts --repo before or after the subcommand; it doesn't change what the command does.
    const part = raw.replace(/\s(?:-R|--repo)(?:=|\s+)\S+/g, "");

    const cd = part.match(/^cd\s+(\S+)$/);
    if (cd) {
      const to = unquote(cd[1] as string);
      dir = dir === undefined || /^[/~]/.test(to) ? to : `${dir}/${to}`;
      switched = undefined;
    }
    const gitSwitch = part.match(/^git\s+(?:switch|checkout)\b(.*)$/);
    if (gitSwitch) {
      const target = switchTarget(gitSwitch[1] ?? "");
      if (target !== undefined) switched = target;
    }
    const push = part.match(/^git\s+((?:-[Cc]\s+\S+\s+)*)push\b(.*)$/);
    if (push) {
      const other = push[1]?.match(/-C\s+(\S+)/)?.[1];
      const branch =
        other !== undefined
          ? branchOf(dir === undefined ? unquote(other) : `${dir}/${unquote(other)}`)
          : switched !== undefined
            ? switched
            : branchOf(dir);
      if (pushesToMain(push[2] ?? "", branch))
        return "never push to main. Push a branch and open a PR (AGENTS.md#workflow).";
    }

    if (/^gh\s+pr\s+merge\b/.test(part) && /\s--admin\b/.test(part))
      return "never merge with --admin. Wait for CI, or ask the owner (docs/AI_ROLES.md#merging).";

    if (/^gh\s+(?:pr|issue)\s+(?:create|edit)\b/.test(part) && OWNER_APPROVED_LABEL.test(part))
      return "only the owner applies owner-approved (docs/AI_ROLES.md#merging).";

    if (/^gh\s+api\b/.test(part)) {
      const writes = WRITE_METHOD.test(part) || (!ANY_METHOD.test(part) && HAS_FIELDS.test(part));
      const mutation = /^gh\s+api\s+graphql\b/.test(part) && /\bmutation\b/.test(part);
      if (
        (writes && /\/rulesets\b|\/protection\b/.test(part)) ||
        (mutation &&
          /\b(?:create|update|delete)(?:RepositoryRuleset|BranchProtectionRule)\b/.test(part))
      )
        return "only the owner changes branch rules (docs/AI_ROLES.md#merging).";
      if (
        (writes && /\/pulls\/\d+\/merge\b/.test(part)) ||
        (mutation && /\bmergePullRequest\b/.test(part))
      )
        return "merge with `gh pr merge --auto --squash`, not the API (docs/AI_ROLES.md#merging).";
      // Labels can be set on the labels endpoints or by updating the issue (PRs are issues).
      if (
        writes &&
        part.includes("owner-approved") &&
        /\/issues\/\d+(?:\/labels)?(?=[\s'"?]|$)|\/labels\b/.test(part)
      )
        return "only the owner applies owner-approved (docs/AI_ROLES.md#merging).";
    }
  }
  return null;
}
