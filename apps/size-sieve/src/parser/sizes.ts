export interface SizeList {
  labels: string[];
  count: number;
  sourceLine: string;
  lineIndex: number;
  usesDashes: boolean;
  conflict: string | null;
}

interface ParsedLabels {
  labels: string[];
  usesDashes: boolean;
}

interface HeaderMatch {
  kind: "labels" | "measurement";
  content: string;
  isSizeHeading: boolean;
}

const INSTRUCTION_HEADING =
  /^\s*(?:cast\s+on\b|instructions?\b|body(?=\s*(?::|$))|back(?=\s*(?::|$)))/i;
const LABEL_HEADER = /^\s*sizes?\s*:?[ \t]*/i;
const TO_FIT_HEADER = /^\s*to\s+fit\s*:?[ \t]*/i;
const FINISHED_SIZE_HEADER = /^\s*finished\s+sizes?\s*:?[ \t]*/i;
const MEASUREMENT_WORD =
  /\b(?:chest|bust|hips?|waist|length|width|circumference|sleeve|arm|yoke|neck|cuff|wrist|depth|ease|shoulder)\b/i;
const LABEL_ATOM = /^(?:[A-Za-z]+\d*|\d+[A-Za-z]+|\d+(?:\.\d+)?(?:[¼½¾])?)(?:[¼½¾])?$/;
const AUDIENCE_PREFIX = /^(?:women['’]s|men['’]s|child['’]s|adult|unisex)\b\s*/i;
const MEASUREMENT_UNIT = /^(?:inch(?:es)?|in\.?|cm|mm)\b/i;
const MEASUREMENT_UNIT_WORD = /\binch(?:es)?|\bin\.?|\bcm\b|\bmm\b/gi;
const MEASUREMENT_MARK = /(?:"|”|″|'')/g;

function splitMeasurementRow(line: string): { label: string; content: string } | null {
  const match = line.match(
    /^\s*([\p{L}\p{M}][\p{L}\p{M}'’]*(?:[\s,/]+[\p{L}\p{M}][\p{L}\p{M}'’]*){0,7})\s*(?::|[ \t]+[–—-][ \t]+)\s*(.*?)\s*$/u,
  );
  if (!match) return null;

  const label = match[1] ?? "";
  const content = match[2] ?? "";
  const words = label.match(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu) ?? [];
  if (words.length < 1 || words.length > 8 || !MEASUREMENT_WORD.test(label)) return null;
  return { label, content };
}

function isMeasurementValues(content: string): boolean {
  // Measurement rows may use only numbers, list punctuation, and the units named in the fix.
  const remainder = content
    .replace(MEASUREMENT_UNIT_WORD, "")
    .replace(MEASUREMENT_MARK, "")
    .replace(/\d+(?:[.,]\d+)?(?:\s+\d+\/[124])?|[¼½¾]/g, "")
    .replace(/\b[xX]\b/g, "")
    .replace(/[\s()[\],;/–—-]/g, "");
  return remainder === "" && /\d|[¼½¾]/.test(content);
}

/** A measurement row is protected only when its label and value tail match rule 2. */
export function isMeasurementRow(line: string): boolean {
  const row = splitMeasurementRow(line);
  return row !== null && isMeasurementValues(row.content);
}

function findHeader(line: string): HeaderMatch | null {
  const labelMatch = line.match(LABEL_HEADER);
  if (labelMatch) {
    return {
      kind: "labels",
      content: line.slice(labelMatch[0].length),
      isSizeHeading: true,
    };
  }

  const toFitMatch = line.match(TO_FIT_HEADER);
  if (toFitMatch) {
    return {
      kind: "labels",
      content: line.slice(toFitMatch[0].length),
      isSizeHeading: false,
    };
  }

  const finishedSizeMatch = line.match(FINISHED_SIZE_HEADER);
  if (finishedSizeMatch) {
    return {
      kind: "measurement",
      content: line.slice(finishedSizeMatch[0].length),
      isSizeHeading: false,
    };
  }

  const row = splitMeasurementRow(line);
  if (row && isMeasurementValues(row.content)) {
    return { kind: "measurement", content: row.content, isSizeHeading: false };
  }

  const finishedMeasurements = line.match(/^\s*finished\s+measurements?\s*:?[ \t]*/i);
  if (finishedMeasurements) {
    return {
      kind: "measurement",
      content: line.slice(finishedMeasurements[0].length),
      isSizeHeading: false,
    };
  }
  return null;
}

function removeAudiencePrefix(value: string): string {
  return value.replace(AUDIENCE_PREFIX, "").trim();
}

function removeTrailingUnit(value: string): string {
  return value
    .replace(/\s*(?:"|”|″|'')\s*$/, "")
    .replace(/\s+(?:inch(?:es)?|in\.?|cm|mm|m|yds|g)\s*$/i, "")
    .trim();
}

function firstSystemOnly(value: string): string {
  let depth = 0;
  let groupsSeen = 0;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === "(" || character === "[") {
      depth += 1;
      groupsSeen += 1;
      continue;
    }
    if ((character === ")" || character === "]") && depth > 0) {
      depth -= 1;
      continue;
    }
    if (depth !== 0 || groupsSeen === 0) continue;

    if (character === "/") {
      return value.slice(0, index).trim();
    }

    const tail = value.slice(index);
    const unit = tail.match(MEASUREMENT_UNIT);
    const mark = tail.match(/^(?:"|”|″|'')/);
    if (unit || mark) return value.slice(0, index).trim();
  }
  return value.trim();
}

function splitLabelGroup(value: string): string[] | null {
  const separator = value.includes(";") ? ";" : ",";
  const labels = value.split(separator).map((part) => part.trim());
  if (labels.length === 0 || labels.some((label) => !LABEL_ATOM.test(label))) {
    return null;
  }
  return labels;
}

function parseDashLabels(value: string): ParsedLabels | null {
  if (!value.includes("-")) return null;

  const labels = value.split(/\s*-\s*/).map((part) => part.trim());
  if (labels.length < 2 || labels.some((label) => !LABEL_ATOM.test(label))) {
    return null;
  }

  return { labels, usesDashes: true };
}

function parseBracketedLabels(value: string): ParsedLabels | null {
  let cursor = 0;
  const labels: string[] = [];
  let sawGroup = false;

  while (cursor < value.length) {
    while (/\s/.test(value[cursor] ?? "")) cursor += 1;
    if (cursor >= value.length) break;

    const atomMatch = value
      .slice(cursor)
      .match(/^[A-Za-z]+\d*|^\d+[A-Za-z]+|^\d+(?:\.\d+)?(?:[¼½¾])?/);
    if (atomMatch) {
      labels.push(atomMatch[0]);
      cursor += atomMatch[0].length;
      continue;
    }

    const open = value[cursor];
    if (open !== "(" && open !== "[") return null;
    const close = open === "(" ? ")" : "]";
    const closeIndex = value.indexOf(close, cursor + 1);
    if (closeIndex < 0) return null;

    const inside = value.slice(cursor + 1, closeIndex).trim();
    const groupLabels = splitLabelGroup(inside);
    if (!groupLabels) return null;
    labels.push(...groupLabels);
    sawGroup = true;
    cursor = closeIndex + 1;
  }

  // Alternation such as `XXS (XS) S (M) L` is a size-list convention only.
  if (!sawGroup || labels.length < 2) return null;
  return { labels, usesDashes: false };
}

function parseLabels(content: string): ParsedLabels | null {
  const value = removeAudiencePrefix(firstSystemOnly(removeTrailingUnit(content)));
  return parseDashLabels(value) ?? parseBracketedLabels(value);
}

function lineLimit(lines: string[]): number {
  const headingIndex = lines.findIndex((line) => INSTRUCTION_HEADING.test(line));
  return Math.min(60, headingIndex < 0 ? 60 : headingIndex);
}

function isNote(line: string): boolean {
  return /^\s*notes?\b/i.test(line);
}

function isSizeHeading(line: string): boolean {
  return /^\s*(?:sizes?|finished\s+sizes?|finished\s+measurements?|measurements?)\s*:?\s*$/i.test(
    line,
  );
}

function candidateFromLine(
  line: string,
  lineIndex: number,
  header: HeaderMatch,
): (SizeList & { kind: HeaderMatch["kind"] }) | null {
  let content = header.content;
  if (header.kind === "measurement") {
    const row = splitMeasurementRow(line);
    if (row) content = firstSystemOnly(row.content);
  }
  const parsed = parseLabels(content);
  if (!parsed) return null;

  return {
    labels: parsed.labels,
    count: parsed.labels.length,
    sourceLine: line,
    lineIndex,
    usesDashes: parsed.usesDashes,
    conflict: null,
    kind: header.kind,
  };
}

/** Finds a size-label or measurement sequence near the start of a pattern. */
export function findSizeList(text: string): SizeList | null {
  const lines = text.split(/\r?\n/);
  const candidates: Array<SizeList & { kind: HeaderMatch["kind"] }> = [];
  const limit = lineLimit(lines);

  for (let lineIndex = 0; lineIndex < limit; lineIndex += 1) {
    const sourceLine = lines[lineIndex];
    if (sourceLine === undefined) continue;
    const header = findHeader(sourceLine);
    if (!header) continue;

    const direct = candidateFromLine(sourceLine, lineIndex, header);
    if (direct) candidates.push(direct);

    // A bare Size/Sizes heading can put its labels on one of the next three content lines.
    if (!header.isSizeHeading || header.content.trim() !== "") continue;
    let nonNoteLines = 0;
    for (let next = lineIndex + 1; next < limit && nonNoteLines < 3; next += 1) {
      const line = lines[next];
      if (line === undefined || line.trim() === "" || isNote(line)) continue;
      if (INSTRUCTION_HEADING.test(line)) break;
      nonNoteLines += 1;

      const audienceContent = removeAudiencePrefix(line);
      const parsed = parseLabels(audienceContent);
      if (!parsed) continue;
      candidates.push({
        labels: parsed.labels,
        count: parsed.labels.length,
        sourceLine: line,
        lineIndex: next,
        usesDashes: parsed.usesDashes,
        conflict: null,
        kind: "labels",
      });
      break;
    }
  }

  const labelsLine = candidates.find((candidate) => candidate.kind === "labels");
  const measurementLines = candidates.filter((candidate) => candidate.kind === "measurement");

  if (labelsLine) {
    const differingMeasurement = measurementLines.find(
      (candidate) => candidate.count !== labelsLine.count,
    );
    return {
      labels: labelsLine.labels,
      count: labelsLine.count,
      sourceLine: labelsLine.sourceLine,
      lineIndex: labelsLine.lineIndex,
      usesDashes: labelsLine.usesDashes,
      conflict: differingMeasurement
        ? `Size labels show ${labelsLine.count} sizes; a measurement line shows ${differingMeasurement.count}.`
        : null,
    };
  }

  const measurementLine = measurementLines[0];
  if (!measurementLine) return null;

  return {
    labels: measurementLine.labels,
    count: measurementLine.count,
    sourceLine: measurementLine.sourceLine,
    lineIndex: measurementLine.lineIndex,
    usesDashes: measurementLine.usesDashes,
    conflict: null,
  };
}

/** Returns true for headings that start the protected size and measurement block. */
export function isSizeBlockHeading(line: string): boolean {
  if (isSizeHeading(line)) return true;
  if (/^\s*(?:sizes?|finished\s+sizes?|finished\s+measurements?|measurements?)\s*:/i.test(line)) {
    return true;
  }

  const inlineLabels = line.match(
    /^\s*(?:sizes?|finished\s+sizes?|finished\s+measurements?|measurements?)\s+(.+)$/i,
  );
  return inlineLabels !== null && parseLabels(inlineLabels[1] ?? "") !== null;
}

/** A line of labels can continue a size block after its heading. */
export function isSizeLabelsLine(line: string): boolean {
  if (!parseLabels(line)) return false;
  const value = removeAudiencePrefix(firstSystemOnly(removeTrailingUnit(line)));
  const wordLabels = value.match(/[A-Za-z]+/g) ?? [];
  // This block rule accepts recognizable size labels without treating instruction prose as labels.
  return wordLabels.every((label) => label === label.toUpperCase());
}

/** A line containing only a sequence and units can continue a size block. */
export function isBareSequenceLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || !/^[\d¼½¾]/.test(trimmed)) return false;
  return isMeasurementValues(trimmed) && /[()[\],;/–-]/.test(trimmed);
}

/** A measurement heading without its value starts a block but is not itself a row. */
export function isLabelOnlyMeasurementLine(line: string): boolean {
  const trimmed = line
    .trim()
    .replace(/(?::|\s+[–—-])\s*$/, "")
    .trim();
  if (!trimmed || /\d|[()[\]]/.test(trimmed)) return false;
  const words = trimmed.match(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu) ?? [];
  return words.length >= 1 && words.length <= 8 && MEASUREMENT_WORD.test(trimmed);
}
