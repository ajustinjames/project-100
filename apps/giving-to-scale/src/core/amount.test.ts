import { describe, expect, it } from "vitest";
import {
  amountMessages,
  formatAmount,
  formatDotCount,
  formatMultiple,
  formatPercent,
  parseAmount,
} from "./amount.ts";

describe("parseAmount", () => {
  it.each(["", "   ", "\u00a0\u2009"])('returns empty for blank input "%s"', (input) => {
    expect(parseAmount(input)).toEqual({ kind: "empty" });
  });

  it.each([
    ["85000", 85_000],
    ["85,000", 85_000],
    ["85 000", 85_000],
    ["85\u00a0000", 85_000],
    ["100M", 100_000_000],
    ["100 m", 100_000_000],
    ["100mn", 100_000_000],
    ["100 million", 100_000_000],
    ["2.4B", 2_400_000_000],
    ["2.4 b", 2_400_000_000],
    ["2.4bn", 2_400_000_000],
    ["2.4 billion", 2_400_000_000],
    ["250K", 250_000],
    ["250k", 250_000],
    ["250 thousand", 250_000],
    ["1.2T", 1_200_000_000_000],
    ["1.2tn", 1_200_000_000_000],
    ["1.2 trillion", 1_200_000_000_000],
    [".5M", 500_000],
    ["5.", 5],
    ["$100M", 100_000_000],
    ["$ 100M", 100_000_000],
    ["-12K", -12_000],
    ["−12K", -12_000],
    ["- 12K", -12_000],
    ["0", 0],
    ["1000 trillion", 1e15],
  ])("parses %s", (input, value) => {
    expect(parseAmount(input)).toEqual({ kind: "ok", value });
  });

  it("reports a currency symbol that does not match the USD page", () => {
    expect(parseAmount("€100M")).toEqual({
      kind: "invalid",
      message: amountMessages.currency("€"),
    });
  });

  it.each(["1,5", "1,50", "12,3456", "1.234.567"])(
    'asks for a point for invalid decimal grouping in "%s"',
    (input) => {
      expect(parseAmount(input)).toEqual({ kind: "invalid", message: amountMessages.decimal });
    },
  );

  it.each([
    "8 5000",
    "1 2",
    "1,000 000",
    "1e9",
    "abc",
    "12 apples",
    "100 M dollars",
    "M100",
    "+12K",
  ])('returns the general error for "%s"', (input) => {
    expect(parseAmount(input)).toEqual({ kind: "invalid", message: amountMessages.invalid });
  });

  it("rejects values above the page limit after applying a suffix", () => {
    expect(parseAmount("1001 trillion")).toEqual({
      kind: "invalid",
      message: amountMessages.tooLarge,
    });
    expect(parseAmount("-1001 trillion")).toEqual({
      kind: "invalid",
      message: amountMessages.tooLarge,
    });
  });
});

describe("formatAmount", () => {
  it.each([
    [0, "$0"],
    [0.001, "less than $0.01"],
    [0.01, "$0.01"],
    [21.37, "$21.37"],
    [7.5, "$7.50"],
    [100, "$100"],
    [100.4, "$100"],
    [85_000, "$85,000"],
    [1_000_000, "$1 million"],
    [2_400_000, "$2.4 million"],
    [100_000_000, "$100 million"],
    [240_000_000_000, "$240 billion"],
    [1_230_000_000_000, "$1.23 trillion"],
    [1e15, "$1 quadrillion"],
  ])("formats %s as %s", (value, expected) => {
    expect(formatAmount(value, "USD", "en-US")).toBe(expected);
  });

  it("uses the locale's currency placement and grouping", () => {
    expect(formatAmount(85_000, "USD", "de-DE")).toBe("85.000 $");
  });

  it("throws when asked to format a negative amount", () => {
    expect(() => formatAmount(-1)).toThrow(RangeError);
  });
});

describe("percentage and multiple formatting", () => {
  it.each([
    [0.0004166666666666667, "0.042%"],
    [0.00005, "0.005%"],
    [0.1234, "12%"],
    [1, "100%"],
    [1e-25, "0.00000000000000000000001%"],
  ])("formats share %s as %s", (share, expected) => {
    expect(formatPercent(share, "en-US")).toBe(expected);
  });

  it.each([
    [0.4, "0.4"],
    [0.0017, "0.0017"],
    [2.46, "2.5"],
    [1_176.47, "1,176"],
    [2_823_529.4, "2,823,529"],
  ])("formats multiple %s as %s", (value, expected) => {
    expect(formatMultiple(value, "en-US")).toBe(expected);
  });

  it.each([
    [0.03, "0.03"],
    [117.647, "117.6"],
    [282_352.94, "282,353"],
  ])("formats dot count %s as %s", (value, expected) => {
    expect(formatDotCount(value, "en-US")).toBe(expected);
  });
});
