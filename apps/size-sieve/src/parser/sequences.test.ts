import { describe, expect, it } from "vitest";
import { findSequences, getSizeListBlockLineIndices } from "./sequences.ts";

function matches(text: string, count: number, usesDashes = false, sizeListLine?: number) {
  return findSequences(text, { count, usesDashes, sizeListLine });
}

describe("findSequences: supported shapes", () => {
  it("finds parenthesis and square-bracket sequences", () => {
    expect(matches("Cast on 80 (88, 96, 104, 112) sts", 5)).toEqual([
      expect.objectContaining({
        original: "80 (88, 96, 104, 112)",
        values: ["80", "88", "96", "104", "112"],
        kind: "sub",
      }),
    ]);

    expect(matches("Work 31[35, 39, 43, 47]", 5)).toEqual([
      expect.objectContaining({
        original: "31[35, 39, 43, 47]",
        values: ["31", "35", "39", "43", "47"],
        kind: "sub",
      }),
    ]);
  });

  it("finds grouped lists whose counts add up to N", () => {
    expect(matches("33¾ (38¼, 42½, 45¾) (50¼, 54½, 57¾, 62¼)", 8)).toEqual([
      expect.objectContaining({
        kind: "sub",
        values: ["33¾", "38¼", "42½", "45¾", "50¼", "54½", "57¾", "62¼"],
      }),
    ]);
    expect(matches("1 (2, 3) [4, 5]", 5)[0]).toMatchObject({
      kind: "sub",
      values: ["1", "2", "3", "4", "5"],
    });
  });

  it("finds two-size patterns only when N is two", () => {
    expect(matches("Cast on 10 (12) sts", 2)[0]).toMatchObject({
      kind: "sub",
      original: "10 (12)",
      values: ["10", "12"],
    });
    expect(matches("Cast on 10 [12] sts", 2)[0]).toMatchObject({ kind: "sub" });
    expect(matches("Cast on 10 (12) sts", 3)).toEqual([]);
    expect(matches("10 (12, 14)", 2)[0]).toMatchObject({
      kind: "flag",
      reason: "count-mismatch",
    });
  });

  it("finds slash runs of exactly N values and leaves other counts alone", () => {
    expect(matches("Repeat 4/5/6/7/8 times", 5)[0]).toMatchObject({
      kind: "sub",
      values: ["4", "5", "6", "7", "8"],
    });
    expect(matches("Repeat 4/5/6 times", 5)).toEqual([]);
    expect(matches("Repeat 4/5/6/7 times", 5)).toEqual([]);
    expect(matches("The fraction is 1/2 and the other is 3/4", 3)).toEqual([]);
    expect(matches("Date 2026/09/28", 3)).toEqual([]);
  });

  it("finds dash runs only for dash-form size lists", () => {
    expect(matches("104-112-120-128-136 sts", 5, true)[0]).toMatchObject({
      kind: "sub",
      values: ["104", "112", "120", "128", "136"],
    });
    expect(matches("104-112-120-128-136", 5, true)[0]).toMatchObject({
      kind: "flag",
      reason: "count-mismatch",
    });
    expect(matches("104-112-120-128-136 sts", 5, false)).toEqual([]);
    expect(matches("104-112-120-128 sts", 5, true)).toEqual([]);
  });

  it("allows a sequence to wrap across a line break", () => {
    expect(matches("Cast on 80 (88, 96,\n104, 112) sts", 5)[0]).toMatchObject({
      kind: "sub",
      original: "80 (88, 96,\n104, 112)",
    });
  });

  it("parses decimals and listed fractions", () => {
    expect(matches("Tension 10.5 (11.5, 12.5)", 3)[0]).toMatchObject({ kind: "sub" });
    expect(matches("Tension 10,5 (11,5; 12,5)", 3)[0]).toMatchObject({
      kind: "sub",
      values: ["10,5", "11,5", "12,5"],
    });
    expect(matches("Needle 1/2 (2 1/4, ½)", 3)[0]).toMatchObject({
      kind: "sub",
      values: ["1/2", "2 1/4", "½"],
    });
    expect(matches("Length 2 1/4 (2¼, 33½)", 3)[0]).toMatchObject({
      kind: "sub",
      values: ["2 1/4", "2¼", "33½"],
    });
    expect(matches("Length ½ (¾, 1½)", 3)[0]).toMatchObject({
      kind: "sub",
      values: ["½", "¾", "1½"],
    });
    expect(matches("Tension 10,5 (11,5, 12,5)", 3)).toEqual([]);
  });

  it("accepts unit suffixes with matching families and keeps values intact", () => {
    expect(matches("Length 10 cm (11 cm, 12 cm)", 3)[0]).toMatchObject({
      kind: "sub",
      values: ["10 cm", "11 cm", "12 cm"],
    });
    expect(matches('Length 4" (5", 6")', 3)[0]).toMatchObject({ kind: "sub" });
  });
});

