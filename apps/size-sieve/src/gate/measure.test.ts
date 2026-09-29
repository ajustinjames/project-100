import { describe, expect, it } from "vitest";
import { findSizeList, resolve } from "../parser/index.ts";
import {
  analyzePattern,
  calculateGateCriteria,
  type GateSequence,
  gateValuesEqual,
  inspectResolutions,
  type StructureCheck,
  type TruthSequence,
  valuesFoundInOrder,
} from "./measure.ts";
import { renderSummaryReport } from "./reports.ts";

const passingStructure: StructureCheck = {
  passed: true,
  roundTrip: true,
  substitutionsOnly: true,
  stableAcrossSizes: true,
  issues: [],
};

function truth(values: string[], extras: Partial<TruthSequence> = {}): TruthSequence {
  return {
    values,
    context: "synthetic instruction",
    position: "p1",
    ...extras,
  };
}

function sub(original: string, values: string[]): GateSequence {
  return { kind: "sub", original, values };
}

function flag(original: string): GateSequence {
  return { kind: "flag", original, reason: "count-mismatch" };
}

describe("gate alignment and classification", () => {
  it("classifies correct, flagged, wrong, missed, lost, and false-positive results", () => {
    const truthEntries = [
      truth(["10", "12"]),
      truth(["14", "16", "18"]),
      truth(["20", "24"]),
      truth(["30", "32"]),
      truth(["40", "42"]),
      truth(["60", "66"], { sourceError: true }),
      truth(["70", "77"], { sourceError: true }),
      truth(["50", "55"], { inFigure: true }),
    ];
    const sequences: GateSequence[] = [
      sub("10 (12)", ["10", "12"]),
      flag("14 (16, 18, 20)"),
      sub("20 (24)", ["20", "25"]),
      flag("60 (66, 72)"),
      sub("70 (77)", ["70", "78"]),
      sub("99 (100)", ["99", "100"]),
    ];

    const result = analyzePattern({
      name: "synthetic",
      sizeCount: 2,
      detectedSizeCount: 2,
      truth: truthEntries,
      sequences,
      extractedText: "30 then 32",
      structure: passingStructure,
    });

    expect(result.entries.map((entry) => entry.classification)).toEqual([
      "correct",
      "flagged",
      "wrong",
      "missed",
      "lost",
      "correct",
      "wrong",
      "lost",
    ]);
    expect(result.entries.map((entry) => entry.counted)).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      false,
    ]);
    expect(result.counts).toEqual({
      counted: 7,
      correct: 2,
      flagged: 1,
      wrong: 3,
      falsePositives: 1,
      missed: 1,
      lost: 1,
      sizeBlockLeftAsWritten: 0,
      sizeBlockSubstituted: 0,
      figureSubstitutedCorrectly: 0,
      figureSubstitutedWrongly: 0,
      figureLeft: 1,
    });
    expect(result.sourceErrorSubstitutions).toHaveLength(1);
    expect(result.sourceErrorSubstitutions[0]?.truth.values).toEqual(["70", "77"]);
  });

  it("excludes size-block and figure entries while reporting each outcome", () => {
    const result = analyzePattern({
      name: "scope-classes",
      sizeCount: 2,
      detectedSizeCount: 2,
      truth: [
        truth(["10", "12"]),
        truth(["20", "22"]),
        truth(["30", "32"]),
        truth(["40", "42"]),
        truth(["50", "52"]),
        truth(["60", "62"], { inSizeBlock: true }),
        truth(["70", "72"], { inSizeBlock: true }),
        truth(["80", "82"], { inSizeBlock: true }),
        truth(["90", "92"], { inSizeBlock: true }),
        truth(["100", "102"], { inFigure: true }),
        truth(["110", "112"], { inFigure: true }),
        truth(["120", "122"], { inFigure: true }),
        truth(["130", "132"], { inFigure: true }),
        truth(["140", "142"], { inFigure: true }),
      ],
      sequences: [
        sub("10 (12)", ["10", "12"]),
        sub("20 (22)", ["20", "23"]),
        flag("30 (32, 34)"),
        flag("70 (72, 74)"),
        sub("80 (82)", ["80", "82"]),
        sub("90 (92)", ["90", "93"]),
        sub("100 (102)", ["100", "102"]),
        flag("110 (112, 114)"),
        sub("140 (142)", ["140", "143"]),
        sub("999 (1000)", ["999", "1000"]),
      ],
      extractedText: "40 then 42; 60 then 62; 120 then 122",
      structure: passingStructure,
    });

    expect(result.entries.map((entry) => entry.counted)).toEqual([
      true,
      true,
      true,
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(result.counts).toEqual({
      counted: 5,
      correct: 1,
      flagged: 1,
      wrong: 5,
      falsePositives: 1,
      missed: 1,
      lost: 1,
      sizeBlockLeftAsWritten: 2,
      sizeBlockSubstituted: 2,
      figureSubstitutedCorrectly: 1,
      figureSubstitutedWrongly: 1,
      figureLeft: 3,
    });
    expect(result.entries.slice(5, 9).map((entry) => entry.classification)).toEqual([
      "missed",
      "flagged",
      "wrong",
      "wrong",
    ]);
    expect(result.entries.slice(9).map((entry) => entry.classification)).toEqual([
      "correct",
      "flagged",
      "missed",
      "lost",
      "wrong",
    ]);

    expect(
      calculateGateCriteria([
        {
          name: result.name,
          counted: result.counts.counted,
          correct: result.counts.correct,
          wrong: result.counts.wrong,
          structurePassed: result.structure.passed,
        },
      ]),
    ).toMatchObject({
      wrongTotal: 5,
      wrongPatternCount: 1,
      countedTotal: 5,
      wrongRate: 1,
      passed: false,
    });
    const summary = renderSummaryReport([result], [], 1);
    expect(summary).toContain(
      "| size block left as written | size block substituted | figure substituted correctly | figure substituted wrongly | figure left |",
    );
    expect(summary).toContain(
      "Size-block entries are outside the denominator because the brief excludes that block from the parser's job; every substitution there counts as wrong. Figure entries are outside it because schematics are out of scope; correct substitutions are reported, and wrong-valued substitutions still count as wrong.",
    );
    expect(summary).not.toContain("Strict size-block reading");
  });

  it("aligns substitutions from source values, not their output values", () => {
    const original = "10 (12)";
    const extractedText = `${original}; later text: 20, 22`;
    const result = analyzePattern({
      name: "source-alignment",
      sizeCount: 2,
      detectedSizeCount: 2,
      truth: [truth(["10", "12"]), truth(["20", "22"])],
      sequences: [
        {
          kind: "sub",
          original,
          values: ["20", "22"],
          start: 0,
          end: original.length,
        },
      ],
      extractedText,
      structure: passingStructure,
    });

    expect(result.entries.map((entry) => entry.classification)).toEqual(["wrong", "missed"]);
    expect(result.entries.map((entry) => entry.parserSequenceIndex)).toEqual([0, null]);
    expect(result.counts.wrong).toBe(1);
  });

  it("searches for unaligned truth only between neighboring aligned source spans", () => {
    const extractedText = "30 then 32. 10 (12). 20 (22).";
    const firstStart = extractedText.indexOf("10 (12)");
    const lastStart = extractedText.indexOf("20 (22)");
    const result = analyzePattern({
      name: "position-aware-loss",
      sizeCount: 2,
      detectedSizeCount: 2,
      truth: [truth(["10", "12"]), truth(["30", "32"]), truth(["20", "22"])],
      sequences: [
        {
          kind: "sub",
          original: "10 (12)",
          values: ["10", "12"],
          start: firstStart,
          end: firstStart + "10 (12)".length,
        },
        {
          kind: "sub",
          original: "20 (22)",
          values: ["20", "22"],
          start: lastStart,
          end: lastStart + "20 (22)".length,
        },
      ],
      extractedText,
      structure: passingStructure,
    });

    expect(result.entries.map((entry) => entry.classification)).toEqual([
      "correct",
      "lost",
      "correct",
    ]);
  });

  it("aligns repeated identical groups to their occurrences in order", () => {
    const result = analyzePattern({
      name: "repeated",
      sizeCount: 2,
      detectedSizeCount: null,
      truth: [truth(["8", "10"]), truth(["8", "10"])],
      sequences: [sub("8 (10)", ["8", "10"]), sub("8 (10)", ["8", "10"])],
      extractedText: "",
      structure: passingStructure,
    });

    expect(result.entries.map((entry) => entry.parserSequenceIndex)).toEqual([0, 1]);
    expect(result.entries.map((entry) => entry.classification)).toEqual(["correct", "correct"]);
  });

  it("normalizes equivalent fractions and strips trailing units", () => {
    expect(gateValuesEqual(["14 1/2 cm", "8½"], ["14½", "8 1/2 in"])).toBe(true);
    expect(gateValuesEqual(["6th"], ["6"])).toBe(false);
    expect(valuesFoundInOrder("worked 14½ cm, then 8 1/2 inches", ["14 1/2", "8½"])).toBe(true);
    const result = analyzePattern({
      name: "fractions",
      sizeCount: 2,
      detectedSizeCount: 2,
      truth: [truth(["14 1/2 cm", "8½"])],
      sequences: [
        {
          kind: "sub",
          original: "14½ (8 1/2 in)",
          values: ["14½", "8 1/2 in"],
          sourceValues: ["14½", "8 1/2 in"],
        },
      ],
      extractedText: "",
      structure: passingStructure,
    });
    expect(result.entries[0]?.classification).toBe("correct");
  });

  it("finds a truth group after unrelated numbers in the document", () => {
    expect(
      valuesFoundInOrder("Gauge 20 sts per 10 cm. Cast on 48 (52, 56) sts.", ["48", "52", "56"]),
    ).toBe(true);
  });

  it("does not find a group when a separator contains another number", () => {
    expect(valuesFoundInOrder("Cast on 48, repeat 2 times, then 52 sts", ["48", "52"])).toBe(false);
  });

  it("uses the parser's public resolver API for the structural check at every size", () => {
    const text = "Sizes: S (M, L)\nCast on 10 (12, 14) sts.";
    const detected = findSizeList(text);
    expect(detected?.count).toBe(3);
    const resolutions = [0, 1, 2].map((chosenIndex) =>
      resolve(
        text,
        {
          count: 3,
          usesDashes: detected?.usesDashes ?? false,
          sizeListLine: detected?.lineIndex,
        },
        chosenIndex,
      ),
    );

    const inspected = inspectResolutions(text, resolutions);
    expect(inspected.structure).toMatchObject({
      passed: true,
      roundTrip: true,
      substitutionsOnly: true,
      stableAcrossSizes: true,
    });
    expect(inspected.sequences).toEqual([
      expect.objectContaining({
        kind: "sub",
        original: "10 (12, 14)",
        values: ["10", "12", "14"],
        sourceValues: ["10", "12", "14"],
      }),
    ]);
  });
});

