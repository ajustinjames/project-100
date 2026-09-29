import {
  findSizeList,
  isBareSequenceLine,
  isLabelOnlyMeasurementLine,
  isMeasurementRow,
  isSizeBlockHeading,
  isSizeLabelsLine,
} from "./sizes.ts";

export interface SequenceOptions {
  count: number;
  usesDashes: boolean;
  /** Zero-based line index returned by findSizeList(). */
  sizeListLine?: number;
}

export type LocatedSequence =
  | {
      start: number;
      end: number;
      original: string;
      kind: "sub";
      values: string[];
    }
  | {
      start: number;
      end: number;
      original: string;
      kind: "flag";
      reason: "count-mismatch" | "size-label";
    };

interface ParsedValue {
  text: string;
  end: number;
  placeholder: boolean;
  family: string;
  commaDecimal: boolean;
  supportedUnit: boolean;
}

interface ParsedGroup {
  end: number;
  values: ParsedValue[];
  usesSemicolons: boolean;
  usesDashes: boolean;
}

interface Candidate {
  start: number;
  end: number;
  values: string[];
  outcome: "sub" | "count-mismatch";
  usesDashBracket?: boolean;
}

const SIZE_LABEL_EXCLUSIONS = [
  /\b(?:for\s+)?sizes?\s+(?:[A-Za-z0-9]+(?:\s*(?:,|and|&)\s*[A-Za-z0-9]+)*|[A-Za-z0-9]+\s*[-–—]\s*[A-Za-z0-9]+)\s+only\b/gi,
  /\b\d+(?:st|nd|rd|th)(?:\s*(?:,|and|&)\s*\d+(?:st|nd|rd|th))*\s+sizes?(?:\s+only)?\b/gi,
  /\ball\s+sizes\s+except\s+[A-Za-z0-9]+(?:\s*(?:,|and|&)\s*[A-Za-z0-9]+)*\b/gi,
];
const INSTRUCTION_HEADING =
  /^\s*(?:cast\s+on\b|instructions?\b|body(?=\s*(?::|$))|back(?=\s*(?::|$)))/i;
const DASH_UNITS = new Set([
  "sts",
  "stitches",
  "st",
  "rows",
  "rounds",
  "rnds",
  "times",
  "cm",
  "mm",
  "in",
  "g",
  "m",
  "yds",
  "balls",
  "skeins",
  "hanks",
  "ch",
  "sc",
  "dc",
  "hdc",
]);

/**
 * Returns the line indices that are a size list or part of the nearby size and
 * measurement block. Those lines are references for the reader, not instructions.
 */
export function getSizeListBlockLineIndices(text: string, sizeListLine?: number): number[] {
  const lines = text.split(/\r?\n/);
  const skipped = new Set<number>();

  if (sizeListLine !== undefined && sizeListLine >= 0 && sizeListLine < lines.length) {
    skipped.add(sizeListLine);
  }
  const detectedSizeListLine = findSizeList(text)?.lineIndex;
  if (detectedSizeListLine !== undefined) skipped.add(detectedSizeListLine);

  const blockStarts = new Set<number>();
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) continue;

    if (isMeasurementRow(line)) skipped.add(index);
    if (isSizeBlockHeading(line)) blockStarts.add(index);
  }

  for (const start of blockStarts) {
    for (let index = start; index < lines.length; index += 1) {
      const line = lines[index];
      if (line === undefined) break;
      if (index > start && INSTRUCTION_HEADING.test(line)) break;

      // Blank and note lines belong to the block; the first other unknown line ends it.
      const continues =
        index === start ||
        line.trim() === "" ||
        /^\s*notes?\b/i.test(line) ||
        isMeasurementRow(line) ||
        isBareSequenceLine(line) ||
        isLabelOnlyMeasurementLine(line) ||
        /^\s*to\s+fit\b/i.test(line) ||
        isSizeLabelsLine(line);
      if (!continues) break;
      skipped.add(index);
    }
  }

  return [...skipped].sort((left, right) => left - right);
}

