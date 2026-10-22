import { describe, expect, it } from "vitest";
import { parseAmount } from "../core/amount.ts";
import { compare } from "../core/compare.ts";
import { ownText, smallFortuneText } from "./field.ts";

function parsed(input: string) {
  return parseAmount(input);
}

describe("smallFortuneText", () => {
  it("measures both the fortune and the gift against everything the reader owns", () => {
    const result = compare({
      gift: parsed("1,700"),
      fortune: parsed("400,000"),
      unit: parsed("1,000,000"),
    });
    if (result.kind !== "small-fortune")
      throw new Error(`Expected small-fortune, got ${result.kind}`);

    expect(smallFortuneText(result, "en-US")).toBe(
      "Their whole fortune is 0.4 of everything you own. The gift is 0.0017 of everything you own.",
    );
  });
});

describe("ownText", () => {
  it("names the reader's figure by mode", () => {
    expect(ownText("net-worth")).toBe("everything you own");
    expect(ownText("income")).toBe("a year of your income");
  });

  it("words the small-fortune text against a year of income in income mode", () => {
    const result = compare({
      gift: parsed("1,700"),
      fortune: parsed("400,000"),
      unit: parsed("1,000,000"),
      mode: "income",
    });
    if (result.kind !== "small-fortune")
      throw new Error(`Expected small-fortune, got ${result.kind}`);

    expect(smallFortuneText(result, "en-US")).toBe(
      "Their whole fortune is 0.4 of a year of your income. The gift is 0.0017 of a year of your income.",
    );
  });
});
