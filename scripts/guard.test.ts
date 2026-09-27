import { describe, expect, it } from "vitest";
import { guardProblem } from "./lib/guard.ts";

describe("guardProblem", () => {
  it("refuses pushes to main", () => {
    for (const command of [
      "git push origin main",
      "git push -f origin HEAD:main",
      "git push origin +main",
      "git push origin feature:refs/heads/main",
      "git push origin --delete main",
      "pnpm verify && git push origin main",
    ])
      expect(guardProblem(command, "feature"), command).toContain("push to main");
  });

  it("refuses pushing the current branch when it is main", () => {
    for (const command of ["git push", "git push origin", "git push -u origin HEAD"])
      expect(guardProblem(command, "main"), command).toContain("push to main");
    expect(guardProblem("git push -u origin HEAD", "feature")).toBeNull();
  });

  it("refuses merging past the rules and editing them", () => {
    expect(guardProblem("gh pr merge 12 --squash --admin", "feature")).toContain("--admin");
    expect(guardProblem("gh api -X PUT repos/o/r/pulls/12/merge", "feature")).toContain("merge");
    expect(
      guardProblem("gh api -X PUT repos/o/r/rulesets/1 --input - <<< '{}'", "feature"),
    ).toContain("branch rules");
    expect(
      guardProblem("gh api repos/o/r/branches/main/protection -F enforce_admins=true", "feature"),
    ).toContain("branch rules");
    expect(
      guardProblem("gh api graphql -f query='mutation { mergePullRequest(input: {}) }'", "x"),
    ).toContain("merge");
  });

  it("refuses applying owner-approved", () => {
    for (const command of [
      "gh pr edit 12 --add-label owner-approved",
      'gh pr create --title "x" --label bug,owner-approved',
      "gh api repos/o/r/issues/12/labels -f 'labels[]=owner-approved'",
    ])
      expect(guardProblem(command, "feature"), command).toContain("owner-approved");
  });

  it("allows ordinary work", () => {
    for (const command of [
      "git push -u origin feature",
      "git push origin main-menu-fix",
      'git commit -m "push to main later"',
      "gh pr merge 12 --auto --squash",
      "gh api repos/o/r/rulesets/1",
      "gh api -X GET repos/o/r/branches/main/protection -F per_page=100",
      "gh pr list --label owner-approved",
      "gh pr view 12 --json labels",
    ])
      expect(guardProblem(command, "main"), command).toBeNull();
  });
});
