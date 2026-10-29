import { describe, expect, it } from "vitest";
import archive from "../../data/entries.json";
import { CUTOFF, type Entry, validate } from "./schema.ts";

const source = {
  url: "https://example.com/article",
  archive: "https://web.archive.org/web/20261024020744/https://example.com/article",
  title: "Example report",
  publisher: "Example News",
};

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    id: "example-entry",
    name: "Example entry",
    kind: "game",
    status: "cancelled",
    end: { value: "2025-05", precision: "month" },
    summary: "EA cancelled an example project.",
    sources: [source],
    check: "Example News reported the event in May 2025.",
    ...overrides,
  };
}

function makeArchive(entries: unknown[] = [makeEntry()]): Record<string, unknown> {
  return { schemaVersion: 1, cutoff: CUTOFF, entries };
}

describe("validate", () => {
  it("accepts the supplied archive data", () => {
    expect(validate(archive)).toEqual([]);
  });

  it("rejects a wrong schema version", () => {
    expect(validate({ ...makeArchive(), schemaVersion: 2 })).toContain("schemaVersion must be 1.");
  });

  it("rejects a wrong cutoff", () => {
    expect(validate({ ...makeArchive(), cutoff: "2026-10-23" })).toContain(
      `cutoff must be ${CUTOFF}.`,
    );
  });

  it("rejects a missing required field", () => {
    const entry = makeEntry() as Partial<Entry>;
    delete entry.name;
    expect(validate(makeArchive([entry]))).toContain("entries[0].name is required.");
  });

  it("rejects an unknown kind", () => {
    expect(validate(makeArchive([{ ...makeEntry(), kind: "company" }]))).toContain(
      "entries[0].kind is unknown.",
    );
  });

  it("rejects a status that is not allowed for the kind", () => {
    expect(validate(makeArchive([makeEntry({ status: "closed" as Entry["status"] })]))).toContain(
      "entries[0].status closed is not allowed for kind game.",
    );
  });

  it("rejects a malformed or impossible date", () => {
    expect(
      validate(makeArchive([{ ...makeEntry(), end: { value: "2023-02-29", precision: "day" } }])),
    ).toContain("entries[0].end is malformed or impossible.");
  });

  it("rejects an end date after the cutoff", () => {
    expect(
      validate(makeArchive([makeEntry({ end: { value: "2026-10-23", precision: "day" } })])),
    ).toContain(`entries[0].end is after the cutoff ${CUTOFF}.`);
  });

  it("rejects a start date after the end date", () => {
    expect(
      validate(
        makeArchive([
          makeEntry({
            start: { value: "2026-01", precision: "month" },
            end: { value: "2025-05", precision: "month" },
          }),
        ]),
      ),
    ).toContain("entries[0].start is after entries[0].end.");
  });

  it("rejects an archive URL that does not point to the source URL", () => {
    expect(
      validate(
        makeArchive([makeEntry({ sources: [{ ...source, archive: "https://example.com/copy" }] })]),
      ),
    ).toContain("entries[0].sources[0].archive must be a Wayback copy of the same source URL.");
  });

  it("rejects Wikipedia as a source publisher", () => {
    expect(
      validate(makeArchive([makeEntry({ sources: [{ ...source, publisher: "Wikipedia" }] })])),
    ).toContain("entries[0].sources[0].publisher cannot be Wikipedia.");
  });

  it("rejects duplicate ids", () => {
    expect(
      validate(
        makeArchive([
          makeEntry(),
          makeEntry({ name: "A different project", end: { value: "2024", precision: "year" } }),
        ]),
      ),
    ).toContain("entries[1].id duplicates example-entry.");
  });

  it("rejects duplicate name, kind, and end tuples", () => {
    expect(validate(makeArchive([makeEntry(), makeEntry({ id: "another-id" })]))).toContain(
      "entries[1] duplicates the name, kind, and end date.",
    );
  });

  it("requires a successor for a merged studio", () => {
    expect(
      validate(
        makeArchive([makeEntry({ kind: "studio", status: "merged", mergedInto: undefined })]),
      ),
    ).toContain("entries[0].mergedInto is required for a merged studio.");
  });

  it("requires a note for an unknown end date", () => {
    expect(validate(makeArchive([makeEntry({ end: { precision: "unknown" } })]))).toContain(
      "entries[0].note is required when the end date is unknown.",
    );
  });

  it("accepts an unknown end date when it includes a note", () => {
    expect(
      validate(
        makeArchive([
          makeEntry({
            end: { precision: "unknown" },
            note: "The reporting did not give a closure date.",
          }),
        ]),
      ),
    ).toEqual([]);
  });

  it("rejects an empty check", () => {
    expect(validate(makeArchive([makeEntry({ check: " " })]))).toContain(
      "entries[0].check must not be empty.",
    );
  });

  it("rejects summaries over 200 characters", () => {
    expect(validate(makeArchive([makeEntry({ summary: "x".repeat(201) })]))).toContain(
      "entries[0].summary must be 200 characters or fewer.",
    );
  });
});