describe("findSequences: outcome table", () => {
  it("flags wrong parenthesis, bracket, and grouped counts", () => {
    expect(matches("Cast on 10 (12, 14) sts", 5)[0]).toMatchObject({
      kind: "flag",
      reason: "count-mismatch",
    });
    expect(matches("Cast on 10 [12, 14, 16] sts", 5)[0]).toMatchObject({
      kind: "flag",
      reason: "count-mismatch",
    });
    expect(matches("Cast on 1 (2, 3) [4]", 8)[0]).toMatchObject({
      kind: "flag",
      reason: "count-mismatch",
    });
  });

  it("leaves a single bracketed value alone when N is greater than two", () => {
    expect(matches("Increase 4 (6) sts", 5)).toEqual([]);
    expect(matches("Increase 4 [6 cm]", 5)).toEqual([]);
    expect(matches("Increase 4 (6, 8) sts", 3)[0]).toMatchObject({ kind: "sub" });
  });

  it("leaves wrong-count slash and dash runs as plain text", () => {
    expect(matches("Counts 4/5/6", 5)).toEqual([]);
    expect(matches("Counts 4-5-6-7", 5, true)).toEqual([]);
  });

  it("flags size-labelled instructions", () => {
    const examples: Array<[string, string]> = [
      ["Sizes 1–3 only use the small chart.", "Sizes 1–3 only"],
      ["Work this for size M only.", "for size M only"],
      ["For sizes M and L only, work next round.", "For sizes M and L only"],
      ["Work size 2 only.", "size 2 only"],
      ["Sizes XS, S and M only are worked the same way.", "Sizes XS, S and M only"],
      ["Work the 2nd and 4th sizes only.", "2nd and 4th sizes only"],
      ["Repeat for the 2nd and 4th sizes.", "2nd and 4th sizes"],
      ["Work all sizes except XS.", "all sizes except XS"],
      ["Work all sizes except XS and S.", "all sizes except XS and S"],
    ];
    for (const [text, label] of examples) {
      expect(matches(text, 5)).toEqual([
        expect.objectContaining({ original: label, kind: "flag", reason: "size-label" }),
      ]);
    }
    expect(matches("For size M work 10 (12, 14) sts.", 3)).toEqual([
      expect.objectContaining({ kind: "sub", original: "10 (12, 14)" }),
    ]);
  });

  it("does not flag nearby ordinary prose as size-labelled instructions", () => {
    const examples = [
      "Only work the next round.",
      "All sizes are listed here.",
      "Sizes are given in parentheses.",
      "Work sizes M and L together.",
    ];
    for (const text of examples) expect(matches(text, 5)).toEqual([]);
  });

  it("does not interpret a size-list label line as an instruction", () => {
    const text = "Sizes: 1 (2, 3, 4)\nCast on 20 (22, 24, 26) sts";
    expect(matches(text, 4, false, 0)).toEqual([
      expect.objectContaining({ kind: "sub", original: "20 (22, 24, 26)" }),
    ]);
    expect(
      getSizeListBlockLineIndices("Sizes: XS (S, M)\nFinished chest: 30 (34, 38) cm\nCast on", 0),
    ).toEqual([0, 1]);
    expect(matches(text, 4).map((match) => match.original)).toEqual(["20 (22, 24, 26)"]);
  });
});

