import { type Currency, isCurrency } from "./amount.ts";

/**
 * The share link lives in the URL fragment, which browsers don't send in requests:
 * #v=1&gift=<amount>&fortune=<amount>&cur=<ISO code>
 * It carries the gift, the fortune, and the currency, never the reader's own figure.
 */
export interface SharedGift {
  gift: number;
  fortune: number;
  currency: Currency;
}

const MAX_AMOUNT = 1e15;
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const SINGLE_KEYS = ["v", "gift", "fortune", "cur"] as const;

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A plain decimal with at most two decimal places, no grouping or exponent. */
function amountText(value: number): string {
  const fixed = value.toFixed(2);
  if (fixed.endsWith(".00")) return fixed.slice(0, -3);
  if (fixed.endsWith("0")) return fixed.slice(0, -1);
  return fixed;
}

/** How far rounding may move the share before a link would show a different comparison. */
const MAX_SHARE_CHANGE = 1e-6;

/**
 * Build the fragment for a gift and fortune, rounded to two decimal places.
 * Returns null when rounding would change the share by more than one part in a million
 * (a gift of $0.005 against $0.014, say), or the gift rounds to zero: such links would
 * show a different comparison, so they can't be shared.
 */
export function encodeShareFragment(
  gift: number,
  fortune: number,
  currency: Currency,
): string | null {
  const roundedGift = roundToCents(gift);
  const roundedFortune = roundToCents(fortune);
  if (!(roundedGift > 0) || !(roundedFortune >= roundedGift) || roundedFortune > MAX_AMOUNT) {
    return null;
  }
  const share = gift / fortune;
  if (Math.abs(roundedGift / roundedFortune - share) > share * MAX_SHARE_CHANGE) return null;
  return `#v=1&gift=${amountText(roundedGift)}&fortune=${amountText(roundedFortune)}&cur=${currency}`;
}

function decodeAmount(text: string | null): number | null {
  if (text === null || !AMOUNT_PATTERN.test(text)) return null;
  const value = Number(text);
  if (!(value > 0) || value > MAX_AMOUNT) return null;
  return value;
}

/** Read a shared gift from a fragment. Anything not exactly valid is ignored entirely. */
export function decodeShareFragment(hash: string): SharedGift | null {
  const text = hash.startsWith("#") ? hash.slice(1) : hash;
  if (text === "") return null;

  const params = new URLSearchParams(text);
  if (SINGLE_KEYS.some((key) => params.getAll(key).length > 1)) return null;
  if (params.get("v") !== "1") return null;

  const currency = params.get("cur");
  if (currency === null || !isCurrency(currency)) return null;

  const gift = decodeAmount(params.get("gift"));
  const fortune = decodeAmount(params.get("fortune"));
  if (gift === null || fortune === null || gift > fortune) return null;

  return { gift, fortune, currency };
}
