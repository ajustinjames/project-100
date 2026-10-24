import { describe, expect, it } from "vitest";
import { parseAmount } from "./amount.ts";
import type { CompareResult } from "./compare.ts";
import { compare, fieldMessages } from "./compare.ts";

function parsed(input: string) {
  return parseAmount(input);
}

function expectIncomplete(result: CompareResult) {
  expect(result.kind).toBe("incomplete");
  if (result.kind !== "incomplete") throw new Error("Expected incomplete comparison");
  return result;
}

describe("compare field rules", () => {
  it("accepts a positive gift no larger than a positive fortune and a positive net worth", () => {
    const result = compare({
      gift: parsed("10M"),
      fortune: parsed("200B"),
      unit: parsed("150K"),
    });

    expect(result.kind).toBe("result");
    if (result.kind !== "result") return;
    expect(result.share).toBe(0.00005);
    expect(result.equivalent).toBe(7.5);
  });

  it("shows the gift's own rule when the gift is zero or negative", () => {
    for (const gift of ["0", "-12K"]) {
      const result = compare({
        gift: parsed(gift),
        fortune: parsed("240B"),
        unit: parsed("85K"),
      });
      expect(expectIncomplete(result).errors.gift).toBe(fieldMessages.giftPositive);
    }
  });

  it("shows the fortune's own rule when the fortune is zero or negative", () => {
    for (const fortune of ["0", "-12K"]) {
      const result = compare({
        gift: parsed("100M"),
        fortune: parsed(fortune),
        unit: parsed("85K"),
      });
      expect(expectIncomplete(result).errors.fortune).toBe(fieldMessages.fortunePositive);
    }
  });

  it("puts the gift-over-fortune error on the gift only", () => {
    const result = compare({
      gift: parsed("241B"),
      fortune: parsed("240B"),
      unit: parsed("85K"),
    });

    expect(expectIncomplete(result).errors).toEqual({ gift: fieldMessages.giftOverFortune });
  });

  it("keeps a parse error ahead of that field's numeric rule", () => {
    const result = compare({
      gift: parsed("€100M"),
      fortune: parsed("240B"),
      unit: parsed("85K"),
    });

    expect(expectIncomplete(result).errors.gift).toContain("US dollars");
  });

  it("returns the net-worth message for a zero or negative net worth without a field error", () => {
    for (const netWorth of ["0", "-12K"]) {
      const result = compare({
        gift: parsed("100M"),
        fortune: parsed("240B"),
        unit: parsed(netWorth),
      });
      expect(result).toEqual({
        kind: "net-worth-zero",
        errors: {},
        message: fieldMessages.netWorthZero,
      });
    }
  });

  it("does not show the zero-net-worth message while another field is missing or invalid", () => {
    expect(compare({ gift: parsed(""), fortune: parsed("240B"), unit: parsed("0") })).toEqual({
      kind: "incomplete",
      errors: {},
    });
    expect(compare({ gift: parsed("100M"), fortune: parsed("abc"), unit: parsed("0") })).toEqual({
      kind: "incomplete",
      errors: { fortune: expect.any(String) },
    });
  });

  it("keeps empty fields message-free and incomplete", () => {
    expect(compare({ gift: parsed(""), fortune: parsed("240B"), unit: parsed("85K") })).toEqual({
      kind: "incomplete",
      errors: {},
    });
  });
});

describe("compare in income mode", () => {
  it("measures against a year of income and keeps the mode on the result", () => {
    const result = compare({
      gift: parsed("100M"),
      fortune: parsed("240B"),
      unit: parsed("60K"),
      mode: "income",
    });

    expect(result.kind).toBe("result");
    if (result.kind !== "result") return;
    expect(result.mode).toBe("income");
    expect(result.equivalent).toBe(25);
    expect(result.giftMultiple).toBeCloseTo(1_666.667, 3);
    expect(result.dotValue).toBe(600_000);
  });

  it("shows a field error for a yearly income of zero or less", () => {
    for (const income of ["0", "-12K"]) {
      const result = compare({
        gift: parsed("100M"),
        fortune: parsed("240B"),
        unit: parsed(income),
        mode: "income",
      });
      expect(expectIncomplete(result).errors).toEqual({ unit: fieldMessages.incomePositive });
    }
  });

  it("gives a result for a -12K net worth once switched to income", () => {
    const inputs = { gift: parsed("100M"), fortune: parsed("240B") };
    expect(compare({ ...inputs, unit: parsed("-12K") }).kind).toBe("net-worth-zero");
    expect(compare({ ...inputs, unit: parsed("60K"), mode: "income" }).kind).toBe("result");
  });
});

