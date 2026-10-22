import type { AmountParseResult } from "./amount.ts";

export const MAX_DRAWN_DOTS = 2_000_000;

/** What the reader's own figure is: everything they own, or a year of their income. */
export type Mode = "net-worth" | "income";

export const fieldMessages = {
  giftPositive: "Enter a gift larger than zero.",
  fortunePositive: "Enter a fortune larger than zero.",
  giftOverFortune: "The gift is larger than the fortune. Check both figures.",
  netWorthZero: "With a net worth of zero or less, the same share comes to nothing.",
  incomePositive: "Enter a yearly income larger than zero.",
} as const;

export interface CompareInput {
  gift: AmountParseResult;
  fortune: AmountParseResult;
  /** The reader's own figure: net worth, or yearly income in income mode. */
  unit: AmountParseResult;
  mode?: Mode;
}

export interface CompareErrors {
  gift?: string;
  fortune?: string;
  unit?: string;
}

interface ComparisonValues {
  mode: Mode;
  gift: number;
  fortune: number;
  unit: number;
}

export interface DotPlan {
  dotValue: number;
  dotScale: number;
  giftDots: number;
  fortuneDots: number;
  giftDrawnDots: number;
  fortuneDrawnDots: number;
  giftFullDots: number;
  giftPartialDot: number;
  giftDrawnCount: number;
  fortuneDrawnCount: number;
}

export type CompareResult =
  | { kind: "incomplete"; errors: CompareErrors }
  | { kind: "net-worth-zero"; errors: CompareErrors; message: string }
  | ({
      kind: "result";
      mode: Mode;
      gift: number;
      fortune: number;
      unit: number;
      share: number;
      equivalent: number;
      giftMultiple: number;
      fortuneMultiple: number;
    } & DotPlan)
  | {
      kind: "small-fortune";
      mode: Mode;
      gift: number;
      fortune: number;
      unit: number;
      share: number;
      equivalent: number;
      giftMultiple: number;
      fortuneMultiple: number;
      dotValue: number;
      giftDots: number;
      fortuneDots: number;
    };

function parsedValue(result: AmountParseResult): number | undefined {
  return result.kind === "ok" ? result.value : undefined;
}

function hasError(errors: CompareErrors): boolean {
  return errors.gift !== undefined || errors.fortune !== undefined || errors.unit !== undefined;
}

function createDotPlan({ mode, gift, fortune, unit }: ComparisonValues): CompareResult {
  const share = gift / fortune;
  const equivalent = share * unit;
  const giftMultiple = gift / unit;
  const fortuneMultiple = fortune / unit;

  if (fortuneMultiple < 1) {
    return {
      kind: "small-fortune",
      mode,
      gift,
      fortune,
      unit,
      share,
      equivalent,
      giftMultiple,
      fortuneMultiple,
      dotValue: unit,
      giftDots: giftMultiple,
      fortuneDots: fortuneMultiple,
    };
  }

  let dotValue = unit;
  let dotScale = 1;
  while (fortune / dotValue > MAX_DRAWN_DOTS) {
    dotValue *= 10;
    dotScale *= 10;
  }

  const giftDots = gift / dotValue;
  const fortuneDots = fortune / dotValue;
  const giftDrawnDots = giftDots;
  const fortuneDrawnDots = fortuneDots;

  return {
    kind: "result",
    mode,
    gift,
    fortune,
    unit,
    share,
    equivalent,
    giftMultiple,
    fortuneMultiple,
    dotValue,
    dotScale,
    giftDots,
    fortuneDots,
    giftDrawnDots,
    fortuneDrawnDots,
    giftFullDots: Math.floor(giftDots),
    giftPartialDot: giftDots - Math.floor(giftDots),
    giftDrawnCount: Math.ceil(giftDots),
    fortuneDrawnCount: Math.ceil(fortuneDots),
  };
}

/** Validate parsed fields, then compute the comparison and its one-dot plan. */
export function compare(input: CompareInput): CompareResult {
  const mode = input.mode ?? "net-worth";
  const errors: CompareErrors = {};

  if (input.gift.kind === "invalid") errors.gift = input.gift.message;
  if (input.fortune.kind === "invalid") errors.fortune = input.fortune.message;
  if (input.unit.kind === "invalid") errors.unit = input.unit.message;

  const gift = parsedValue(input.gift);
  const fortune = parsedValue(input.fortune);
  const unit = parsedValue(input.unit);

  if (gift !== undefined && gift <= 0) errors.gift = fieldMessages.giftPositive;
  if (fortune !== undefined && fortune <= 0) errors.fortune = fieldMessages.fortunePositive;
  // An income of zero or less is a field error; a net worth of zero or less gets its own message.
  if (mode === "income" && unit !== undefined && unit <= 0)
    errors.unit = fieldMessages.incomePositive;

  const giftIsValid = gift !== undefined && gift > 0 && errors.gift === undefined;
  const fortuneIsValid = fortune !== undefined && fortune > 0 && errors.fortune === undefined;
  if (
    giftIsValid &&
    fortuneIsValid &&
    gift !== undefined &&
    fortune !== undefined &&
    gift > fortune
  ) {
    errors.gift = fieldMessages.giftOverFortune;
  }

  if (hasError(errors)) return { kind: "incomplete", errors };
  if (gift === undefined || fortune === undefined || unit === undefined)
    return { kind: "incomplete", errors };

  if (unit <= 0) return { kind: "net-worth-zero", errors, message: fieldMessages.netWorthZero };
  if (gift <= 0 || fortune <= 0 || gift > fortune) return { kind: "incomplete", errors };

  return createDotPlan({ mode, gift, fortune, unit });
}
