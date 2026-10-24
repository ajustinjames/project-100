import type { PartialDate } from "./schema.ts";

export interface DateParts {
  year: number;
  month?: number;
  day?: number;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Parses and validates the value/precision pair used in the archive. */
export function parsePartialDate(value: unknown): PartialDate | null {
  if (!isRecord(value)) return null;
  if (value.precision === "unknown") {
    return Object.hasOwn(value, "value") ? null : { precision: "unknown" };
  }
  if (typeof value.value !== "string") return null;

  if (value.precision === "year" && /^\d{4}$/.test(value.value)) {
    const year = Number(value.value);
    return year >= 1 ? { value: value.value, precision: "year" } : null;
  }

  if (value.precision === "month" && /^(\d{4})-(\d{2})$/.test(value.value)) {
    const match = /^(\d{4})-(\d{2})$/.exec(value.value);
    if (match === null) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    return year >= 1 && month >= 1 && month <= 12
      ? { value: value.value, precision: "month" }
      : null;
  }

  if (value.precision === "day" && /^(\d{4})-(\d{2})-(\d{2})$/.test(value.value)) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.value);
    if (match === null) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month)
      ? { value: value.value, precision: "day" }
      : null;
  }

  return null;
}

export function dateParts(date: PartialDate): DateParts | null {
  if (date.precision === "unknown") return null;
  const [yearText, monthText, dayText] = date.value.split("-");
  const year = Number(yearText);
  const month = monthText === undefined ? undefined : Number(monthText);
  const day = dayText === undefined ? undefined : Number(dayText);
  return { year, ...(month === undefined ? {} : { month }), ...(day === undefined ? {} : { day }) };
}

function firstDay(date: PartialDate): string | null {
  if (date.precision === "unknown") return null;
  if (date.precision === "year") return `${date.value}-01-01`;
  if (date.precision === "month") return `${date.value}-01`;
  return date.value;
}

function lastDay(date: PartialDate): string | null {
  if (date.precision === "unknown") return null;
  if (date.precision === "year") return `${date.value}-12-31`;
  if (date.precision === "month") {
    const parts = dateParts(date);
    if (parts?.month === undefined) return null;
    return `${date.value}-${String(daysInMonth(parts.year, parts.month)).padStart(2, "0")}`;
  }
  return date.value;
}

/** Returns chronological order by the first day each partial date can represent. */
export function comparePartialDates(left: PartialDate, right: PartialDate): number | null {
  const leftStart = firstDay(left);
  const rightStart = firstDay(right);
  if (leftStart === null || rightStart === null) return null;
  return leftStart < rightStart ? -1 : leftStart > rightStart ? 1 : 0;
}

/** True only when the start date is definitely later than every date the end can represent. */
export function isPartialDateAfter(start: PartialDate, end: PartialDate): boolean {
  const startDay = firstDay(start);
  const endLastDay = lastDay(end);
  return startDay !== null && endLastDay !== null && startDay > endLastDay;
}

export function formatPartialDate(date: PartialDate): string {
  if (date.precision === "unknown") return "Date unknown";
  const parts = dateParts(date);
  if (parts === null) return "Date unknown";
  if (date.precision === "year") return String(parts.year);
  const month = parts.month === undefined ? "" : MONTHS[parts.month - 1];
  if (date.precision === "month") return `${month} ${parts.year}`;
  return `${parts.day} ${month} ${parts.year}`;
}

/** Returns a display string when a start and an end year are both known. */
export function formatAge(start: PartialDate | undefined, end: PartialDate): string | undefined {
  if (start === undefined || start.precision === "unknown" || end.precision === "unknown") {
    return undefined;
  }
  const startParts = dateParts(start);
  const endParts = dateParts(end);
  if (startParts === null || endParts === null) return undefined;

  const yearDifference = endParts.year - startParts.year;
  if (start.precision === "year" || end.precision === "year") {
    return `About ${yearDifference} ${yearDifference === 1 ? "year" : "years"}`;
  }

  const startMonth = startParts.month ?? 1;
  const endMonth = endParts.month ?? 1;
  const startDay = startParts.day ?? 1;
  const endDay = endParts.day ?? 1;
  const hasReachedAnniversary =
    endMonth > startMonth || (endMonth === startMonth && endDay >= startDay);
  const fullYears = yearDifference - (hasReachedAnniversary ? 0 : 1);
  return `${fullYears} ${fullYears === 1 ? "year" : "years"}`;
}
