import { rejoinSegments, type Segment } from "../parser/index.ts";

export interface TruthSequence {
  values: string[];
  context: string;
  position: string;
  inFigure?: boolean;
  sourceError?: boolean;
}

export type GateSequence =
  | {
      kind: "sub";
      original: string;
      values: string[];
      start?: number;
      end?: number;
    }
  | {
      kind: "flag";
      original: string;
      reason: string;
      start?: number;
      end?: number;
    };

export interface StructureCheck {
  passed: boolean;
  roundTrip: boolean;
  substitutionsOnly: boolean;
  stableAcrossSizes: boolean;
  issues: string[];
}

export interface GateEntryResult {
  truthIndex: number;
  truth: TruthSequence;
  classification: "correct" | "flagged" | "wrong" | "missed" | "lost";
  counted: boolean;
  parserSequenceIndex: number | null;
  detail: string;
}

export interface GateCounts {
  counted: number;
  correct: number;
  flagged: number;
  wrong: number;
  falsePositives: number;
  missed: number;
  lost: number;
  uncountedFigureLoss: number;
}

export interface PatternAnalysis {
  name: string;
  sizeCount: number;
  detectedSizeCount: number | null;
  sequences: GateSequence[];
  entries: GateEntryResult[];
  structure: StructureCheck;
  counts: GateCounts;
  sourceErrorSubstitutions: GateEntryResult[];
}

export interface GateCriterionInput {
  name: string;
  counted: number;
  correct: number;
  wrong: number;
  structurePassed: boolean;
}

export interface GateCriteria {
  evaluated: boolean;
  criterionA: boolean | null;
  wrongPatternCount: number;
  criterionBPatterns: boolean | null;
  wrongTotal: number;
  countedTotal: number;
  wrongRate: number | null;
  criterionBOverall: boolean | null;
  medianCorrectRate: number | null;
  criterionC: boolean | null;
  passed: boolean | null;
}

export const MAX_WRONG_PATTERNS = 2;
export const MAX_WRONG_RATE = 0.01;
export const MIN_MEDIAN_CORRECT_RATE = 0.8;

const FRACTION_GLYPHS: Record<string, string> = {
  "¼": "1/4",
  "½": "1/2",
  "¾": "3/4",
};

const TRAILING_WORD_UNITS =
  /\s+(?:in(?:ch(?:es)?)?|cm|mm|yds?|g|kg|oz|m|stitch(?:es)?|sts?|rows?|rounds?|rnds?|times|balls|skeins|hanks|ch|sc|dc|hdc)\.?$/i;
const ATTACHED_NUMERIC_UNITS = /(?<=\d)\s*(?:in(?:ch(?:es)?)?|cm|mm|yds?|g|kg|oz|m)$/i;