describe("compare results and dot plan", () => {
  it("matches the $100M, $240B, $85K example and applies the ten-times cap", () => {
    const result = compare({
      gift: parsed("100M"),
      fortune: parsed("240B"),
      unit: parsed("85K"),
    });

    expect(result.kind).toBe("result");
    if (result.kind !== "result") return;
    expect(result.share).toBeCloseTo(0.0004166666666666667);
    expect(result.equivalent).toBeCloseTo(35.41666666666667);
    expect(result.giftMultiple).toBeCloseTo(1176.4705882352941);
    expect(result.fortuneMultiple).toBeCloseTo(2_823_529.411764706);
    expect(result.dotValue).toBe(850_000);
    expect(result.dotScale).toBe(10);
    expect(result.giftDots).toBeCloseTo(117.6470588235294);
    expect(result.fortuneDots).toBeCloseTo(282_352.9411764706);
    expect(result.giftFullDots).toBe(117);
    expect(result.giftPartialDot).toBeCloseTo(0.6470588235294);
    expect(result.giftDrawnCount).toBe(118);
    expect(result.fortuneDrawnCount).toBe(282_353);
  });

  it("matches the $10M, $200B, $150K example", () => {
    const result = compare({
      gift: parsed("10M"),
      fortune: parsed("200B"),
      unit: parsed("150K"),
    });

    expect(result.kind).toBe("result");
    if (result.kind !== "result") return;
    expect(result.equivalent).toBe(7.5);
    expect(result.share).toBe(0.00005);
    expect(result.dotScale).toBe(1);
  });

  it("keeps one dot per net worth when floating point lands a hair over the cap (pre-launch review)", () => {
    // 170,000,020,000 / 85,000.01 is exactly 2,000,000, but comes out slightly more in floating point.
    const result = compare({
      gift: parsed("100M"),
      fortune: parsed("170000020000"),
      unit: parsed("85000.01"),
    });

    expect(result.kind).toBe("result");
    if (result.kind !== "result") return;
    expect(result.dotScale).toBe(1);
    expect(result.fortuneDots).toBeCloseTo(2_000_000, 6);
  });

  it("refuses a figure too small to compare instead of giving infinite multiples", () => {
    const result = expectIncomplete(
      compare({ gift: parsed("1"), fortune: parsed("100"), unit: parsed(`0.${"0".repeat(60)}1`) }),
    );
    expect(result.errors.unit).toBeDefined();
  });

  it("uses one dot per net worth below the cap and tracks a partial gift dot", () => {
    const result = compare({
      gift: parsed("250"),
      fortune: parsed("5,000"),
      unit: parsed("1,000"),
    });

    expect(result.kind).toBe("result");
    if (result.kind !== "result") return;
    expect(result.dotValue).toBe(1_000);
    expect(result.giftDots).toBe(0.25);
    expect(result.giftFullDots).toBe(0);
    expect(result.giftPartialDot).toBe(0.25);
    expect(result.giftDrawnCount).toBe(1);
    expect(result.fortuneDrawnCount).toBe(5);
  });

  it("uses the smallest power-of-ten dot value needed to stay under two million dots", () => {
    const result = compare({
      gift: parsed("1"),
      fortune: parsed("20,000,001"),
      unit: parsed("1"),
    });

    expect(result.kind).toBe("result");
    if (result.kind !== "result") return;
    expect(result.dotScale).toBe(100);
    expect(result.dotValue).toBe(100);
    expect(result.fortuneDots).toBeLessThanOrEqual(2_000_000);
    expect(20_000_001 / (result.dotValue / 10)).toBeGreaterThan(2_000_000);
  });

  it("returns text-only figures when the fortune is smaller than the reader's net worth", () => {
    const result = compare({
      gift: parsed("1,700"),
      fortune: parsed("400,000"),
      unit: parsed("1,000,000"),
    });

    expect(result).toEqual({
      kind: "small-fortune",
      mode: "net-worth",
      gift: 1_700,
      fortune: 400_000,
      unit: 1_000_000,
      share: 0.00425,
      equivalent: 4_250,
      giftMultiple: 0.0017,
      fortuneMultiple: 0.4,
      dotValue: 1_000_000,
      giftDots: 0.0017,
      fortuneDots: 0.4,
    });
  });
});