describe("feasibility thresholds", () => {
  it("passes at the configured wrong-rate and median thresholds", () => {
    const result = calculateGateCriteria([
      { name: "one", counted: 100, correct: 99, wrong: 1, structurePassed: true },
      { name: "two", counted: 100, correct: 100, wrong: 0, structurePassed: true },
      { name: "three", counted: 100, correct: 100, wrong: 0, structurePassed: true },
    ]);

    expect(result).toMatchObject({
      evaluated: true,
      criterionA: true,
      wrongPatternCount: 1,
      criterionBPatterns: true,
      wrongTotal: 1,
      countedTotal: 300,
      wrongRate: 1 / 300,
      criterionBOverall: true,
      medianCorrectRate: 1,
      criterionC: true,
      passed: true,
    });
  });

  it("fails when too many patterns contain wrong substitutions or the median is below 80%", () => {
    const tooManyWrongPatterns = calculateGateCriteria([
      { name: "one", counted: 100, correct: 99, wrong: 1, structurePassed: true },
      { name: "two", counted: 100, correct: 99, wrong: 1, structurePassed: true },
      { name: "three", counted: 100, correct: 99, wrong: 1, structurePassed: true },
    ]);
    expect(tooManyWrongPatterns.criterionBPatterns).toBe(false);
    expect(tooManyWrongPatterns.wrongRate).toBe(0.01);
    expect(tooManyWrongPatterns.passed).toBe(false);

    const lowMedian = calculateGateCriteria([
      { name: "one", counted: 100, correct: 79, wrong: 0, structurePassed: true },
      { name: "two", counted: 100, correct: 79, wrong: 0, structurePassed: true },
      { name: "three", counted: 100, correct: 100, wrong: 0, structurePassed: true },
    ]);
    expect(lowMedian.medianCorrectRate).toBe(0.79);
    expect(lowMedian.criterionC).toBe(false);
  });

  it("leaves the gate unevaluated when there are no truth files", () => {
    expect(calculateGateCriteria([])).toMatchObject({
      evaluated: false,
      criterionA: null,
      criterionBPatterns: null,
      criterionBOverall: null,
      criterionC: null,
      passed: null,
    });
  });
});