function canonicalizeFractions(value: string): string {
  return value
    .replace(/[¼½¾]/g, (glyph) => ` ${FRACTION_GLYPHS[glyph]}`)
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalizes only notation that should not affect whether two printed values are equal. */
export function normalizeGateValue(value: string): string {
  let normalized = canonicalizeFractions(value.trim());
  normalized = normalized.replace(/\s*["'′″]\s*$/, "");
  normalized = normalized.replace(TRAILING_WORD_UNITS, "");
  normalized = normalized.replace(ATTACHED_NUMERIC_UNITS, "");
  return normalized.trim().replace(/\s+/g, " ").toLowerCase();
}

export function gateValuesEqual(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every(
      (value, index) => normalizeGateValue(value) === normalizeGateValue(right[index] ?? ""),
    )
  );
}

function valuePattern(value: string): RegExp | null {
  const normalized = normalizeGateValue(value);
  if (!normalized) return null;
  const body = normalized
    .split(" ")
    .map((part) => part.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\//g, "\\/"))
    .join("\\s+");
  const beginsWithDigit = /^\d/.test(normalized);
  const endsWithDigit = /\d$/.test(normalized);
  const beginsWithWord = /^[a-z]/i.test(normalized);
  const endsWithWord = /[a-z]$/i.test(normalized);
  const leftBoundary = beginsWithDigit ? "(?<![\\d.])" : beginsWithWord ? "(?<![A-Za-z0-9])" : "";
  const rightBoundary = endsWithDigit ? "(?![\\d.])" : endsWithWord ? "(?![A-Za-z0-9])" : "";
  return new RegExp(leftBoundary + body + rightBoundary, "gi");
}

/**
 * Checks for a truth group in document order. Separators may be any text, but may not hide
 * another digit, which avoids treating a larger number as a match for a shorter value.
 */
export function valuesFoundInOrder(text: string, values: string[]): boolean {
  if (values.length === 0) return false;
  const normalizedText = canonicalizeFractions(text).toLowerCase();
  let cursor = 0;

  for (const value of values) {
    const pattern = valuePattern(value);
    if (!pattern) return false;
    pattern.lastIndex = cursor;
    const match = pattern.exec(normalizedText);
    if (!match || /[0-9]/.test(normalizedText.slice(cursor, match.index))) return false;
    cursor = match.index + match[0].length;
  }
  return true;
}

function lcsPairs(
  leftCount: number,
  rightCount: number,
  matches: (leftIndex: number, rightIndex: number) => boolean,
): Array<[number, number]> {
  const lengths = Array.from({ length: leftCount + 1 }, () =>
    new Array<number>(rightCount + 1).fill(0),
  );

  for (let left = leftCount - 1; left >= 0; left -= 1) {
    for (let right = rightCount - 1; right >= 0; right -= 1) {
      const row = lengths[left];
      const nextRow = lengths[left + 1];
      if (!row || !nextRow) continue;
      const pairedLength = matches(left, right) ? 1 + (nextRow[right + 1] ?? 0) : 0;
      row[right] = Math.max(pairedLength, nextRow[right] ?? 0, row[right + 1] ?? 0);
    }
  }

  const pairs: Array<[number, number]> = [];
  let left = 0;
  let right = 0;
  while (left < leftCount && right < rightCount) {
    const row = lengths[left];
    const nextRow = lengths[left + 1];
    if (!row || !nextRow) break;
    if (matches(left, right) && row[right] === 1 + (nextRow[right + 1] ?? 0)) {
      pairs.push([left, right]);
      left += 1;
      right += 1;
    } else if ((nextRow[right] ?? 0) >= (row[right + 1] ?? 0)) {
      left += 1;
    } else {
      right += 1;
    }
  }
  return pairs;
}

function originalContains(sequence: GateSequence, truth: TruthSequence): boolean {
  return valuesFoundInOrder(sequence.original, truth.values);
}

function originalForSegment(segment: Segment): string {
  return segment.kind === "text" ? segment.text : segment.original;
}

/**
 * Checks the parser's source reconstruction at every size and combines each substitution's
 * selected value across those runs. A stable segment boundary lets the gate compare all sizes.
 */
export function inspectResolutions(
  input: string,
  resolutions: Segment[][],
): {
  sequences: GateSequence[];
  structure: StructureCheck;
} {
  const issues: string[] = [];
  let roundTrip = resolutions.length > 0;
  let substitutionsOnly = resolutions.length > 0;
  let stableAcrossSizes = resolutions.length > 0;
  const first = resolutions[0] ?? [];

  if (resolutions.length === 0) {
    issues.push("No size-index resolutions were produced.");
  }

  for (let resolutionIndex = 0; resolutionIndex < resolutions.length; resolutionIndex += 1) {
    const resolution = resolutions[resolutionIndex] ?? [];
    if (rejoinSegments(resolution) !== input) {
      roundTrip = false;
      issues.push(`Size index ${resolutionIndex} did not rejoin to the input.`);
    }
    let sourceOffset = 0;
    for (const segment of resolution) {
      const original = originalForSegment(segment);
      const sourcePart = input.slice(sourceOffset, sourceOffset + original.length);
      const resolvedPart =
        segment.kind === "text"
          ? segment.text
          : segment.kind === "flag"
            ? segment.original
            : segment.value;
      // Text and flag segments must emit their exact source span; only a sub may emit a new value.
      if (sourcePart !== original || (segment.kind !== "sub" && resolvedPart !== sourcePart)) {
        substitutionsOnly = false;
        issues.push("A changed source character fell outside a substitution segment.");
      }
      sourceOffset += original.length;
    }
    if (resolution.length !== first.length) {
      stableAcrossSizes = false;
      issues.push("The parser returned different segment counts between size indexes.");
      continue;
    }
    for (let segmentIndex = 0; segmentIndex < first.length; segmentIndex += 1) {
      const expected = first[segmentIndex];
      const actual = resolution[segmentIndex];
      if (
        !expected ||
        !actual ||
        expected.kind !== actual.kind ||
        originalForSegment(expected) !== originalForSegment(actual)
      ) {
        stableAcrossSizes = false;
        issues.push("The parser returned different source segments between size indexes.");
        break;
      }
    }
  }

  const sequences: GateSequence[] = [];
  let sourceOffset = 0;
  for (let segmentIndex = 0; segmentIndex < first.length; segmentIndex += 1) {
    const segment = first[segmentIndex];
    if (!segment) continue;
    const original = originalForSegment(segment);
    if (segment.kind === "sub") {
      const values = resolutions.map((resolution) => {
        const candidate = resolution[segmentIndex];
        return candidate?.kind === "sub" ? candidate.value : "";
      });
      sequences.push({
        kind: "sub",
        original,
        values,
        start: sourceOffset,
        end: sourceOffset + original.length,
      });
    } else if (segment.kind === "flag") {
      sequences.push({
        kind: "flag",
        original,
        reason: segment.reason,
        start: sourceOffset,
        end: sourceOffset + original.length,
      });
    }
    sourceOffset += original.length;
  }

  const structure: StructureCheck = {
    passed: roundTrip && substitutionsOnly && stableAcrossSizes,
    roundTrip,
    substitutionsOnly,
    stableAcrossSizes,
    issues: [...new Set(issues)],
  };
  return { sequences, structure };
}

function emptyCounts(): GateCounts {
  return {
    counted: 0,
    correct: 0,
    flagged: 0,
    wrong: 0,
    falsePositives: 0,
    missed: 0,
    lost: 0,
    uncountedFigureLoss: 0,
  };
}

/** Aligns equal value lists first, then identifies a wrong sub only when its source contains the truth values. */
export function analyzePattern(args: {
  name: string;
  sizeCount: number;
  detectedSizeCount: number | null;
  truth: TruthSequence[];
  sequences: GateSequence[];
  extractedText: string;
  structure: StructureCheck;
}): PatternAnalysis {
  const { truth, sequences, extractedText } = args;
  const alignments = new Map<number, { sequenceIndex: number; kind: "exact" | "wrong" }>();
  const usedSequenceIndexes = new Set<number>();

  const exactPairs = lcsPairs(sequences.length, truth.length, (sequenceIndex, truthIndex) => {
    const sequence = sequences[sequenceIndex];
    const entry = truth[truthIndex];
    if (!sequence || !entry) return false;
    if (sequence.kind === "sub") return gateValuesEqual(sequence.values, entry.values);
    return originalContains(sequence, entry);
  });
  for (const [sequenceIndex, truthIndex] of exactPairs) {
    alignments.set(truthIndex, { sequenceIndex, kind: "exact" });
    usedSequenceIndexes.add(sequenceIndex);
  }

  const remainingSubIndexes = sequences
    .map((sequence, index) =>
      sequence.kind === "sub" && !usedSequenceIndexes.has(index) ? index : -1,
    )
    .filter((index) => index >= 0);
  const remainingTruthIndexes = truth
    .map((_, index) => (alignments.has(index) ? -1 : index))
    .filter((index) => index >= 0);
  // Raw source links a mis-resolved substitution to its truth entry. Exact value matches were
  // aligned above, so this pass separates wrong substitutions from unrelated false positives.
  const wrongPairs = lcsPairs(
    remainingSubIndexes.length,
    remainingTruthIndexes.length,
    (subPosition, truthPosition) => {
      const sequenceIndex = remainingSubIndexes[subPosition];
      const truthIndex = remainingTruthIndexes[truthPosition];
      const sequence = sequenceIndex === undefined ? undefined : sequences[sequenceIndex];
      const entry = truthIndex === undefined ? undefined : truth[truthIndex];
      return Boolean(
        sequence &&
          sequence.kind === "sub" &&
          entry &&
          !gateValuesEqual(sequence.values, entry.values) &&
          originalContains(sequence, entry),
      );
    },
  );
  for (const [subPosition, truthPosition] of wrongPairs) {
    const sequenceIndex = remainingSubIndexes[subPosition];
    const truthIndex = remainingTruthIndexes[truthPosition];
    if (sequenceIndex === undefined || truthIndex === undefined) continue;
    alignments.set(truthIndex, { sequenceIndex, kind: "wrong" });
    usedSequenceIndexes.add(sequenceIndex);
  }

  const counts = emptyCounts();
  const entries: GateEntryResult[] = truth.map((entry, truthIndex) => {
    const alignment = alignments.get(truthIndex);
    let classification: GateEntryResult["classification"];
    let detail: string;
    const parserSequenceIndex: number | null = alignment?.sequenceIndex ?? null;

    if (alignment?.kind === "wrong") {
      classification = "wrong";
      detail = "A substitution contains this source sequence but resolves to different values.";
    } else if (alignment) {
      const sequence = sequences[alignment.sequenceIndex];
      if (sequence?.kind === "flag") {
        classification = entry.sourceError ? "correct" : "flagged";
        detail = entry.sourceError
          ? "Source error was correctly left flagged."
          : "The parser left this sequence unchanged and flagged it.";
      } else if (sequence?.kind === "sub" && entry.sourceError) {
        classification = "wrong";
        detail = "Source error was substituted; the expected result is a flag.";
      } else {
        classification = "correct";
        detail = "The substituted values match the truth values.";
      }
    } else if (valuesFoundInOrder(extractedText, entry.values)) {
      classification = "missed";
      detail = "The truth values are present in extracted text, but no parser sequence aligned.";
    } else {
      classification = "lost";
      detail = "The truth values could not be found in extracted text in order.";
    }

    const counted = !(entry.inFigure && classification === "lost");
    if (!counted) {
      counts.uncountedFigureLoss += 1;
    } else {
      counts.counted += 1;
      counts[classification] += 1;
    }

    return {
      truthIndex,
      truth: entry,
      classification,
      counted,
      parserSequenceIndex,
      detail,
    };
  });

  for (let sequenceIndex = 0; sequenceIndex < sequences.length; sequenceIndex += 1) {
    const sequence = sequences[sequenceIndex];
    if (sequence?.kind === "sub" && !usedSequenceIndexes.has(sequenceIndex)) {
      counts.falsePositives += 1;
      counts.wrong += 1;
    }
  }

  const sourceErrorSubstitutions = entries.filter(
    (entry) =>
      entry.truth.sourceError &&
      entry.parserSequenceIndex !== null &&
      sequences[entry.parserSequenceIndex]?.kind === "sub",
  );

  return {
    name: args.name,
    sizeCount: args.sizeCount,
    detectedSizeCount: args.detectedSizeCount,
    sequences,
    entries,
    structure: args.structure,
    counts,
    sourceErrorSubstitutions,
  };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const lower = sorted[middle - 1];
  const upper = sorted[middle];
  if (sorted.length % 2 === 1) return upper ?? null;
  if (lower === undefined || upper === undefined) return null;
  return (lower + upper) / 2;
}

/** Evaluates the three frozen-cohort feasibility thresholds from the brief. */
export function calculateGateCriteria(patterns: GateCriterionInput[]): GateCriteria {
  if (patterns.length === 0) {
    return {
      evaluated: false,
      criterionA: null,
      wrongPatternCount: 0,
      criterionBPatterns: null,
      wrongTotal: 0,
      countedTotal: 0,
      wrongRate: null,
      criterionBOverall: null,
      medianCorrectRate: null,
      criterionC: null,
      passed: null,
    };
  }

  const wrongPatternCount = patterns.filter((pattern) => pattern.wrong > 0).length;
  const wrongTotal = patterns.reduce((total, pattern) => total + pattern.wrong, 0);
  const countedTotal = patterns.reduce((total, pattern) => total + pattern.counted, 0);
  const correctRates = patterns
    .filter((pattern) => pattern.counted > 0)
    .map((pattern) => pattern.correct / pattern.counted);
  const medianCorrectRate = median(correctRates);
  const criterionA = patterns.every((pattern) => pattern.structurePassed);
  const criterionBPatterns = wrongPatternCount <= MAX_WRONG_PATTERNS;
  const wrongRate = countedTotal > 0 ? wrongTotal / countedTotal : null;
  const criterionBOverall = wrongRate !== null && wrongRate <= MAX_WRONG_RATE;
  const criterionC = medianCorrectRate !== null && medianCorrectRate >= MIN_MEDIAN_CORRECT_RATE;

  return {
    evaluated: true,
    criterionA,
    wrongPatternCount,
    criterionBPatterns,
    wrongTotal,
    countedTotal,
    wrongRate,
    criterionBOverall,
    medianCorrectRate,
    criterionC,
    passed: criterionA && criterionBPatterns && criterionBOverall && criterionC,
  };
}
