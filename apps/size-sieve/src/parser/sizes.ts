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
}

const INSTRUCTION_HEADING =
  /^\s*(?:cast\s+on\b|instructions?\b|body(?=\s*(?::|$))|back(?=\s*(?::|$)))/i;
const LABEL_HEADER = /^\s*(?:sizes?|to\s+fit)\s*:?\s*/i;
const MEASUREMENT_HEADER =
  /^\s*(?:finished\s+(?:chest|bust|circumference|measurements)|chest|bust)\s*:?\s*/i;
const LABEL_ATOM = /^(?:[A-Za-z]+\d*|\d+[A-Za-z]+|\d+(?:\.\d+)?(?:[¼½¾])?)(?:[¼½¾])?$/;

function findHeader(line: string): HeaderMatch | null {
  const labelMatch = line.match(LABEL_HEADER);
  if (labelMatch) {
    return { kind: "labels", content: line.slice(labelMatch[0].length) };
  }

  const measurementMatch = line.match(MEASUREMENT_HEADER);
  if (measurementMatch) {
    return { kind: "measurement", content: line.slice(measurementMatch[0].length) };
  }

  return null;
}

function removeTrailingUnit(value: string): string {
  // A trailing quote is unambiguous. Word units only count when separated from the final label.
  return value
    .replace(/\s*["']\s*$/, "")
    .replace(/\s+(?:cm|in|mm|m|yds|g)\s*$/i, "")
    .trim();
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
  const value = removeTrailingUnit(content);
  return parseDashLabels(value) ?? parseBracketedLabels(value);
}

function lineLimit(lines: string[]): number {
  const headingIndex = lines.findIndex((line) => INSTRUCTION_HEADING.test(line));
  return Math.min(60, headingIndex < 0 ? 60 : headingIndex);
}

/** Finds a size-label or measurement sequence near the start of a pattern. */
export function findSizeList(text: string): SizeList | null {
  const lines = text.split(/\r?\n/);
  const candidates: Array<SizeList & { kind: HeaderMatch["kind"] }> = [];

  for (let lineIndex = 0; lineIndex < lineLimit(lines); lineIndex += 1) {
    const sourceLine = lines[lineIndex];
    if (sourceLine === undefined) continue;
    const header = findHeader(sourceLine);
    if (!header) continue;

    const parsed = parseLabels(header.content);
    if (!parsed) continue;

    candidates.push({
      labels: parsed.labels,
      count: parsed.labels.length,
      sourceLine,
      lineIndex,
      usesDashes: parsed.usesDashes,
      conflict: null,
      kind: header.kind,
    });
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
