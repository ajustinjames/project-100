import { describe, expect, it } from "vitest";
import { findSizeList } from "./sizes.ts";

describe("findSizeList", () => {
  it("reads textual labels from a parenthesized list", () => {
    expect(findSizeList("Sizes: XS (S, M, L)\nCast on 80 (88, 96, 104) sts")).toEqual({
      labels: ["XS", "S", "M", "L"],
      count: 4,
      sourceLine: "Sizes: XS (S, M, L)",
      lineIndex: 0,
      usesDashes: false,
      conflict: null,
    });
  });

  it("allows leading whitespace before a size-list header", () => {
    expect(findSizeList("  Sizes: 1 (2, 3)\nCast on 20 (22, 24) sts")).toEqual({
      labels: ["1", "2", "3"],
      count: 3,
      sourceLine: "  Sizes: 1 (2, 3)",
      lineIndex: 0,
      usesDashes: false,
      conflict: null,
    });
  });

  it("counts grouped numeric labels and alternation labels", () => {
    expect(findSizeList("Size: 1 (2, 3, 4, 5) (6, 7, 8, 9)\nInstructions")).toMatchObject({
      labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
      count: 9,
      lineIndex: 0,
      usesDashes: false,
    });

    expect(findSizeList("Sizes: XXS (XS) S (M) L\nBody")).toMatchObject({
      labels: ["XXS", "XS", "S", "M", "L"],
      count: 5,
      usesDashes: false,
    });
  });

  it("detects a dash-form size list and measurement values", () => {
    expect(findSizeList("Sizes: S - M - L - XL - XXL\nCast on")).toMatchObject({
      labels: ["S", "M", "L", "XL", "XXL"],
      count: 5,
      usesDashes: true,
    });

    expect(findSizeList('Finished chest: 32 (36, 40)"\nInstructions')).toMatchObject({
      labels: ["32", "36", "40"],
      count: 3,
      usesDashes: false,
      lineIndex: 0,
    });

    for (const line of [
      "To fit: 32 (36, 40)",
      "Finished measurements: 32 (36, 40)",
      "Chest: 32 (36, 40)",
      "Bust: 32 (36, 40)",
    ]) {
      expect(findSizeList(`${line}\nBody`)?.count).toBe(3);
    }
  });

  it("finds labels below a Size heading and ignores audience and measurement-system text", () => {
    expect(
      findSizeList("Size\n\nNote: sizes are shown below\n\nWomen's XS (S, M, L)\nCast on"),
    ).toEqual({
      labels: ["XS", "S", "M", "L"],
      count: 4,
      sourceLine: "Women's XS (S, M, L)",
      lineIndex: 4,
      usesDashes: false,
      conflict: null,
    });

    expect(
      findSizeList("Measurements\nChest: 31[35, 39] inches / 78.5[89, 99] cm\nInstructions"),
    ).toMatchObject({
      labels: ["31", "35", "39"],
      count: 3,
      sourceLine: "Chest: 31[35, 39] inches / 78.5[89, 99] cm",
      lineIndex: 1,
    });
    expect(
      findSizeList("Finished measurements: 30 (34, 38) inches [76 (86, 96) cm]"),
    ).toMatchObject({
      labels: ["30", "34", "38"],
      count: 3,
    });

    expect(
      findSizeList("Sizes:\nIntroduction\nAnother note\nFourth line: no list\nCast on"),
    ).toBeNull();
  });

  it("uses measurement labels and the listed inch and metric units", () => {
    const units = ['"', "”", "″", "''", "in", "in.", "inch", "inches", "cm", "mm"];
    for (const unit of units) {
      expect(findSizeList(`Upper arm / chest: 30 (34, 38) ${unit}`)).toMatchObject({
        count: 3,
        sourceLine: `Upper arm / chest: 30 (34, 38) ${unit}`,
      });
    }
    expect(findSizeList("Yoke, sleeve length — 30 (34, 38) in. / 76 (86, 96) cm")).toMatchObject({
      count: 3,
      usesDashes: false,
    });
  });

  it("prefers a labels line and reports a conflicting measurement count", () => {
    const result = findSizeList(
      "Sizes: XS (S, M, L)\nFinished bust: 30 (34, 38, 42, 46) cm\nCast on",
    );
    expect(result).toMatchObject({
      labels: ["XS", "S", "M", "L"],
      count: 4,
      lineIndex: 0,
      conflict: "Size labels show 4 sizes; a measurement line shows 5.",
    });
  });

  it("prefers labels when the measurement count agrees and does not report a conflict", () => {
    const result = findSizeList("Finished chest: 30 (34, 38) cm\nSizes: XS (S, M)\nBody");
    expect(result).toMatchObject({
      labels: ["XS", "S", "M"],
      count: 3,
      sourceLine: "Sizes: XS (S, M)",
      lineIndex: 1,
      conflict: null,
    });
  });

  it("does not search beyond the first instruction heading or line 60", () => {
    expect(findSizeList("Cast on 2 (4, 6)\nSizes: XS (S, M)")).toBeNull();

    const withinLimit = Array.from({ length: 59 }, () => "intro");
    withinLimit.push("Sizes: XS (S)");
    expect(findSizeList(withinLimit.join("\n"))?.lineIndex).toBe(59);

    const beyondLimit = Array.from({ length: 60 }, () => "intro");
    beyondLimit.push("Sizes: XS (S)");
    expect(findSizeList(beyondLimit.join("\n"))).toBeNull();
  });

  it("returns null for missing headers, malformed lists, and a single label", () => {
    expect(findSizeList("XS (S, M)\nCast on")).toBeNull();
    expect(findSizeList("Sizes: XS (S, M is large)\nInstructions")).toBeNull();
    expect(findSizeList("To fit: XS\nBody")).toBeNull();
    expect(findSizeList("To fit:\nXS (S, M)\nBody")).toBeNull();
  });
});
