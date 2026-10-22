export type AmountParseResult =
  | { kind: "empty" }
  | { kind: "ok"; value: number }
  | { kind: "invalid"; message: string };

export const CURRENCIES = ["USD", "CAD", "AUD", "EUR", "GBP", "INR", "JPY"] as const;
export type Currency = (typeof CURRENCIES)[number];

interface CurrencyDetails {
  /** The symbol a reader might type before an amount. */
  symbol: string;
  /** Lower-case name used inside sentences: "This page is set to euros." */
  name: string;
  /** The smallest amount shown without "less than": a cent, or one yen. */
  smallestUnit: number;
}

export const currencyDetails: Record<Currency, CurrencyDetails> = {
  USD: { symbol: "$", name: "US dollars", smallestUnit: 0.01 },
  CAD: { symbol: "$", name: "Canadian dollars", smallestUnit: 0.01 },
  AUD: { symbol: "$", name: "Australian dollars", smallestUnit: 0.01 },
  EUR: { symbol: "€", name: "euros", smallestUnit: 0.01 },
  GBP: { symbol: "£", name: "British pounds", smallestUnit: 0.01 },
  INR: { symbol: "₹", name: "Indian rupees", smallestUnit: 0.01 },
  JPY: { symbol: "¥", name: "Japanese yen", smallestUnit: 1 },
};

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

export const amountMessages = {
  invalid: "Enter an amount like 100M or 2.4 billion.",
  decimal: "Use a point for decimals, like 1.5M.",
  tooLarge: "That's larger than this page can handle.",
  currency: (currency: Currency, symbol: string) =>
    `This page is set to ${currencyDetails[currency].name}. Change the currency above, or remove the ${symbol}.`,
} as const;

const suffixMultipliers: Record<string, number> = {
  k: 1e3,
  thousand: 1e3,
  m: 1e6,
  mn: 1e6,
  million: 1e6,
  b: 1e9,
  bn: 1e9,
  billion: 1e9,
  t: 1e12,
  tn: 1e12,
  trillion: 1e12,
};

const currencySymbols = ["$", "€", "£", "₹", "¥"] as const;
const spaceSeparators = /[ \u00a0\u2009]/;
const generalInvalid = (): AmountParseResult => ({
  kind: "invalid",
  message: amountMessages.invalid,
});
const decimalInvalid = (): AmountParseResult => ({
  kind: "invalid",
  message: amountMessages.decimal,
});

/** Parse a shorthand amount in the page's currency. */
export function parseAmount(text: string, currency: Currency = "USD"): AmountParseResult {
  let input = text.trim();
  if (input === "") return { kind: "empty" };

  input = input.replaceAll("−", "-");
  const leadingSymbol = currencySymbols.find((symbol) => input.startsWith(symbol));
  if (leadingSymbol !== undefined) {
    if (leadingSymbol !== currencyDetails[currency].symbol) {
      return { kind: "invalid", message: amountMessages.currency(currency, leadingSymbol) };
    }
    input = input.slice(1).trimStart();
  }

  let multiplier = 1;
  const suffixMatch = input.match(/\s*(thousand|million|billion|trillion|mn|bn|tn|k|m|b|t)$/i);
  if (suffixMatch !== null) {
    const suffix = suffixMatch[1];
    const suffixMultiplier =
      suffix === undefined ? undefined : suffixMultipliers[suffix.toLowerCase()];
    if (suffixMultiplier === undefined) return generalInvalid();
    multiplier = suffixMultiplier;
    input = input.slice(0, suffixMatch.index ?? input.length).trimEnd();
  }

  const signMatch = input.match(/^-\s*/);
  const negative = signMatch !== null;
  if (negative) input = input.slice(signMatch[0].length);

  if (input === ".") return generalInvalid();
  if ((input.match(/\./g)?.length ?? 0) > 1) return decimalInvalid();

  const decimalIndex = input.indexOf(".");
  const integerPart = decimalIndex === -1 ? input : input.slice(0, decimalIndex) || "0";
  const fractionPart = decimalIndex === -1 ? undefined : input.slice(decimalIndex + 1);
  if (fractionPart !== undefined && !/^\d*$/.test(fractionPart)) return generalInvalid();

  let integerDigits = integerPart;
  const hasComma = integerPart.includes(",");
  const hasSpace = spaceSeparators.test(integerPart);
  if (hasComma || hasSpace) {
    const separators = new Set(integerPart.match(/[, \u00a0\u2009]/g));
    if (separators.size !== 1) return generalInvalid();
    const separator = [...separators][0];
    if (separator === undefined) return generalInvalid();
    const groups = integerPart.split(separator);
    const validGrouping =
      groups.length > 1 &&
      groups[0] !== undefined &&
      /^[0-9]{1,3}$/.test(groups[0]) &&
      groups.slice(1).every((group) => /^[0-9]{3}$/.test(group));
    if (!validGrouping) return hasComma ? decimalInvalid() : generalInvalid();
    integerDigits = groups.join("");
  }

  if (!/^\d+$/.test(integerDigits)) return generalInvalid();
  const numericText =
    fractionPart === undefined ? integerDigits : `${integerDigits}.${fractionPart}`;
  let value = Number(numericText) * multiplier;
  if (negative) value = -value;

  if (!Number.isFinite(value)) return { kind: "invalid", message: amountMessages.tooLarge };
  if (Math.abs(value) > 1e15) return { kind: "invalid", message: amountMessages.tooLarge };
  return { kind: "ok", value };
}