function lineStarts(text: string): number[] {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") starts.push(index + 1);
  }
  return starts;
}

function lineIndexAt(starts: number[], position: number): number {
  let low = 0;
  let high = starts.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if ((starts[middle] ?? Number.POSITIVE_INFINITY) <= position) low = middle + 1;
    else high = middle;
  }
  return Math.max(0, low - 1);
}

function skippedLineSet(text: string, options: SequenceOptions): Set<number> {
  return new Set(getSizeListBlockLineIndices(text, options.sizeListLine));
}

function spanTouchesLineSet(
  start: number,
  end: number,
  starts: number[],
  lines: Set<number>,
): boolean {
  const firstLine = lineIndexAt(starts, start);
  const lastLine = lineIndexAt(starts, Math.max(start, end - 1));
  for (let line = firstLine; line <= lastLine; line += 1) {
    if (lines.has(line)) return true;
  }
  return false;
}

function lineSets(
  text: string,
  starts: number[],
  options: SequenceOptions,
): { gaugeLines: Set<number>; rowLabelValues: Set<number> } {
  const lines = text.split(/\r?\n/);
  const gaugeLines = new Set<number>();
  const rowLabelValues = new Set<number>();

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (line === undefined) continue;
    if (isGaugeLine(line)) gaugeLines.add(lineIndex);

    const rowLabels = /\b(?:row|rows|rnd|rnds|round|rounds)\s+(\d+)(?=\s*(?:\(|\[))/gi;
    for (const rowLabel of line.matchAll(rowLabels)) {
      const rowNumber = rowLabel[1];
      const wordStart = rowLabel.index ?? 0;
      const numberOffset = rowLabel[0].lastIndexOf(rowNumber ?? "");
      if (!rowNumber || numberOffset < 0) continue;

      const beforeWord = line.slice(0, wordStart).trimEnd();
      const wordHasLabelBoundary = beforeWord === "" || /[:.;]$/.test(beforeWord);
      const numberPosition = numberOffset + wordStart;
      const sequence = candidateAt(line, numberPosition, options);
      const sequenceHasColon = sequence !== null && /^\s*:/.test(line.slice(sequence.end));
      if (wordHasLabelBoundary || sequenceHasColon) {
        rowLabelValues.add((starts[lineIndex] ?? 0) + numberPosition);
      }
    }
  }

  return { gaugeLines, rowLabelValues };
}

function isGaugeLine(line: string): boolean {
  return /\b(?:sts?|stitches)\b/i.test(line) && /\brows?\b/i.test(line) && /=/.test(line);
}

function isWordCharacter(value: string | undefined): boolean {
  return value !== undefined && /[A-Za-z0-9_]/.test(value);
}

function isTokenBoundary(text: string, position: number): boolean {
  const previous = text[position - 1];
  return !isWordCharacter(previous) && !/[.,/-]/.test(previous ?? "");
}

function unitDetails(value: string): { length: number; family: string; supported: boolean } | null {
  const suffix = value.match(/^(\s*)(cm|in|mm|yds|m|g|oz)\b/i);
  if (suffix) {
    const unit = (suffix[2] ?? "").toLowerCase();
    return {
      length: suffix[0].length,
      family: unit === "in" ? "inch" : unit,
      // Ounces are understood only to reject unit conversions, not as accepted values.
      supported: unit !== "oz",
    };
  }

  const quote = value.match(/^(\s*)(["'])/);
  if (quote) {
    return { length: quote[0].length, family: "inch", supported: true };
  }

  return null;
}

function parseScalarAt(
  text: string,
  start: number,
  options: { allowSimpleFraction: boolean; allowCommaDecimal: boolean },
): ParsedValue | null {
  const first = text[start];
  if (first === "-" || first === "–" || first === "—") {
    const next = text[start + 1];
    if (first !== "-" || (next !== "-" && !isWordCharacter(next))) {
      return {
        text: first,
        end: start + 1,
        placeholder: true,
        family: "none",
        commaDecimal: false,
        supportedUnit: true,
      };
    }
  }

  if (
    (first === "x" || first === "X") &&
    !isWordCharacter(text[start - 1]) &&
    !isWordCharacter(text[start + 1])
  ) {
    return {
      text: first,
      end: start + 1,
      placeholder: true,
      family: "none",
      commaDecimal: false,
      supportedUnit: true,
    };
  }

  const decimalPattern = options.allowCommaDecimal ? "(?:[.,]\\d+)?" : "(?:\\.\\d+)?";
  const numberOptions = [
    "(?:1\\/2|1\\/4|3\\/4)",
    "\\d+\\s+(?:1\\/2|1\\/4|3\\/4)",
    "\\d+[¼½¾]",
    `\\d+${decimalPattern}`,
    "[¼½¾]",
  ];
  if (!options.allowSimpleFraction) numberOptions.shift();
  const numberPattern = new RegExp(`(?:${numberOptions.join("|")})`, "y");
  numberPattern.lastIndex = start;
  const numberMatch = numberPattern.exec(text);
  if (!numberMatch) return null;

  const numberText = numberMatch[0];
  let end = numberPattern.lastIndex;
  if (isWordCharacter(text[end])) return null;

  let family = "none";
  let supportedUnit = true;
  const unit = unitDetails(text.slice(end));
  if (unit) {
    end += unit.length;
    family = unit.family;
    supportedUnit = unit.supported;
  }

  return {
    text: text.slice(start, end),
    end,
    placeholder: false,
    family,
    commaDecimal: numberText.includes(","),
    supportedUnit,
  };
}

function parseWholeValue(
  text: string,
  options: { allowSimpleFraction: boolean; allowCommaDecimal: boolean },
): ParsedValue | null {
  const value = text.trim();
  if (!value) return null;
  const parsed = parseScalarAt(value, 0, options);
  if (!parsed || parsed.end !== value.length) return null;
  return { ...parsed, text: value };
}

function parseGroupAt(text: string, start: number): ParsedGroup | null {
  const open = text[start];
  if (open !== "(" && open !== "[") return null;
  const close = open === "(" ? ")" : "]";
  const closeIndex = text.indexOf(close, start + 1);
  if (closeIndex < 0) return null;

  const body = text.slice(start + 1, closeIndex);
  if (body.includes("(") || body.includes(")") || body.includes("[") || body.includes("]")) {
    return null;
  }

  const usesSemicolons = body.includes(";");
  const pieces = body.split(usesSemicolons ? ";" : ",");
  if (pieces.some((piece) => piece.trim() === "")) return null;

  const values: ParsedValue[] = [];
  for (const piece of pieces) {
    const value = parseWholeValue(piece, {
      allowSimpleFraction: true,
      allowCommaDecimal: usesSemicolons,
    });
    if (!value) return null;
    values.push(value);
  }

  return { end: closeIndex + 1, values, usesSemicolons, usesDashes: false };
}

function parseDashGroupAt(text: string, start: number): ParsedGroup | null {
  const open = text[start];
  if (open !== "(" && open !== "[") return null;
  const close = open === "(" ? ")" : "]";
  const closeIndex = text.indexOf(close, start + 1);
  if (closeIndex < 0) return null;

  const body = text.slice(start + 1, closeIndex);
  if (/[()[\]]/.test(body)) return null;
  const separator = body.includes("–") ? "–" : "-";
  if (!body.includes(separator)) return null;
  const pieces = body.split(new RegExp(`\\s*${separator}\\s*`));
  if (pieces.length < 2) return null;

  const values: ParsedValue[] = [];
  for (const piece of pieces) {
    const value = parseWholeValue(piece, { allowSimpleFraction: true, allowCommaDecimal: true });
    if (!value || value.placeholder || value.family !== "none") return null;
    values.push(value);
  }

  return { end: closeIndex + 1, values, usesSemicolons: false, usesDashes: true };
}

function skipWhitespace(text: string, start: number): number {
  let position = start;
  while (/\s/.test(text[position] ?? "")) position += 1;
  return position;
}

function compatibleFamilies(values: ParsedValue[]): boolean {
  const first = values[0]?.family;
  // Changing written units within one group can be a conversion, so leave it for the reader.
  return values.every((value) => value.family === first && value.supportedUnit);
}

function isTwoSizeShape(values: ParsedValue[]): boolean {
  return values.length === 2 && values.every((value) => !value.placeholder);
}

function bracketedCandidateAt(text: string, start: number, count: number): Candidate | null {
  const base = parseScalarAt(text, start, { allowSimpleFraction: true, allowCommaDecimal: true });
  if (!base) return null;

  let cursor = skipWhitespace(text, base.end);
  const groups: ParsedGroup[] = [];
  const firstGroupStart = cursor;
  while (text[cursor] === "(" || text[cursor] === "[") {
    const group = parseGroupAt(text, cursor) ?? parseDashGroupAt(text, cursor);
    if (!group) return null;
    groups.push(group);
    cursor = skipWhitespace(text, group.end);
  }
  if (groups.length === 0) return null;

  const parsedValues = [base, ...groups.flatMap((group) => group.values)];
  const totalValues = parsedValues.length;
  const containsDashGroup = groups.some((group) => group.usesDashes);

  if (containsDashGroup) {
    const gap = text.slice(base.end, firstGroupStart);
    // A dash can mean a range, so this form needs a close bracket and an exact size count.
    if (count < 3 || !/^ ?$/.test(gap) || totalValues !== count) return null;
  }

  const firstGroup = groups[0];
  const lastGroup = groups[groups.length - 1];
  if (groups.length === 1 && firstGroup?.values.length === 1 && count > 2) {
    return null;
  }
  if (
    count === 2 &&
    groups.length === 1 &&
    totalValues === count &&
    !isTwoSizeShape(parsedValues)
  ) {
    // Two-size sequences are unusually easy to misread, so only plain numeric pairs qualify.
    return null;
  }
  if (!compatibleFamilies(parsedValues)) return null;

  const hasCommaDecimal = parsedValues.some((value) => value.commaDecimal);
  if (hasCommaDecimal && !groups.some((group) => group.usesSemicolons)) return null;

  const exactCount = totalValues === count;
  return {
    start,
    end: lastGroup?.end ?? base.end,
    values: parsedValues.map((value) => value.text),
    outcome: exactCount ? "sub" : "count-mismatch",
    usesDashBracket: containsDashGroup,
  };
}

interface StitchSequence {
  candidate: Candidate | null;
  end: number;
}

function stitchSequenceAt(text: string, start: number, count: number): StitchSequence | null {
  const prefixStart = Math.max(0, start - 3);
  const abbreviation = text.slice(prefixStart, start).match(/(hdc|sc|dc|ch|sl|k|p)$/i)?.[0];
  if (!abbreviation) return null;
  const abbreviationStart = start - abbreviation.length;
  if (isWordCharacter(text[abbreviationStart - 1])) return null;

  const base = parseScalarAt(text, start, { allowSimpleFraction: true, allowCommaDecimal: true });
  if (!base || base.placeholder || base.family !== "none") return null;
  let cursor = skipWhitespace(text, base.end);
  if (text[cursor] !== "(" && text[cursor] !== "[") return null;

  const groups: ParsedGroup[] = [];
  let validPlainNumbers = true;
  while (text[cursor] === "(" || text[cursor] === "[") {
    const close = text[cursor] === "(" ? ")" : "]";
    const closeIndex = text.indexOf(close, cursor + 1);
    if (closeIndex < 0) break;

    const group = parseGroupAt(text, cursor);
    if (!group) {
      validPlainNumbers = false;
      cursor = closeIndex + 1;
    } else {
      if (group.values.some((value) => value.placeholder || value.family !== "none")) {
        validPlainNumbers = false;
      }
      groups.push(group);
      cursor = group.end;
    }
    cursor = skipWhitespace(text, cursor);
  }

  const end = cursor;
  if (groups.length === 0) return { candidate: null, end };
  const values = [base, ...groups.flatMap((group) => group.values)];
  if (!validPlainNumbers || values.length !== count) return { candidate: null, end };

  const lastGroup = groups[groups.length - 1];
  return {
    candidate: {
      start,
      end: lastGroup?.end ?? base.end,
      values: values.map((value) => value.text),
      outcome: "sub",
    },
    end: lastGroup?.end ?? base.end,
  };
}

function isDate(values: string[]): boolean {
  if (values.length !== 3 || values.some((value) => !/^\d+$/.test(value))) return false;
  const first = values[0] ?? "";
  const second = values[1] ?? "";
  const third = values[2] ?? "";
  const firstNumber = Number(first);
  const secondNumber = Number(second);
  const thirdNumber = Number(third);

  if (
    first.length === 4 &&
    secondNumber >= 1 &&
    secondNumber <= 12 &&
    thirdNumber >= 1 &&
    thirdNumber <= 31
  ) {
    return true;
  }
  if (third.length === 4) {
    return (
      (firstNumber >= 1 && firstNumber <= 12 && secondNumber >= 1 && secondNumber <= 31) ||
      (firstNumber >= 1 && firstNumber <= 31 && secondNumber >= 1 && secondNumber <= 12)
    );
  }
  if (third.length === 2) {
    return (
      (firstNumber >= 1 && firstNumber <= 12 && secondNumber >= 1 && secondNumber <= 31) ||
      (firstNumber >= 1 && firstNumber <= 31 && secondNumber >= 1 && secondNumber <= 12)
    );
  }
  return false;
}

function isPhoneNumber(values: string[]): boolean {
  const digits = values.map((value) => value.replace(/\D/g, ""));
  const groups = digits.length === 4 && digits[0] === "1" ? digits.slice(1) : digits;
  return (
    groups.length === 3 &&
    (groups[0] ?? "").length === 3 &&
    (groups[1] ?? "").length === 3 &&
    (groups[2] ?? "").length === 4
  );
}

function numericRunAt(text: string, start: number, separator: "/" | "-"): Candidate | null {
  const parsedValues: ParsedValue[] = [];
  const first = parseScalarAt(text, start, {
    allowSimpleFraction: false,
    allowCommaDecimal: false,
  });
  if (!first || first.placeholder || first.family !== "none" || first.text.includes(" "))
    return null;
  parsedValues.push(first);
  let cursor = first.end;

  while (text[cursor] === separator || /\s/.test(text[cursor] ?? "")) {
    let delimiter = cursor;
    if (separator === "-") delimiter = skipWhitespace(text, cursor);
    if (text[delimiter] !== separator) break;

    let next = delimiter + 1;
    if (separator === "-") next = skipWhitespace(text, next);
    const value = parseScalarAt(text, next, {
      allowSimpleFraction: false,
      allowCommaDecimal: false,
    });
    if (!value || value.placeholder || value.family !== "none" || value.text.includes(" ")) break;
    parsedValues.push(value);
    cursor = value.end;
  }

  if (parsedValues.length < 2) return null;
  return {
    start,
    end: parsedValues[parsedValues.length - 1]?.end ?? first.end,
    values: parsedValues.map((value) => value.text),
    outcome: "sub",
  };
}

function isFractionOrDateSlashRun(values: string[]): boolean {
  if (isDate(values)) return true;
  // A slash run containing a common written fraction is too ambiguous to substitute.
  for (let index = 0; index < values.length - 1; index += 1) {
    if (
      `${values[index]}/${values[index + 1]}` === "1/2" ||
      `${values[index]}/${values[index + 1]}` === "3/4"
    ) {
      return true;
    }
  }
  return false;
}

function hasDashUnitAfter(text: string, end: number): boolean {
  const cursor = skipWhitespace(text, end);
  const quote = text[cursor];
  if (quote === '"' || quote === "'") return true;

  const word = text.slice(cursor).match(/^[A-Za-z]+/);
  if (!word) return false;
  return DASH_UNITS.has(word[0].toLowerCase());
}

function candidateAt(text: string, start: number, options: SequenceOptions): Candidate | null {
  const bracketed = bracketedCandidateAt(text, start, options.count);
  if (bracketed) return bracketed;

  if (options.count >= 3) {
    const slash = numericRunAt(text, start, "/");
    if (slash && slash.values.length === options.count && !isFractionOrDateSlashRun(slash.values)) {
      return slash;
    }

    if (options.usesDashes) {
      const dash = numericRunAt(text, start, "-");
      // Even an exact-count run stays unchanged if its groups look like a date or phone number.
      if (
        dash &&
        dash.values.length === options.count &&
        !isDate(dash.values) &&
        !isPhoneNumber(dash.values)
      ) {
        return {
          ...dash,
          outcome: hasDashUnitAfter(text, dash.end) ? "sub" : "count-mismatch",
        };
      }
    }
  }

  return null;
}

function sizeLabelMatches(
  text: string,
  starts: number[],
  skippedLines: Set<number>,
  gaugeLines: Set<number>,
): LocatedSequence[] {
  const matches: LocatedSequence[] = [];
  for (const pattern of SIZE_LABEL_EXCLUSIONS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      const line = lineIndexAt(starts, start);
      if (!skippedLines.has(line) && !gaugeLines.has(line)) {
        matches.push({
          start,
          end,
          original: match[0],
          kind: "flag",
          reason: "size-label",
        });
      }
    }
  }

  matches.sort((left, right) => left.start - right.start || right.end - left.end);
  const nonOverlapping: LocatedSequence[] = [];
  for (const match of matches) {
    const previous = nonOverlapping[nonOverlapping.length - 1];
    if (previous && match.start < previous.end) {
      continue;
    }
    nonOverlapping.push(match);
  }
  return nonOverlapping;
}

function overlapsLabel(start: number, end: number, labels: LocatedSequence[]): boolean {
  return labels.some((label) => start < label.end && end > label.start);
}

function toLocated(text: string, candidate: Candidate): LocatedSequence {
  const original = text.slice(candidate.start, candidate.end);
  if (candidate.outcome === "sub") {
    return {
      start: candidate.start,
      end: candidate.end,
      original,
      kind: "sub",
      values: candidate.values,
    };
  }
  return {
    start: candidate.start,
    end: candidate.end,
    original,
    kind: "flag",
    reason: "count-mismatch",
  };
}

function dashBracketRanges(text: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  for (let start = 0; start < text.length; start += 1) {
    const open = text[start];
    if (open !== "(" && open !== "[") continue;
    const close = open === "(" ? ")" : "]";
    const closeIndex = text.indexOf(close, start + 1);
    if (closeIndex < 0) continue;
    if (/[–-]/.test(text.slice(start + 1, closeIndex))) {
      ranges.push({ start, end: closeIndex + 1 });
    }
    start = closeIndex;
  }
  return ranges;
}

function hasResolvedDashBracket(
  text: string,
  options: SequenceOptions,
  starts: number[],
  skippedLines: Set<number>,
  gaugeLines: Set<number>,
  rowLabelValues: Set<number>,
  labels: LocatedSequence[],
): boolean {
  for (let position = 0; position < text.length; position += 1) {
    if (!/[0-9¼½¾]/.test(text[position] ?? "") || !isTokenBoundary(text, position)) continue;
    const line = lineIndexAt(starts, position);
    if (skippedLines.has(line) || gaugeLines.has(line) || rowLabelValues.has(position)) continue;

    const base = parseScalarAt(text, position, {
      allowSimpleFraction: true,
      allowCommaDecimal: true,
    });
    if (!base) continue;
    const groupStart = skipWhitespace(text, base.end);
    const open = text[groupStart];
    if (open !== "(" && open !== "[") continue;
    const close = open === "(" ? ")" : "]";
    const closeIndex = text.indexOf(close, groupStart + 1);
    if (closeIndex < 0 || !/[–-]/.test(text.slice(groupStart + 1, closeIndex))) continue;

    const candidate = bracketedCandidateAt(text, position, options.count);
    return (
      candidate?.usesDashBracket === true &&
      candidate.outcome === "sub" &&
      !spanTouchesLineSet(position, candidate.end, starts, skippedLines) &&
      !spanTouchesLineSet(position, candidate.end, starts, gaugeLines) &&
      !overlapsLabel(position, candidate.end, labels)
    );
  }
  return false;
}

/** Finds sequence candidates in source order and classifies substitutions and flags. */
export function findSequences(text: string, options: SequenceOptions): LocatedSequence[] {
  if (!Number.isInteger(options.count) || options.count < 2) return [];

  const starts = lineStarts(text);
  const skippedLines = skippedLineSet(text, options);
  const { gaugeLines, rowLabelValues } = lineSets(text, starts, options);
  const labelMatches = sizeLabelMatches(text, starts, skippedLines, gaugeLines);
  const dashRanges = dashBracketRanges(text);
  const useDashRuns =
    options.usesDashes ||
    hasResolvedDashBracket(
      text,
      options,
      starts,
      skippedLines,
      gaugeLines,
      rowLabelValues,
      labelMatches,
    );
  const scanOptions = { ...options, usesDashes: useDashRuns };
  const found: LocatedSequence[] = [...labelMatches];

  let position = 0;
  let dashRangeIndex = 0;
  while (position < text.length) {
    const line = lineIndexAt(starts, position);
    if (skippedLines.has(line) || gaugeLines.has(line) || rowLabelValues.has(position)) {
      position += 1;
      continue;
    }

    if (/[0-9¼½¾]/.test(text[position] ?? "")) {
      const stitch = stitchSequenceAt(text, position, options.count);
      if (stitch) {
        if (stitch.candidate) found.push(toLocated(text, stitch.candidate));
        position = Math.max(position + 1, stitch.end);
        continue;
      }
    }

    while (
      dashRangeIndex < dashRanges.length &&
      (dashRanges[dashRangeIndex]?.end ?? 0) <= position
    ) {
      dashRangeIndex += 1;
    }
    const dashRange = dashRanges[dashRangeIndex];
    if (dashRange && position > dashRange.start && position < dashRange.end) {
      position += 1;
      continue;
    }

    if (!isTokenBoundary(text, position)) {
      position += 1;
      continue;
    }

    const character = text[position];
    if (character === undefined || !/[0-9¼½¾xX–—-]/.test(character)) {
      position += 1;
      continue;
    }

    const candidate = candidateAt(text, position, scanOptions);
    if (
      !candidate ||
      spanTouchesLineSet(position, candidate.end, starts, skippedLines) ||
      spanTouchesLineSet(position, candidate.end, starts, gaugeLines)
    ) {
      position += 1;
      continue;
    }
    if (overlapsLabel(position, candidate.end, labelMatches)) {
      position = candidate.end;
      continue;
    }

    found.push(toLocated(text, candidate));
    position = candidate.end;
  }

  found.sort((left, right) => left.start - right.start || left.end - right.end);
  return found;
}
