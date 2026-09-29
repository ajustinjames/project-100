import {
  calculateGateCriteria,
  type GateSequence,
  MAX_WRONG_PATTERNS,
  MAX_WRONG_RATE,
  MIN_MEDIAN_CORRECT_RATE,
  type PatternAnalysis,
} from "./measure.ts";
import type { TruthFile } from "./truth.ts";

export interface PatternFailure {
  name: string;
  message: string;
}
function markdown(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ↵ ");
}

function displayValues(values: string[]): string {
  return `[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
}

function sourceContext(text: string, sequence: GateSequence): string {
  const start = Math.max(0, sequence.start ?? 0);
  const end = Math.min(text.length, sequence.end ?? start);
  const before = text.slice(Math.max(0, start - 40), start);
  const original = text.slice(start, end);
  const after = text.slice(end, Math.min(text.length, end + 40));
  return `…${before}⟦${original}⟧${after}…`;
}

function sequenceDescription(sequence: GateSequence): string {
  return sequence.kind === "sub"
    ? `sub ${displayValues(sequence.values)}`
    : `flag (${sequence.reason})`;
}

export function renderPatternReport(
  analysis: PatternAnalysis,
  truthFile: TruthFile,
  text: string,
): string {
  const detected =
    analysis.detectedSizeCount === null ? "not detected" : String(analysis.detectedSizeCount);
  const lines = [
    `# Measurement: ${markdown(truthFile.title ?? analysis.name)}`,
    "",
    `- Source file: ${markdown(truthFile.file)}`,
    `- Designer: ${markdown(truthFile.designer ?? "not recorded")}`,
    `- Truth size count: ${analysis.sizeCount}`,
    `- Detected size count: ${detected}`,
    "- Detection matches truth: " +
      (analysis.detectedSizeCount === analysis.sizeCount ? "yes" : "no"),
    `- Truth entries counted: ${analysis.counts.counted}`,
    `- Structural check (criterion a): ${analysis.structure.passed ? "PASS" : "FAIL"}`,
    "",
    "## Structural check",
    "",
    `- Segments rejoin to input for every size: ${analysis.structure.roundTrip ? "yes" : "no"}`,
    "- Changes stay in substitution segments: " +
      (analysis.structure.substitutionsOnly ? "yes" : "no"),
    "- Segment boundaries stay stable across sizes: " +
      (analysis.structure.stableAcrossSizes ? "yes" : "no"),
  ];
  if (analysis.structure.issues.length > 0) {
    lines.push("", "Issues:");
    for (const issue of analysis.structure.issues) lines.push(`- ${markdown(issue)}`);
  }
  lines.push(
    "",
    "## Truth entries and alignment",
    "",
    "| # | Position | Context | Values | Parser alignment | Classification | Counted | Detail |",
    "|---:|---|---|---|---|---|:---:|---|",
  );
  for (const entry of analysis.entries) {
    const sequence =
      entry.parserSequenceIndex === null
        ? undefined
        : analysis.sequences[entry.parserSequenceIndex];
    const aligned =
      entry.parserSequenceIndex === null
        ? "—"
        : "#" +
          (entry.parserSequenceIndex + 1) +
          " " +
          (sequence ? sequenceDescription(sequence) : "");
    lines.push(
      "| " +
        (entry.truthIndex + 1) +
        " | " +
        markdown(entry.truth.position) +
        " | " +
        markdown(entry.truth.context) +
        " | " +
        markdown(displayValues(entry.truth.values)) +
        " | " +
        markdown(aligned) +
        " | **" +
        entry.classification +
        "** | " +
        (entry.counted ? "yes" : "no") +
        " | " +
        markdown(entry.detail) +
        " |",
    );
  }

  const alignedTruthBySequence = new Map<number, number>();
  for (const entry of analysis.entries) {
    if (entry.parserSequenceIndex !== null) {
      alignedTruthBySequence.set(entry.parserSequenceIndex, entry.truthIndex);
    }
  }
  lines.push(
    "",
    "## Parser substitutions and flags",
    "",
    "Each item includes about 40 characters of source context on either side.",
    "",
  );
  if (analysis.sequences.length === 0) lines.push("No substitutions or flags.");
  for (let index = 0; index < analysis.sequences.length; index += 1) {
    const sequence = analysis.sequences[index];
    if (!sequence) continue;
    const truthIndex = alignedTruthBySequence.get(index);
    const aligned =
      truthIndex === undefined
        ? "false positive / no truth alignment"
        : `truth entry #${truthIndex + 1}`;
    lines.push(
      index +
        1 +
        ". **" +
        (sequence.kind === "sub" ? "Substitution" : "Flag") +
        "** — " +
        markdown(sequence.original),
      `   - Result: ${markdown(sequenceDescription(sequence))}`,
      `   - Alignment: ${aligned}`,
      `   - Context: ${markdown(sourceContext(text, sequence))}`,
    );
  }

  lines.push("", "## Source errors", "");
  const sourceErrors = analysis.entries.filter((entry) => entry.truth.sourceError);
  if (sourceErrors.length === 0) {
    lines.push("No truth entries are marked sourceError.");
  } else {
    for (const entry of sourceErrors) {
      const action =
        entry.parserSequenceIndex === null
          ? `not aligned; ${entry.classification}`
          : analysis.sequences[entry.parserSequenceIndex]?.kind === "sub"
            ? "substituted incorrectly"
            : "flagged as expected";
      lines.push(`- Truth entry #${entry.truthIndex + 1}: ${action}.`);
    }
  }

  lines.push(
    "",
    "## Counts",
    "",
    `- Counted: ${analysis.counts.counted}`,
    `- Correct: ${analysis.counts.correct}`,
    `- Flagged: ${analysis.counts.flagged}`,
    `- Wrong substitutions, including false positives: ${analysis.counts.wrong}`,
    `- False positives: ${analysis.counts.falsePositives}`,
    `- Missed by parser: ${analysis.counts.missed}`,
    `- Lost in extraction and counted: ${analysis.counts.lost}`,
    `- Lost schematic entries excluded from denominator: ${analysis.counts.uncountedFigureLoss}`,
    "",
  );
  return lines.join("\n");
}

