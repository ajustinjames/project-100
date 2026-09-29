import { describe, expect, it } from "vitest";
import { type CohortPattern, evaluateHoldoutCohort, evaluateMainCohort } from "./cohort.ts";

function patterns(count: number, designers: string[]): CohortPattern[] {
  return Array.from({ length: count }, (_, index) => ({
    name: `pattern-${index + 1}`,
    designer: designers[index % designers.length],
  }));
}

describe("cohort profiles", () => {
  it("requires ten main patterns from six distinct designers", () => {
    expect(evaluateMainCohort(patterns(10, ["A", "B", "C", "D", "E", "F"]))).toMatchObject({
      mode: "main",
      patternCount: 10,
      designerCount: 6,
      eligible: true,
      issues: [],
    });

    const tooSmall = evaluateMainCohort(patterns(9, ["A", "B", "C", "D", "E"]));
    expect(tooSmall.eligible).toBe(false);
    expect(tooSmall.issues).toEqual([
      "requires at least 10 patterns (found 9)",
      "requires at least 6 distinct designers (found 5)",
    ]);
  });

  it("requires five holdout patterns and designers disjoint from the main cohort", () => {
    const main = patterns(10, ["A", "B", "C", "D", "E", "F"]);
    const eligible = evaluateHoldoutCohort(patterns(5, ["G", "H", "I", "J", "K"]), main);
    expect(eligible).toMatchObject({
      mode: "holdout",
      patternCount: 5,
      designerCount: 5,
      eligible: true,
      issues: [],
    });

    const tooSmall = evaluateHoldoutCohort(patterns(4, ["G", "H", "I", "J"]), main);
    expect(tooSmall.eligible).toBe(false);
    expect(tooSmall.issues).toContain("requires at least 5 patterns (found 4)");

    const overlapping = evaluateHoldoutCohort(patterns(5, ["A", "H", "I", "J", "K"]), main);
    expect(overlapping.eligible).toBe(false);
    expect(overlapping.issues).toContain("shares designer(s) with the main cohort: a");
  });

  it("does not issue a profile when designer evidence is missing", () => {
    const main = patterns(10, ["A", "B", "C", "D", "E", "F"]);
    const holdout = patterns(5, ["G", "H", "I", "J", "K"]);
    holdout[0] = { name: "unknown" };
    expect(evaluateHoldoutCohort(holdout, main).issues).toContain(
      "designer is missing from 1 holdout truth file(s)",
    );
  });
});
