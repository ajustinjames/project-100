import { describe, expect, it } from "vitest";
import { parseAmount } from "../core/amount.ts";
import { compare } from "../core/compare.ts";
import { smallFortuneText } from "./field.ts";

function parsed(input: string) {
  return parseAmount(input);
}

describe("smallFortuneText", () => {
  it("measures both the fortune and the gift against everything the reader owns", () => {
    const result = compare({
      gift: parsed("1,700"),
      fortune: parsed("400,000"),
      netWorth: parsed("1,000,000"),
    });
    if (result.kind !== "small-fortune")
      throw new Error(`Expected small-fortune, got ${result.kind}`);

    expect(smallFortuneText(result, "en-US")).toBe(
      "Their whole fortune is 0.4 of everything you own. The gift is 0.0017 of everything you own.",
    );
  });
});