export function renderErrorReport(name: string, message: string): string {
  return [`# Measurement failed: ${markdown(name)}`, "", markdown(message), ""].join("\n");
}

function countCell(
  analysis: PatternAnalysis | undefined,
  key: keyof PatternAnalysis["counts"],
): string {
  return analysis ? String(analysis.counts[key]) : "—";
}

function formatRate(rate: number | null): string {
  return rate === null ? "not available" : `${(rate * 100).toFixed(2)}%`;
}

export function renderSummaryReport(
  analyses: PatternAnalysis[],
  failures: PatternFailure[],
  truthFileCount: number,
): string {
  const byName = new Map(analyses.map((analysis) => [analysis.name, analysis]));
  const criteria =
    failures.length === 0
      ? calculateGateCriteria(
          analyses.map((analysis) => ({
            name: analysis.name,
            counted: analysis.counts.counted,
            correct: analysis.counts.correct,
            wrong: analysis.counts.wrong,
            structurePassed: analysis.structure.passed,
          })),
        )
      : null;
  const names = [
    ...analyses.map((analysis) => analysis.name),
    ...failures.map((failure) => failure.name),
  ].sort((left, right) => left.localeCompare(right));
  const lines = [
    "# Feasibility gate summary",
    "",
    "Patterns found: " +
      truthFileCount +
      "; measured: " +
      analyses.length +
      "; errors: " +
      failures.length +
      ".",
    "",
    "| Pattern | Counted | Correct | Flagged | Wrong | False positives | Missed | Lost | Figure loss (excluded) | Detected size count / truth |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---|",
  ];
  for (const name of names) {
    const analysis = byName.get(name);
    if (!analysis) {
      lines.push(`| ${markdown(name)} | — | — | — | — | — | — | — | — | ERROR |`);
      continue;
    }
    const detected =
      analysis.detectedSizeCount === null ? "not detected" : String(analysis.detectedSizeCount);
    lines.push(
      "| " +
        markdown(name) +
        " | " +
        countCell(analysis, "counted") +
        " | " +
        countCell(analysis, "correct") +
        " | " +
        countCell(analysis, "flagged") +
        " | " +
        countCell(analysis, "wrong") +
        " | " +
        countCell(analysis, "falsePositives") +
        " | " +
        countCell(analysis, "missed") +
        " | " +
        countCell(analysis, "lost") +
        " | " +
        countCell(analysis, "uncountedFigureLoss") +
        " | " +
        detected +
        " / " +
        analysis.sizeCount +
        " |",
    );
  }

  lines.push("", "## Gate criteria", "");
  if (failures.length > 0) {
    lines.push(
      "Not evaluated because one or more truth files or sources could not be measured.",
      "",
    );
    for (const failure of failures)
      lines.push(`- ${markdown(failure.name)}: ${markdown(failure.message)}`);
    lines.push("");
  } else if (!criteria?.evaluated) {
    lines.push("Not evaluated because no truth files were found.", "");
  } else {
    lines.push(
      "- **(a) Structural check:** " +
        (criteria.criterionA ? "PASS" : "FAIL") +
        " — every substitution run rejoins to its input and changes only substitution segments.",
      "- **(b1) Wrong pattern count:** " +
        (criteria.criterionBPatterns ? "PASS" : "FAIL") +
        " — " +
        criteria.wrongPatternCount +
        " patterns with wrong substitutions (limit " +
        MAX_WRONG_PATTERNS +
        ").",
      "- **(b2) Overall wrong rate:** " +
        (criteria.criterionBOverall ? "PASS" : "FAIL") +
        " — " +
        criteria.wrongTotal +
        " wrong substitutions / " +
        criteria.countedTotal +
        " counted truth entries (" +
        formatRate(criteria.wrongRate) +
        "; limit " +
        formatRate(MAX_WRONG_RATE) +
        ").",
      "- **(c) Median correct rate:** " +
        (criteria.criterionC ? "PASS" : "FAIL") +
        " — " +
        formatRate(criteria.medianCorrectRate) +
        " (limit " +
        formatRate(MIN_MEDIAN_CORRECT_RATE) +
        ").",
      "",
      `**Overall: ${criteria.passed ? "PASS" : "FAIL"}**`,
      "",
    );
  }
  return lines.join("\n");
}