const compactUnits = ["", "thousand", "million", "billion", "trillion", "quadrillion"] as const;

function currencyFormatter(
  locale: string,
  currency: Currency,
  fractionDigits: number,
): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function expandScientificNotation(value: number, significantDigits: number): string {
  const rounded = value.toPrecision(significantDigits);
  if (!rounded.includes("e") && !rounded.includes("E")) {
    return rounded.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  const [coefficientPart, exponentPart] = rounded.toLowerCase().split("e");
  const coefficient = coefficientPart ?? rounded;
  const exponentText = exponentPart ?? "0";
  const exponent = Number(exponentText);
  const negative = coefficient.startsWith("-");
  const unsigned = negative ? coefficient.slice(1) : coefficient;
  const decimalPosition =
    (unsigned.indexOf(".") === -1 ? unsigned.length : unsigned.indexOf(".")) + exponent;
  const digits = unsigned.replace(".", "");
  let expanded: string;

  if (decimalPosition <= 0) {
    expanded = `0.${"0".repeat(-decimalPosition)}${digits}`;
  } else if (decimalPosition >= digits.length) {
    expanded = `${digits}${"0".repeat(decimalPosition - digits.length)}`;
  } else {
    expanded = `${digits.slice(0, decimalPosition)}.${digits.slice(decimalPosition)}`;
  }

  expanded = expanded.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return negative ? `-${expanded}` : expanded;
}

function localizedDecimal(value: number, significantDigits: number, locale: string): string {
  const decimal = expandScientificNotation(value, significantDigits);
  const separator = new Intl.NumberFormat(locale)
    .formatToParts(1.1)
    .find((part) => part.type === "decimal")?.value;
  return separator === undefined ? decimal : decimal.replace(".", separator);
}

/** Format a non-negative amount using the browser locale for separators. */
export function formatAmount(value: number, currency: Currency = "USD", locale = "en-US"): string {
  if (value < 0 || !Number.isFinite(value))
    throw new RangeError("formatAmount requires a finite non-negative amount");
  if (value === 0) return currencyFormatter(locale, currency, 0).format(0);

  const { smallestUnit } = currencyDetails[currency];
  // Yen have no minor unit, so small yen amounts are whole yen.
  const smallFractionDigits = smallestUnit < 1 ? 2 : 0;
  if (value < smallestUnit) {
    return `less than ${currencyFormatter(locale, currency, smallFractionDigits).format(smallestUnit)}`;
  }
  if (value < 100) return currencyFormatter(locale, currency, smallFractionDigits).format(value);
  if (value < 1e6) return currencyFormatter(locale, currency, 0).format(value);

  let unitIndex = Math.floor(Math.log10(value) / 3);
  unitIndex = Math.min(unitIndex, compactUnits.length - 1);
  let scaled = value / 10 ** (unitIndex * 3);
  if (scaled >= 999.5 && unitIndex < compactUnits.length - 1) {
    unitIndex += 1;
    scaled = value / 10 ** (unitIndex * 3);
  }
  const amount = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumSignificantDigits: 3,
  }).format(scaled);
  return `${amount} ${compactUnits[unitIndex]}`;
}

export function formatPercent(share: number, locale = "en-US"): string {
  const percent = share * 100;
  if (percent === 0) return "less than 0.01%";
  return `${localizedDecimal(percent, 2, locale)}%`;
}

export function formatMultiple(value: number, locale = "en-US"): string {
  if (value < 1) return localizedDecimal(value, 2, locale);
  if (value < 10) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

export function formatDotCount(value: number, locale = "en-US"): string {
  if (value < 1) return localizedDecimal(value, 2, locale);
  if (value < 1000) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}
