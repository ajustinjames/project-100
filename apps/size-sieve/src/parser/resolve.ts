import { findSequences, type SequenceOptions } from "./sequences.ts";

export type Segment =
  | { kind: "text"; text: string }
  | {
      kind: "sub";
      original: string;
      value: string;
      notApplicable: boolean;
      /** Parsed values from the original sequence, kept for measurement and alignment. */
      sourceValues?: string[];
    }
  | { kind: "flag"; original: string; reason: "count-mismatch" | "size-label" };

const PLACEHOLDERS = new Set(["-", "x", "X", "–", "—"]);

function appendText(segments: Segment[], text: string): void {
  if (text.length === 0) return;
  const previous = segments[segments.length - 1];
  if (previous?.kind === "text") {
    previous.text += text;
  } else {
    segments.push({ kind: "text", text });
  }
}

/**
 * Resolves only classified size sequences. An invalid size index leaves candidate
 * sequences as text because a guessed index could silently change the pattern.
 */
export function resolve(text: string, options: SequenceOptions, chosenIndex: number): Segment[] {
  const sequences = findSequences(text, options);
  const validIndex =
    Number.isInteger(chosenIndex) && chosenIndex >= 0 && chosenIndex < options.count;
  const segments: Segment[] = [];
  let cursor = 0;

  for (const sequence of sequences) {
    appendText(segments, text.slice(cursor, sequence.start));

    if (sequence.kind === "flag") {
      segments.push({ kind: "flag", original: sequence.original, reason: sequence.reason });
    } else if (!validIndex) {
      appendText(segments, sequence.original);
    } else {
      const value = sequence.values[chosenIndex];
      if (value === undefined) {
        // Keep an incomplete candidate as text instead of emitting an empty value.
        appendText(segments, sequence.original);
        cursor = sequence.end;
        continue;
      }
      segments.push({
        kind: "sub",
        original: sequence.original,
        value,
        notApplicable: PLACEHOLDERS.has(value.trim()),
        sourceValues: sequence.values,
      });
    }

    cursor = sequence.end;
  }

  appendText(segments, text.slice(cursor));
  return segments;
}

/** Reconstructs the original input from resolver segments. */
export function rejoinSegments(segments: Segment[]): string {
  return segments
    .map((segment) => (segment.kind === "text" ? segment.text : segment.original))
    .join("");
}
