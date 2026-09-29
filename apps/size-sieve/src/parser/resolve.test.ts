import { describe, expect, it } from "vitest";
import { rejoinSegments, resolve, type Segment } from "./resolve.ts";

function resolved(text: string, count: number, chosenIndex: number, usesDashes = false): Segment[] {
  return resolve(text, { count, usesDashes }, chosenIndex);
}

describe("resolve", () => {
  it("returns ordered text and substitution segments with the selected value", () => {
    expect(resolved("Cast on 80 (88, 96) sts", 3, 1)).toEqual([
      { kind: "text", text: "Cast on " },
      { kind: "sub", original: "80 (88, 96)", value: "88", notApplicable: false },
      { kind: "text", text: " sts" },
    ]);
  });

  it("marks placeholder values as not applicable", () => {
    const placeholders = ["-", "x", "X", "–", "—"];
    for (const placeholder of placeholders) {
      const segments = resolved(`10 (${placeholder}, 12)`, 3, 1);
      expect(segments.find((segment) => segment.kind === "sub")).toEqual({
        kind: "sub",
        original: `10 (${placeholder}, 12)`,
        value: placeholder,
        notApplicable: true,
      });
    }
    expect(resolved("10 (0, 12)", 3, 1).find((segment) => segment.kind === "sub")).toMatchObject({
      value: "0",
      notApplicable: false,
    });
  });

  it("keeps count mismatches and size-labelled instructions as flag segments", () => {
    expect(resolved("Cast on 10 (12, 14) sts", 5, 2)).toEqual([
      { kind: "text", text: "Cast on " },
      { kind: "flag", original: "10 (12, 14)", reason: "count-mismatch" },
      { kind: "text", text: " sts" },
    ]);
    expect(resolved("Work for size M only.", 3, 1)).toEqual([
      { kind: "text", text: "Work " },
      { kind: "flag", original: "for size M only", reason: "size-label" },
      { kind: "text", text: "." },
    ]);
  });

  it("leaves substitutions as text when the chosen index is invalid", () => {
    const text = "Cast on 10 (12, 14) sts";
    expect(resolved(text, 3, -1)).toEqual([{ kind: "text", text }]);
    expect(resolved(text, 3, 3)).toEqual([{ kind: "text", text }]);
    expect(resolved(text, 3, 1.5)).toEqual([{ kind: "text", text }]);
  });

  it("uses the supplied size-list line to keep the reference unchanged", () => {
    const text = "Sizes: XS (S, M)\nFinished chest: 30 (34, 38) cm\nCast on 20 (22, 24) sts";
    const segments = resolve(text, { count: 3, usesDashes: false, sizeListLine: 0 }, 1);
    expect(segments).toEqual([
      { kind: "text", text: "Sizes: XS (S, M)\nFinished chest: 30 (34, 38) cm\nCast on " },
      { kind: "sub", original: "20 (22, 24)", value: "22", notApplicable: false },
      { kind: "text", text: " sts" },
    ]);
  });

  it("rejoins every fixture to its exact original input", () => {
    const fixtures = [
      "Cast on 80 (88, 96, 104, 112) sts",
      "Work 31[35, 39, 43, 47]",
      "33¾ (38¼, 42½, 45¾) (50¼, 54½, 57¾, 62¼)",
      "1 (2, 3) [4, 5]",
      "Cast on 10 (12) sts",
      "Repeat 4/5/6/7/8 times",
      "104-112-120-128-136 sts",
      "104-112-120-128-136",
      "Cast on 80 (88, 96,\n104, 112) sts",
      "Tension 10.5 (11.5, 12.5)",
      "Tension 10,5 (11,5; 12,5)",
      "Needle 1/2 (2 1/4, ½)",
      "Length 2 1/4 (2¼, 33½)",
      "Length ½ (¾, 1½)",
      'Length 4" (5", 6")',
      "Cast on 10 (12, 14) sts",
      "Cast on 10 [12, 14, 16] sts",
      "Cast on 1 (2, 3) [4]",
      "Increase 4 (6) sts",
      "Repeat 4/5/6 times",
      "Repeat 4/5/6/7 times",
      "Sizes 1–3 only use the small chart.",
      "Work this for size M only.",
      "Repeat for the 2nd and 4th sizes.",
      "Work all sizes except XS.",
      "For size M work 10 (12, 14) sts.",
      "Sizes: 1 (2, 3, 4)\nCast on 20 (22, 24, 26) sts",
      "Repeat (k2, p2) twice.",
      "Turn at (RS).",
      "Work about (10 cm) from the edge.",
      "See (see chart) below.",
      "Repeat [k1, p1] 3 times.",
      "Repeat (10, 12, 14) stitches",
      'Measure 10 cm (4")',
      "Measure 10 cm (100 mm)",
      "Weigh 50 g (1¾ oz)",
      'Gauge: 22 sts and 30 rows = 10 cm (4")',
      "Finished chest: 30 (34, 38) cm",
      "Row 3 (4, 5): knit to C4F, then work M1L and k2tog",
      "Rnd 2 (dec rnd): work evenly",
      "Row 3 (RS): knit across",
      "Row 3: cast on 20 (22, 24) sts",
      '10 cm (4")',
      "10 (x)",
      "10 (12)",
      "k2 (4, 6) sts",
      "Made on 2026-09-28",
      "Made on 09-28-26",
      "Call 555-123-4567",
      "Work rows 1-4",
      "Use 4-5-6 sts",
      "Counts are 2-4-6",
      "Values 1-2-3-4",
      "Sizes: XS (S, M, L)\nFinished chest: 30 (34, 38, 42) cm\nCast on 80 (88, 96, 104) sts.",
      "Row 3 (RS): work 10 (12, 14) stitches, then repeat 4/5/6 times.",
      "Sizes: S - M - L\n104-112-120 sts\nUse rows 1-4 as written.",
      "Work for size M only; keep 10 (12) cm between markers.",
      "Tension 10,5 (11,5; 12,5) cm\nA wrapped group is 1 (2,\n3) [4, 5].",
      "A fraction 1/2, a phone 555-123-4567, and a date 2026-09-28 stay as text.",
      "",
    ];

    for (const text of fixtures) {
      for (const chosenIndex of [0, 1, 2]) {
        expect(rejoinSegments(resolved(text, 3, chosenIndex, true))).toBe(text);
      }
    }
  });

  it("resolves a large synthetic pattern without quadratic rescanning", () => {
    const line = "Cast on 80 (88, 96, 104, 112) stitches across the row.\n";
    const text = line.repeat(12_000);
    const segments = resolve(text, { count: 5, usesDashes: false }, 2);
    expect(segments.filter((segment) => segment.kind === "sub")).toHaveLength(12_000);
    expect(rejoinSegments(segments)).toBe(text);
  });
});
