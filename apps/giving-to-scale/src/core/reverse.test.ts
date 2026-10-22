import { describe, expect, it } from "vitest";
import { amountMessages, formatAmount, parseAmount } from "./amount.ts";
import { reverseGift } from "./reverse.ts";

describe("reverseGift", () => {
  it("applies $50 of an $85K net worth to a $240B fortune", () => {
    const result = reverseGift(parseAmount("50"), 240e9, 85_000);
    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.amount).toBeCloseTo(141_176_470.588, 2);
    expect(formatAmount(result.amount, "USD", "en-US")).toBe("$141 million");
  });

  it("uses the same sum in income mode, against a year of income", () => {
    const result = reverseGift(parseAmount("600"), 240e9, 60_000);
    expect(result).toEqual({ kind: "ok", amount: 2.4e9 });
  });

  it.each(["", "0", "-50"])('waits, with no error, for "%s"', (input) => {
    expect(reverseGift(parseAmount(input), 240e9, 85_000)).toEqual({ kind: "pending" });
  });

  it("passes on the parse message for an invalid amount", () => {
    expect(reverseGift(parseAmount("1,5"), 240e9, 85_000)).toEqual({
      kind: "invalid",
      message: amountMessages.decimal,
    });
  });

  it("throws when called without a positive fortune and unit", () => {
    expect(() => reverseGift(parseAmount("50"), 240e9, 0)).toThrow(RangeError);
    expect(() => reverseGift(parseAmount("50"), 0, 85_000)).toThrow(RangeError);
  });
});
