import { type Currency, currencyDetails } from "../core/amount.ts";
import type { Mode } from "../core/compare.ts";

/** Wording that changes with the mode. */
export const modeText = {
  "net-worth": {
    unitLabel: "My net worth is",
    unitPlaceholder: "85K",
    switchTo: "Compare with yearly income instead",
    answerLabel: "The same share of your net worth is",
    enterUnit: "Enter your net worth to see your share.",
    reverseTail: "the same share of their fortune would be",
  },
  income: {
    unitLabel: "My yearly income is",
    unitPlaceholder: "60K",
    switchTo: "Compare with net worth instead",
    answerLabel: "The same percentage of your yearly income is",
    enterUnit: "Enter your yearly income to see your share.",
    reverseTail: "the same percentage of their fortune as of my yearly income would be",
  },
} as const satisfies Record<Mode, Record<string, string>>;

export function currencyLabelText(currency: Currency): string {
  return `in ${currencyDetails[currency].name}`;
}

/**
 * Write an amount from a share link back into an input, exactly and readably:
 * comma grouping and a point for decimals, which parseAmount accepts in every locale.
 */
export function amountInputText(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

const MAX_INPUT_CHARACTERS = 18;

/** Widen an input to fit what's typed, so a long figure stays readable on a phone. */
export function fitInputWidth(input: HTMLInputElement): void {
  const characters = Math.max(input.value.length, input.placeholder.length);
  // The width includes the input's padding and border (box-sizing: border-box).
  input.style.width = `calc(${Math.min(characters, MAX_INPUT_CHARACTERS)}ch + 1.25rem)`;
}
