import type { AmountParseResult } from "./amount.ts";

export type ReverseResult =
  | { kind: "pending" }
  | { kind: "invalid"; message: string }
  | { kind: "ok"; amount: number };

/**
 * "If I gave 50, the same share of their fortune would be ...":
 * the reader's gift as a share of their own figure, applied to the fortune.
 * Zero, negative, or empty gifts show "…" with no error.
 */
export function reverseGift(
  yourGift: AmountParseResult,
  fortune: number,
  unit: number,
): ReverseResult {
  if (!(fortune > 0) || !(unit > 0))
    throw new RangeError("reverseGift needs a positive fortune and unit");
  if (yourGift.kind === "invalid") return { kind: "invalid", message: yourGift.message };
  if (yourGift.kind === "empty" || yourGift.value <= 0) return { kind: "pending" };
  return { kind: "ok", amount: (yourGift.value / unit) * fortune };
}
