import { isPartialDateAfter, parsePartialDate } from "./dates.ts";

export const CUTOFF = "2026-10-22";

export const KINDS = ["game", "studio", "project"] as const;
export type Kind = (typeof KINDS)[number];

export const STATUSES = ["cancelled", "closed", "merged", "ended"] as const;
export type Status = (typeof STATUSES)[number];

export type PartialDate =
  | { value: string; precision: "day" | "month" | "year" }
  | { precision: "unknown" };

export interface Source {
  url: string;
  archive: string;
  title: string;
  publisher: string;
}

export interface Entry {
  id: string;
  name: string;
  kind: Kind;
  status: Status;
  start?: PartialDate;
  end: PartialDate;
  summary: string;
  studio?: string;
  series?: string;
  mergedInto?: string;
  reported?: boolean;
  /** The source announces a closure or shutdown but doesn't show that it took effect. */
  announced?: boolean;
  sources: Source[];
  note?: string;
  check: string;
}

export interface ArchiveData {
  schemaVersion: 1;
  cutoff: typeof CUTOFF;
  entries: Entry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isKind(value: unknown): value is Kind {
  return typeof value === "string" && KINDS.includes(value as Kind);
}

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && STATUSES.includes(value as Status);
}

function getNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function sourceUrlIsValid(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function validateSources(value: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array with at least one source.`);
    return;
  }
  if (value.length === 0) errors.push(`${path} must contain at least one source.`);

  value.forEach((source, index) => {
    const sourcePath = `${path}[${index}]`;
    if (!isRecord(source)) {
      errors.push(`${sourcePath} must be an object.`);
      return;
    }

    for (const field of ["url", "archive", "title", "publisher"] as const) {
      if (!getNonEmptyString(source[field])) {
        errors.push(`${sourcePath}.${field} is required.`);
      }
    }

    if (getNonEmptyString(source.url) && !sourceUrlIsValid(source.url)) {
      errors.push(`${sourcePath}.url must be an HTTP or HTTPS URL.`);
    }

    if (getNonEmptyString(source.archive)) {
      const archiveMatch = /^https:\/\/web\.archive\.org\/web\/(\d{14})\/(.+)$/.exec(
        source.archive,
      );
      if (
        archiveMatch === null ||
        (getNonEmptyString(source.url) && archiveMatch[2] !== source.url)
      ) {
        errors.push(`${sourcePath}.archive must be a Wayback copy of the same source URL.`);
      }
    }

    if (
      getNonEmptyString(source.publisher) &&
      source.publisher.toLocaleLowerCase().includes("wikipedia")
    ) {
      errors.push(`${sourcePath}.publisher cannot be Wikipedia.`);
    }
  });
}

function validateEntry(value: unknown, index: number, errors: string[], ids: Set<string>): void {
  const path = `entries[${index}]`;
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return;
  }

  const requiredStrings = ["id", "name", "summary", "check"] as const;
  for (const field of requiredStrings) {
    if (typeof value[field] !== "string") errors.push(`${path}.${field} is required.`);
  }

  if (!getNonEmptyString(value.id)) {
    if (typeof value.id === "string") errors.push(`${path}.id must not be empty.`);
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.id)) {
    errors.push(`${path}.id must be kebab-case.`);
  }
  if (typeof value.name === "string" && value.name.trim() === "") {
    errors.push(`${path}.name must not be empty.`);
  }
  if (typeof value.summary === "string") {
    if (value.summary.trim() === "") errors.push(`${path}.summary must not be empty.`);
    if (value.summary.length > 200) errors.push(`${path}.summary must be 200 characters or fewer.`);
  }
  if (typeof value.check === "string" && value.check.trim() === "") {
    errors.push(`${path}.check must not be empty.`);
  }

  if (!Object.hasOwn(value, "kind")) {
    errors.push(`${path}.kind is required.`);
  } else if (!isKind(value.kind)) {
    errors.push(`${path}.kind is unknown.`);
  }

  if (!Object.hasOwn(value, "status")) {
    errors.push(`${path}.status is required.`);
  } else if (!isStatus(value.status)) {
    errors.push(`${path}.status is unknown.`);
  } else if (isKind(value.kind)) {
    const allowed: Record<Kind, readonly Status[]> = {
      game: ["cancelled"],
      studio: ["closed", "merged"],
      project: ["ended"],
    };
    if (!allowed[value.kind].includes(value.status)) {
      errors.push(`${path}.status ${value.status} is not allowed for kind ${value.kind}.`);
    }
  }

  if (!Object.hasOwn(value, "end")) {
    errors.push(`${path}.end is required.`);
  }
  const end = parsePartialDate(value.end);
  if (end === null && Object.hasOwn(value, "end")) {
    errors.push(`${path}.end is malformed or impossible.`);
  }
  if (end?.precision === "unknown" && !getNonEmptyString(value.note)) {
    errors.push(`${path}.note is required when the end date is unknown.`);
  }
  if (end !== null && end !== undefined && end.precision !== "unknown") {
    const cutoff = parsePartialDate({ value: CUTOFF, precision: "day" });
    if (cutoff !== null && isPartialDateAfter(end, cutoff)) {
      errors.push(`${path}.end is after the cutoff ${CUTOFF}.`);
    }
  }

  let start: PartialDate | undefined;
  if (Object.hasOwn(value, "start")) {
    const parsedStart = parsePartialDate(value.start);
    if (parsedStart === null) {
      errors.push(`${path}.start is malformed or impossible.`);
    } else {
      start = parsedStart;
    }
  }
  if (start !== undefined && end !== null && end !== undefined && isPartialDateAfter(start, end)) {
    errors.push(`${path}.start is after ${path}.end.`);
  }

  if (
    value.kind === "studio" &&
    value.status === "merged" &&
    !getNonEmptyString(value.mergedInto)
  ) {
    errors.push(`${path}.mergedInto is required for a merged studio.`);
  }
  if (value.mergedInto !== undefined && !getNonEmptyString(value.mergedInto)) {
    errors.push(`${path}.mergedInto must not be empty.`);
  }
  for (const field of ["studio", "series", "note"] as const) {
    if (value[field] !== undefined && typeof value[field] !== "string") {
      errors.push(`${path}.${field} must be a string when provided.`);
    }
  }
  if (value.reported !== undefined && typeof value.reported !== "boolean") {
    errors.push(`${path}.reported must be a boolean when provided.`);
  }
  if (value.announced !== undefined) {
    if (typeof value.announced !== "boolean") {
      errors.push(`${path}.announced must be a boolean when provided.`);
    } else if (value.announced && value.status !== "closed" && value.status !== "ended") {
      errors.push(`${path}.announced is only for a closed studio or an ended project.`);
    }
    if (value.announced === true && !getNonEmptyString(value.note)) {
      errors.push(`${path}.note is required when a closure is only announced.`);
    }
  }

  if (!Object.hasOwn(value, "sources")) {
    errors.push(`${path}.sources is required.`);
  } else {
    validateSources(value.sources, `${path}.sources`, errors);
  }

  if (getNonEmptyString(value.id)) {
    if (ids.has(value.id)) errors.push(`${path}.id duplicates ${value.id}.`);
    ids.add(value.id);
  }
}

/** Validates an archive without assuming that the imported JSON has the declared TypeScript shape. */
export function validate(data: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(data)) return ["data must be an object."];

  if (data.schemaVersion !== 1) errors.push("schemaVersion must be 1.");
  if (data.cutoff !== CUTOFF) errors.push(`cutoff must be ${CUTOFF}.`);
  if (!Array.isArray(data.entries)) {
    errors.push("entries must be an array.");
    return errors;
  }

  const ids = new Set<string>();
  const tuples = new Set<string>();
  for (const [index, entry] of data.entries.entries()) {
    validateEntry(entry, index, errors, ids);
    if (!isRecord(entry)) continue;

    const parsedEnd = parsePartialDate(entry.end);
    if (getNonEmptyString(entry.name) && isKind(entry.kind) && parsedEnd !== null) {
      const endKey =
        parsedEnd.precision === "unknown" ? "unknown" : `${parsedEnd.precision}:${parsedEnd.value}`;
      const tupleKey = JSON.stringify([entry.name, entry.kind, endKey]);
      if (tuples.has(tupleKey)) {
        errors.push(`entries[${index}] duplicates the name, kind, and end date.`);
      }
      tuples.add(tupleKey);
    }
  }

  return errors;
}
