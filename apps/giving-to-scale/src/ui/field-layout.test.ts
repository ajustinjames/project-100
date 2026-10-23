import { describe, expect, it } from "vitest";
import {
  calculateFieldLayout,
  calculateGiftBlock,
  DOT_PITCH,
  type DotBand,
  GIFT_BLOCK_MAX_CSS_HEIGHT,
  LANDMARK_EDGE_CLEARANCE,
  LANDMARK_MIN_SPACING,
  planDotBands,
  planLandmarks,
  roundStepAtLeast,
} from "./field-layout.ts";

/** Count the dots a plan draws, by colour, to check that nothing is lost or doubled. */
function countDots(bands: DotBand[], columns: number) {
  let gift = 0;
  let fortune = 0;
  let rows = 0;
  for (const band of bands) {
    if (band.kind === "rows") {
      rows += band.rows;
      if (band.color === "gift") gift += band.rows * columns;
      else fortune += band.rows * columns;
      continue;
    }
    rows += 1;
    for (const segment of band.segments) {
      if (segment.kind === "dots") {
        if (segment.color === "gift") gift += segment.count;
        else fortune += segment.count;
      } else {
        gift += segment.gift;
        fortune += segment.fortune;
      }
    }
  }
  return { gift, fortune, rows };
}

describe("calculateFieldLayout", () => {
  it.each([
    [360, 120],
    [1200, 400],
  ])("lays 2,000,000 dots across %s CSS px", (width, columns) => {
    const layout = calculateFieldLayout(width, 2_000_000);
    expect(layout.columns).toBe(columns);
    expect(layout.rows).toBe(Math.ceil(2_000_000 / columns));
    expect(layout.totalHeight).toBe(layout.rows * DOT_PITCH);
  });

  it("uses one column for widths below one pitch", () => {
    const layout = calculateFieldLayout(2, 4);
    expect(layout.columns).toBe(1);
    expect(layout.rows).toBe(4);
    expect(layout.totalHeight).toBe(12);
  });

  it("rejects invalid widths and dot counts", () => {
    expect(() => calculateFieldLayout(0, 1)).toThrow(RangeError);
    expect(() => calculateFieldLayout(360, 0)).toThrow(RangeError);
  });
});

describe("planDotBands", () => {
  // Rows of 4 dots: [0, 4), [4, 8), [8, 12), ...
  it("draws a gift inside one row with a partial dot, then the fortune", () => {
    expect(planDotBands(4, 3.5, 20)).toEqual([
      {
        kind: "row",
        segments: [
          { kind: "dots", color: "gift", count: 3 },
          { kind: "partial", gift: 0.5, fortune: 0.5 },
        ],
      },
      { kind: "rows", color: "fortune", rows: 4 },
    ]);
  });

  it("draws a gift spanning rows as full gift rows, then the row where it ends", () => {
    expect(planDotBands(4, 9.25, 20)).toEqual([
      { kind: "rows", color: "gift", rows: 2 },
      {
        kind: "row",
        segments: [
          { kind: "dots", color: "gift", count: 1 },
          { kind: "partial", gift: 0.25, fortune: 0.75 },
          { kind: "dots", color: "fortune", count: 2 },
        ],
      },
      { kind: "rows", color: "fortune", rows: 2 },
    ]);
  });

  it("starts the fortune on a fresh row when the gift ends on a row boundary", () => {
    expect(planDotBands(4, 8, 20)).toEqual([
      { kind: "rows", color: "gift", rows: 2 },
      { kind: "rows", color: "fortune", rows: 3 },
    ]);
  });

  it("supports a gift equal to the fortune, with a partial final dot", () => {
    expect(planDotBands(4, 4.5, 4.5)).toEqual([
      { kind: "rows", color: "gift", rows: 1 },
      { kind: "row", segments: [{ kind: "partial", gift: 0.5, fortune: 0 }] },
    ]);
  });

  it("ends the fortune with a partial dot in its last row", () => {
    expect(planDotBands(4, 2, 10.25)).toEqual([
      {
        kind: "row",
        segments: [
          { kind: "dots", color: "gift", count: 2 },
          { kind: "dots", color: "fortune", count: 2 },
        ],
      },
      { kind: "rows", color: "fortune", rows: 1 },
      {
        kind: "row",
        segments: [
          { kind: "dots", color: "fortune", count: 2 },
          { kind: "partial", gift: 0, fortune: 0.25 },
        ],
      },
    ]);
  });

  it("draws a gift under one dot as one partially filled dot", () => {
    expect(planDotBands(4, 0.03, 4)[0]).toEqual({
      kind: "row",
      segments: [
        { kind: "partial", gift: 0.03, fortune: 0.97 },
        { kind: "dots", color: "fortune", count: 3 },
      ],
    });
  });

  it("handles the gift and the fortune ending in the same row", () => {
    expect(planDotBands(4, 1.5, 2.75)).toEqual([
      {
        kind: "row",
        segments: [
          { kind: "dots", color: "gift", count: 1 },
          { kind: "partial", gift: 0.5, fortune: 0.5 },
          { kind: "partial", gift: 0, fortune: 0.75 },
        ],
      },
    ]);
  });

  it.each([
    [120, 117.647_058_823_529_4, 282_352.941_176_470_6],
    [400, 117.647_058_823_529_4, 282_352.941_176_470_6],
    [120, 1_176_470.588, 2_000_000],
    [7, 3, 3],
    [1, 0.4, 2.5],
  ])("draws every dot once at %s columns (gift %s, fortune %s)", (columns, gift, fortune) => {
    const bands = planDotBands(columns, gift, fortune);
    const counted = countDots(bands, columns);
    expect(counted.gift).toBeCloseTo(gift, 6);
    expect(counted.gift + counted.fortune).toBeCloseTo(fortune, 6);
    expect(counted.rows).toBe(Math.ceil(fortune / columns));
    // A handful of elements, whatever the size: at most two whole-row bands and two ragged rows.
    expect(bands.length).toBeLessThanOrEqual(4);
  });

  it("rejects a gift larger than the fortune", () => {
    expect(() => planDotBands(4, 5, 4)).toThrow(RangeError);
  });
});

