import type { AmountParseResult } from "./amount.ts";

export const MAX_DRAWN_DOTS = 2_000_000;

export const fieldMessages = {
  giftPositive: "Enter a gift larger than zero.",
  fortunePositive: "Enter a fortune larger than zero.",
  giftOverFortune: "The gift is larger than the fortune. Check both figures.",
  netWorthZero:
    "With a net worth of zero or less, the same share comes to nothing. Compare with your yearly income instead.",
} as const;

export interface CompareInput {
  gift: AmountParseResult;
  fortune: AmountParseResult;
  netWorth: AmountParseResult;
}

export interface CompareErrors {
  gift?: string;
  fortune?: string;
  netWorth?: string;
}

interface ComparisonValues {
  gift: number;
  fortune: number;
  netWorth: number;
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
      gift: number;
      fortune: number;
      netWorth: number;
      share: number;
      equivalent: number;
      giftMultiple: number;
      fortuneMultiple: number;
    } & DotPlan)
  | {
      kind: "small-fortune";
      gift: number;
      fortune: number;
      netWorth: number;
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
  return errors.gift !== undefined || errors.fortune !== undefined || errors.netWorth !== undefined;
}

function createDotPlan({ gift, fortune, netWorth }: ComparisonValues): CompareResult {
  const share = gift / fortune;
  const equivalent = share * netWorth;
  const giftMultiple = gift / netWorth;
  const fortuneMultiple = fortune / netWorth;

  if (fortuneMultiple < 1) {
    return {
      kind: "small-fortune",
      gift,
      fortune,
      netWorth,
      share,
      equivalent,
      giftMultiple,
      fortuneMultiple,
      dotValue: netWorth,
      giftDots: giftMultiple,
      fortuneDots: fortuneMultiple,
    };
  }

  let dotValue = netWorth;
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
    gift,
    fortune,
    netWorth,
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
  const errors: CompareErrors = {};

  if (input.gift.kind === "invalid") errors.gift = input.gift.message;
  if (input.fortune.kind === "invalid") errors.fortune = input.fortune.message;
  if (input.netWorth.kind === "invalid") errors.netWorth = input.netWorth.message;

  const gift = parsedValue(input.gift);
  const fortune = parsedValue(input.fortune);
  const netWorth = parsedValue(input.netWorth);

  if (gift !== undefined && gift <= 0) errors.gift = fieldMessages.giftPositive;
  if (fortune !== undefined && fortune <= 0) errors.fortune = fieldMessages.fortunePositive;

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
  if (gift === undefined || fortune === undefined || netWorth === undefined)
    return { kind: "incomplete", errors };

  if (netWorth <= 0) return { kind: "net-worth-zero", errors, message: fieldMessages.netWorthZero };
  if (gift <= 0 || fortune <= 0 || gift > fortune) return { kind: "incomplete", errors };

  return createDotPlan({ gift, fortune, netWorth });
}
