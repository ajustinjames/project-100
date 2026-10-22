import { describe, expect, it } from "vitest";
import { parseAmount } from "../core/amount.ts";
import { amountInputText } from "./form.ts";

describe("amountInputText", () => {
  it.each([
    [100_000_000, "100,000,000"],
    [240e9, "240,000,000,000"],
    [0.4, "0.4"],
    [1234.56, "1,234.56"],
    [1e15, "1,000,000,000,000,000"],
  ])("writes %s as %s, which parses back exactly", (value, text) => {
    expect(amountInputText(value)).toBe(text);
    expect(parseAmount(text)).toEqual({ kind: "ok", value });
  });
});
