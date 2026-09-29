import type { TruthSequence } from "./measure.ts";

export interface TruthFile {
  file: string;
  title?: string;
  designer?: string;
  url?: string;
  craft?: "knit" | "crochet";
  source?: "pdf" | "web";
  sizeCount: number;
  sequences: TruthSequence[];
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Truth file field ${field} must be a non-empty string.`);
  }
  return value;
}

function optionalString(record: Record<string, unknown>, field: string): string | undefined {
  const value = record[field];
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`Truth file field ${field} must be a string.`);
  }
  return value;
}

/** Validates the hand-authored annotation before the CLI reads its sibling source file. */
export function parseTruthFile(json: string): TruthFile {
  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Truth file must contain a JSON object.");
  }
  const record = parsed as Record<string, unknown>;
  const file = requireString(record.file, "file");
  if (file.includes("/") || file.includes("\\") || file === "." || file === "..") {
    throw new Error("Truth file field file must name a source in the same folder.");
  }

  const sizeCount = record.sizeCount;
  if (
    typeof sizeCount !== "number" ||
    !Number.isInteger(sizeCount) ||
    sizeCount < 2 ||
    sizeCount > 12
  ) {
    throw new Error("Truth file sizeCount must be an integer from 2 through 12.");
  }
  if (!Array.isArray(record.sequences)) {
    throw new Error("Truth file sequences must be an array.");
  }

  const sequences = record.sequences.map((value, index): TruthSequence => {
    if (typeof value !== "object" || value === null) {
      throw new Error(`Truth sequence ${index + 1} must be an object.`);
    }
    const entry = value as Record<string, unknown>;
    if (!Array.isArray(entry.values) || entry.values.length === 0) {
      throw new Error(`Truth sequence ${index + 1} must have at least one value.`);
    }
    const values = entry.values.map((item, valueIndex) =>
      requireString(item, `sequences[${index}].values[${valueIndex}]`),
    );
    if (entry.inFigure !== undefined && typeof entry.inFigure !== "boolean") {
      throw new Error(`Truth sequence ${index + 1} inFigure must be a boolean.`);
    }
    if (entry.inSizeBlock !== undefined && typeof entry.inSizeBlock !== "boolean") {
      throw new Error(`Truth sequence ${index + 1} inSizeBlock must be a boolean.`);
    }
    if (entry.sourceError !== undefined && typeof entry.sourceError !== "boolean") {
      throw new Error(`Truth sequence ${index + 1} sourceError must be a boolean.`);
    }
    return {
      values,
      context: requireString(entry.context, `sequences[${index}].context`),
      position: requireString(entry.position, `sequences[${index}].position`),
      ...(entry.inFigure === true ? { inFigure: true } : {}),
      ...(entry.inSizeBlock === true ? { inSizeBlock: true } : {}),
      ...(entry.sourceError === true ? { sourceError: true } : {}),
    };
  });

  if (record.craft !== undefined && record.craft !== "knit" && record.craft !== "crochet") {
    throw new Error("Truth file craft must be knit or crochet.");
  }
  if (record.source !== undefined && record.source !== "pdf" && record.source !== "web") {
    throw new Error("Truth file source must be pdf or web.");
  }

  const title = optionalString(record, "title");
  const designer = optionalString(record, "designer");
  const url = optionalString(record, "url");
  return {
    file,
    ...(title !== undefined ? { title } : {}),
    ...(designer !== undefined ? { designer } : {}),
    ...(url !== undefined ? { url } : {}),
    ...(record.craft === "knit" || record.craft === "crochet" ? { craft: record.craft } : {}),
    ...(record.source === "pdf" || record.source === "web" ? { source: record.source } : {}),
    sizeCount,
    sequences,
  };
}
