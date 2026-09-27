import { describe, expect, it } from "vitest";
import { type BranchOf, guardProblem } from "./lib/guard.ts";

/** Every directory is on `branch`. */
const on =
  (branch: string): BranchOf =>
  () =>
    branch;

describe("guardProblem", () => {
  it("refuses pushes to main", () => {
    for (const command of [
      "git push origin main",
      "git push -f origin HEAD:main",
      'git push origin "HEAD:main"',
      "git push origin +main",
      "git push origin feature:refs/heads/main",
      "git push origin --delete main",
      "git push --all origin",
      "pnpm verify && git push origin main",
    ])
      expect(guardProblem(command, on("feature")), command).toContain("push to main");
  });

  it("refuses pushing the current branch when it is main", () => {
    for (const command of ["git push", "git push origin", "git push -u origin HEAD"])
      expect(guardProblem(command, on("main")), command).toContain("push to main");
    expect(guardProblem("git push -u origin HEAD", on("feature"))).toBeNull();
  });

  it("follows branch and directory changes within the command", () => {
    expect(guardProblem("git switch main && git push", on("feature"))).toContain("push to main");
    expect(guardProblem("git switch -c fix && git push -u origin HEAD", on("main"))).toBeNull();
    expect(guardProblem("git checkout -b fix; git push -u origin HEAD", on("main"))).toBeNull();
    const worktrees: BranchOf = (dir) => (dir === "../main-checkout" ? "main" : "feature");
    expect(guardProblem("git -C ../main-checkout push", worktrees)).toContain("push to main");
    expect(guardProblem("cd ../main-checkout && git push", worktrees)).toContain("push to main");
    expect(guardProblem("git push", worktrees)).toBeNull();
  });

  it("refuses merging past the rules and editing them", () => {
    expect(guardProblem("gh pr merge 12 --squash --admin", on("x"))).toContain("--admin");
    expect(guardProblem("gh --repo o/r pr merge 12 --admin --squash", on("x"))).toContain(
      "--admin",
    );
    expect(guardProblem("gh api -X PUT repos/o/r/pulls/12/merge", on("x"))).toContain("merge");
    expect(
      guardProblem("gh api -X PUT repos/o/r/rulesets/1 --input - <<< '{}'", on("x")),
    ).toContain("branch rules");
    expect(
      guardProblem("gh api repos/o/r/branches/main/protection -F enforce_admins=true", on("x")),
    ).toContain("branch rules");
    expect(
      guardProblem("gh api graphql -f query='mutation { mergePullRequest(input: {}) }'", on("x")),
    ).toContain("merge");
  });

  it("refuses applying owner-approved", () => {
    for (const command of [
      "gh pr edit 12 --add-label owner-approved",
      "gh --repo o/r pr edit 12 --add-label owner-approved",
      'gh pr create --title "x" --label bug,owner-approved',
      "gh api repos/o/r/issues/12/labels -f 'labels[]=owner-approved'",
      "gh api --method PATCH repos/o/r/issues/12 -f 'labels[]=owner-approved'",
    ])
      expect(guardProblem(command, on("feature")), command).toContain("owner-approved");
  });

  it("allows ordinary work", () => {
    for (const command of [
      "git push -u origin feature",
      "git push origin main-menu-fix",
      'git commit -m "push to main later"',
      "gh pr merge 12 --auto --squash",
      "gh api repos/o/r/rulesets/1",
      "gh api -X GET repos/o/r/branches/main/protection -F per_page=100",
      "gh api graphql -f query='query { node(id: 1) { ... on BranchProtectionRule { id } } }'",
      "gh pr list --label owner-approved",
      "gh pr view 12 --json labels",
      'gh pr create --title "Owner gate" --body "Needs the owner-approved label before merge."',
      'gh pr create --title "x" --body "Then run: git push origin main; done"',
      "gh pr create --title x --body-file - <<'EOF'\ngit push origin main\nEOF",
      "gh api repos/o/r/issues/12/comments -f body='waiting for owner-approved'",
    ])
      expect(guardProblem(command, on("main")), command).toBeNull();
  });
});