describe("calculateGiftBlock", () => {
  it("lays out the worked example's 117.6 gift dots as an 11 by 11 block", () => {
    expect(calculateGiftBlock(117.647, 400)).toEqual({
      columns: 11,
      rows: 11,
      cssWidth: 33,
      cssHeight: 33,
    });
  });

  it("draws a gift under one dot as a single partial dot", () => {
    expect(calculateGiftBlock(0.03, 400)).toEqual({
      columns: 1,
      rows: 1,
      cssWidth: 3,
      cssHeight: 3,
    });
  });

  it("never uses more columns than the field has", () => {
    const block = calculateGiftBlock(3_000, 50);
    expect(block?.columns).toBe(50);
    expect(block?.rows).toBe(60);
  });

  it("returns null when the block would be taller than the limit", () => {
    const tallestRows = GIFT_BLOCK_MAX_CSS_HEIGHT / DOT_PITCH;
    expect(calculateGiftBlock(100 * tallestRows, 100)).not.toBeNull();
    expect(calculateGiftBlock(100 * tallestRows + 1, 100)).toBeNull();
  });
});

describe("roundStepAtLeast", () => {
  it("picks the smallest 1, 2, or 5 times a power of ten at or above the minimum", () => {
    expect(roundStepAtLeast(1)).toBe(1);
    expect(roundStepAtLeast(1.1)).toBe(2);
    expect(roundStepAtLeast(2)).toBe(2);
    expect(roundStepAtLeast(3)).toBe(5);
    expect(roundStepAtLeast(5.01)).toBe(10);
    expect(roundStepAtLeast(340)).toBe(500);
    expect(roundStepAtLeast(0.03)).toBe(0.05);
    expect(roundStepAtLeast(1.7e9)).toBe(2e9);
  });

  it("rejects a minimum that is not positive", () => {
    expect(() => roundStepAtLeast(0)).toThrow(RangeError);
    expect(() => roundStepAtLeast(Number.NaN)).toThrow(RangeError);
  });
});

describe("planLandmarks", () => {
  it("places a landmark every round step, at the row where that amount is reached", () => {
    // 100 columns of $1 dots: a row is $100 and 3 px, so 300 px is $10,000.
    const landmarks = planLandmarks(100, 1, 100_000);
    expect(landmarks.map((landmark) => landmark.amount)).toEqual([
      10_000, 20_000, 30_000, 40_000, 50_000, 60_000, 70_000, 80_000, 90_000,
    ]);
    expect(landmarks[0]?.top).toBe(300);
    expect(landmarks[8]?.top).toBe(2700);
  });

  it("keeps landmarks 300 to 750 px apart at any width and dot value", () => {
    for (const columns of [100, 133, 250, 400]) {
      for (const dotValue of [1, 215_900, 2_159_000, 0.37]) {
        const landmarks = planLandmarks(columns, dotValue, 2_000_000);
        expect(landmarks.length).toBeGreaterThan(1);
        for (let index = 1; index < landmarks.length; index += 1) {
          const gap = (landmarks[index]?.top ?? 0) - (landmarks[index - 1]?.top ?? 0);
          expect(gap).toBeGreaterThanOrEqual(LANDMARK_MIN_SPACING - DOT_PITCH);
          expect(gap).toBeLessThanOrEqual(2.5 * LANDMARK_MIN_SPACING + DOT_PITCH);
        }
      }
    }
  });

  it("draws none on a field shorter than one step", () => {
    expect(planLandmarks(100, 1, 5_000)).toEqual([]);
  });

  it("leaves out a landmark too close to the field's end for its label", () => {
    // The field is 1,005 rows (3,015 px); $100,000 would sit at 3,000 px, 15 px from the end.
    const landmarks = planLandmarks(100, 1, 100_500);
    expect(landmarks.at(-1)?.amount).toBe(90_000);
    expect(landmarks.every((landmark) => landmark.top <= 3_015 - LANDMARK_EDGE_CLEARANCE)).toBe(
      true,
    );
  });

  it("never draws a landmark at or past the fortune itself", () => {
    const landmarks = planLandmarks(100, 1, 100_000);
    expect(landmarks.every((landmark) => landmark.amount < 100_000)).toBe(true);
  });

  it("rejects invalid inputs", () => {
    expect(() => planLandmarks(0, 1, 100)).toThrow(RangeError);
    expect(() => planLandmarks(100, 0, 100)).toThrow(RangeError);
    expect(() => planLandmarks(100, 1, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