describe("findSequences: conservative exclusions and traps", () => {
  it("rejects groups containing words, stitch instructions, and chart references", () => {
    const examples = [
      "Repeat (k2, p2) twice.",
      "Turn at (RS).",
      "Work about (10 cm) from the edge.",
      "See (see chart) below.",
      "Repeat [k1, p1] 3 times.",
    ];
    for (const text of examples) expect(matches(text, 3)).toEqual([]);
    expect(matches("Repeat 8 (10, 12) stitches", 3)[0]).toMatchObject({ kind: "sub" });
  });

  it("rejects unit conversions and gauge statements", () => {
    expect(matches('Measure 10 cm (4")', 2)).toEqual([]);
    expect(matches("Measure 10 cm (100 mm)", 2)).toEqual([]);
    expect(matches("Weigh 50 g (1¾ oz)", 2)).toEqual([]);
    expect(matches('Gauge: 22 sts and 30 rows = 10 cm (4")', 2)).toEqual([]);
    expect(matches("Cast on 22 (24, 26) sts", 3)[0]).toMatchObject({ kind: "sub" });
  });

  it("skips measurement lines adjacent to the size list", () => {
    const text =
      "Sizes: XS (S, M)\nFinished chest: 30 (34, 38) cm\nBust: 32 (36, 40) cm\nCast on 20 (22, 24) sts";
    expect(matches(text, 3, false, 0).map((match) => match.original)).toEqual(["20 (22, 24)"]);
  });

  it("protects the measurement block by its heading and extent", () => {
    const text =
      "Sizes: XS (S, M)\nFinished measurements\nChest: 30 (34, 38) cm\nBody length: 20 (22, 24) cm\nCast on 10 (12, 14) sts";
    expect(getSizeListBlockLineIndices(text)).toEqual([0, 1, 2, 3]);
    expect(matches(text, 3).map((match) => match.original)).toEqual(["10 (12, 14)"]);
  });

  it("protects measurement rows even when there is no measurement heading", () => {
    const text =
      "Chest: 30 (34, 38) cm\nBody length: 20 (22, 24) cm\nSleeve length: 15 (17, 19) cm\nCast on 10 (12, 14) sts";
    expect(matches(text, 3).map((match) => match.original)).toEqual(["10 (12, 14)"]);
  });

  it("uses a detected size-list line without a colon as a measurement-block heading", () => {
    const text =
      "Sizes XS (S, M)\nChest: 30 (34, 38) cm\nBody length: 20 (22, 24) cm\nCast on 10 (12, 14) sts";
    expect(matches(text, 3).map((match) => match.original)).toEqual(["10 (12, 14)"]);
  });

  it("ends a measurement block at a blank line", () => {
    const text = "Measurements\nChest: 30 (34, 38) cm\n\nContinue 10 (12, 14) rows";
    expect(matches(text, 3).map((match) => match.original)).toEqual(["10 (12, 14)"]);
  });

  it("does not treat row labels, instruction names, or codes as sequences", () => {
    expect(matches("Row 3 (4, 5): knit to C4F, then work M1L and k2tog", 3)).toEqual([]);
    expect(matches("Rnd 2 (dec rnd): work evenly", 3)).toEqual([]);
    expect(matches("Row 3 (RS): knit across", 3)).toEqual([]);
    expect(matches("Row 3: cast on 20 (22, 24) sts", 3)).toEqual([
      expect.objectContaining({ kind: "sub", original: "20 (22, 24)" }),
    ]);
  });

  it("protects row labels at instruction boundaries and after any row word form", () => {
    const examples = [
      "Instructions: Row 1 (2, 3): knit",
      "Rows 1 (2, 3): knit",
      "The next section; Rnds 1 (2, 3): knit",
      "After this. Rounds 1 [2, 3] work evenly",
      "At the end, row 1 (2, 3):",
    ];
    for (const text of examples) expect(matches(text, 3)).toEqual([]);
  });

  it("still substitutes a repeat count that follows rows mid-sentence", () => {
    expect(matches("rep last 2 rows 5 (6, 7) more times", 3)).toEqual([
      expect.objectContaining({ kind: "sub", original: "5 (6, 7)" }),
    ]);
  });

  it("keeps the two-size conversion, placeholder, and row-label traps unchanged", () => {
    expect(matches('10 cm (4")', 2)).toEqual([]);
    expect(matches("10 (x)", 2)).toEqual([]);
    expect(matches("10 (12)", 2, false, 0)).toEqual([]);
    expect(matches("Row 3 (4, 5)", 2)).toEqual([]);
    expect(matches("k2 (4, 6) sts", 2)).toEqual([]);
  });

  it("keeps dates, phone numbers, ranges, and dash runs outside dash-form lists", () => {
    expect(matches("Made on 2026-09-28", 3, true)).toEqual([]);
    expect(matches("Made on 09-28-26", 3, true)).toEqual([]);
    expect(matches("Call 555-123-4567", 3, true)).toEqual([]);
    expect(matches("Work rows 1-4", 3, true)).toEqual([]);
    expect(matches("Use 4-5-6 sts", 3, false)).toEqual([]);
  });

  it("flags an exact dash run without a following unit, including prose runs", () => {
    expect(matches("Counts are 2-4-6", 3, true)[0]).toMatchObject({
      kind: "flag",
      reason: "count-mismatch",
    });
  });

  it("does not flag a range or dash run with a different count", () => {
    expect(matches("Work rows 1-4", 3, true)).toEqual([]);
    expect(matches("Values 1-2-3-4", 3, true)).toEqual([]);
  });

  it("does not scan beyond a pattern's configured size count", () => {
    expect(matches("Cast on 10 (12, 14, 16) sts", 0)).toEqual([]);
    expect(matches("Cast on 10 (12, 14, 16) sts", -1)).toEqual([]);
  });
});
