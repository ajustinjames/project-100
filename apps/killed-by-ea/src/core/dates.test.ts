import { describe, expect, it } from "vitest";
import {
  comparePartialDates,
  formatAge,
  formatAgo,
  formatPartialDate,
  isPartialDateAfter,
  parsePartialDate,
} from "./dates.ts";
import type { PartialDate } from "./schema.ts";

describe("partial dates", () => {
  it("parses dates only when their value matches the stated precision", () => {
    expect(parsePartialDate({ value: "2026-10-21", precision: "day" })).toEqual({
      value: "2026-10-21",
      precision: "day",
    });
    expect(parsePartialDate({ value: "2025-05", precision: "month" })).toEqual({
      value: "2025-05",
      precision: "month",
    });
    expect(parsePartialDate({ value: "2003", precision: "year" })).toEqual({
      value: "2003",
      precision: "year",
    });
    expect(parsePartialDate({ precision: "unknown" })).toEqual({ precision: "unknown" });
    expect(parsePartialDate({ value: "2023-02-29", precision: "day" })).toBeNull();
    expect(parsePartialDate({ value: "2025-13", precision: "month" })).toBeNull();
    expect(parsePartialDate({ value: "2025-05", precision: "day" })).toBeNull();
  });

  it("compares known dates and leaves unknown dates unordered", () => {
    const may: PartialDate = { value: "2025-05", precision: "month" };
    const june: PartialDate = { value: "2025-06", precision: "month" };
    const unknown: PartialDate = { precision: "unknown" };
    expect(comparePartialDates(may, june)).toBe(-1);
    expect(comparePartialDates(june, may)).toBe(1);
    expect(comparePartialDates(may, { value: "2025", precision: "year" })).toBe(1);
    expect(comparePartialDates(unknown, may)).toBeNull();
  });

  it("detects only dates definitely after a partial end date", () => {
    expect(
      isPartialDateAfter(
        { value: "2025-06", precision: "month" },
        { value: "2025-05", precision: "month" },
      ),
    ).toBe(true);
    expect(
      isPartialDateAfter(
        { value: "2025-05", precision: "month" },
        { value: "2025", precision: "year" },
      ),
    ).toBe(false);
  });

  it("formats day, month, year, and unknown precision", () => {
    expect(formatPartialDate({ value: "2026-10-21", precision: "day" })).toBe("21 October 2026");
    expect(formatPartialDate({ value: "2025-05", precision: "month" })).toBe("May 2025");
    expect(formatPartialDate({ value: "2003", precision: "year" })).toBe("2003");
    expect(formatPartialDate({ precision: "unknown" })).toBe("Date unknown");
  });

  it("calculates whole-year ages at month and day precision", () => {
    expect(
      formatAge({ value: "2022-05", precision: "month" }, { value: "2025-05", precision: "month" }),
    ).toBe("3 years");
    expect(
      formatAge(
        { value: "2022-05-21", precision: "day" },
        { value: "2025-05-20", precision: "day" },
      ),
    ).toBe("2 years");
  });

  it("marks year-only ages as approximate and omits ages without a known start or end", () => {
    expect(
      formatAge({ value: "2000", precision: "year" }, { value: "2003", precision: "year" }),
    ).toBe("About 3 years");
    expect(
      formatAge({ value: "2000", precision: "year" }, { value: "2003-05", precision: "month" }),
    ).toBe("About 3 years");
    expect(formatAge(undefined, { value: "2025-05", precision: "month" })).toBeUndefined();
    expect(formatAge({ precision: "unknown" }, { precision: "unknown" })).toBeUndefined();
  });
});

describe("formatAgo", () => {
  const today = "2026-10-29";

  it("counts days, then whole months, then whole years for exact dates", () => {
    expect(formatAgo({ value: "2026-10-29", precision: "day" }, today)).toBe("today");
    expect(formatAgo({ value: "2026-10-28", precision: "day" }, today)).toBe("yesterday");
    expect(formatAgo({ value: "2026-10-21", precision: "day" }, today)).toBe("8 days ago");
    expect(formatAgo({ value: "2026-09-30", precision: "day" }, today)).toBe("29 days ago");
    expect(formatAgo({ value: "2026-09-29", precision: "day" }, today)).toBe("1 month ago");
    expect(formatAgo({ value: "2025-10-30", precision: "day" }, today)).toBe("11 months ago");
    expect(formatAgo({ value: "2025-10-29", precision: "day" }, today)).toBe("1 year ago");
    expect(formatAgo({ value: "2017-10-17", precision: "day" }, today)).toBe("9 years ago");
  });

  it("stays approximate for month and year dates", () => {
    expect(formatAgo({ value: "2026-10", precision: "month" }, today)).toBe("this month");
    expect(formatAgo({ value: "2026-09", precision: "month" }, today)).toBe("about a month ago");
    expect(formatAgo({ value: "2025-05", precision: "month" }, today)).toBe("about a year ago");
    expect(formatAgo({ value: "2013-06", precision: "month" }, today)).toBe("about 13 years ago");
    expect(formatAgo({ value: "2026", precision: "year" }, today)).toBe("this year");
    expect(formatAgo({ value: "2003", precision: "year" }, today)).toBe("about 23 years ago");
  });

  it("has nothing to say about an unknown date", () => {
    expect(formatAgo({ precision: "unknown" }, today)).toBeUndefined();
  });
});
