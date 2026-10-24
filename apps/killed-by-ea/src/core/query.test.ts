import { describe, expect, it } from "vitest";
import {
  countByKind,
  defaultQueryState,
  filterEntries,
  groupByYear,
  parseUrlState,
  serializeUrlState,
  yearsIn,
} from "./query.ts";
import type { Entry, Kind } from "./schema.ts";

function entry(
  id: string,
  name: string,
  kind: Kind,
  end: Entry["end"],
  extra: Partial<Entry> = {},
): Entry {
  return {
    id,
    name,
    kind,
    status: kind === "game" ? "cancelled" : kind === "studio" ? "closed" : "ended",
    end,
    summary: "A neutral summary.",
    sources: [],
    check: "A source supports the event.",
    ...extra,
  };
}

const entries = [
  entry("studio", "BioWare", "studio", { value: "2026-10-21", precision: "day" }),
  entry(
    "game",
    "Mass Effect",
    "game",
    { value: "2026-10-21", precision: "day" },
    {
      studio: "BioWare",
      series: "Mass Effect",
    },
  ),
  entry(
    "project",
    "Café Online",
    "project",
    { value: "2025-05", precision: "month" },
    {
      mergedInto: "EA Café",
    },
  ),
  entry(
    "unknown",
    "Unknown project",
    "project",
    { precision: "unknown" },
    {
      note: "The closure year was not reported.",
    },
  ),
];

describe("query helpers", () => {
  it("searches case-insensitively across names, series, studios, and successors", () => {
    expect(
      filterEntries(entries, { ...defaultQueryState(), q: "bioware" }).map(({ id }) => id),
    ).toEqual(["studio", "game"]);
    expect(
      filterEntries(entries, { ...defaultQueryState(), q: "mass effect" }).map(({ id }) => id),
    ).toEqual(["game"]);
    expect(
      filterEntries(entries, { ...defaultQueryState(), q: "cafe" }).map(({ id }) => id),
    ).toEqual(["project"]);
    expect(
      filterEntries(entries, { ...defaultQueryState(), q: "ea cafe" }).map(({ id }) => id),
    ).toEqual(["project"]);
  });

  it("filters by more than one selected kind and by year", () => {
    const selected = filterEntries(entries, { q: "", kinds: ["game", "project"], year: "2025" });
    expect(selected.map(({ id }) => id)).toEqual(["project"]);
    expect(
      filterEntries(entries, { q: "", kinds: ["project"], year: "unknown" }).map(({ id }) => id),
    ).toEqual(["unknown"]);
  });

  it("groups newest years first and puts unknown dates last", () => {
    const groups = groupByYear(entries);
    expect(groups.map(({ label }) => label)).toEqual(["2026", "2025", "Date unknown"]);
    expect(groups[0]?.entries.map(({ id }) => id)).toEqual(["game", "studio"]);
    expect(groups[2]?.entries.map(({ id }) => id)).toEqual(["unknown"]);
    expect(yearsIn(entries)).toEqual(["2026", "2025"]);
  });

  it("counts each kind", () => {
    expect(countByKind(entries)).toEqual({ game: 1, studio: 1, project: 2 });
  });

  it("serializes and restores URL state", () => {
    const state = { q: "Café ray", kinds: ["game", "project"] as const, year: "2025" };
    const serialized = serializeUrlState({ ...state, kinds: [...state.kinds] });
    expect(serialized).toBe("?q=Caf%C3%A9+ray&kind=game%2Cproject&year=2025");
    expect(parseUrlState(serialized)).toEqual({
      q: state.q,
      kinds: ["game", "project"],
      year: "2025",
    });
  });

  it("leaves default values out of the URL", () => {
    expect(serializeUrlState(defaultQueryState())).toBe("");
    expect(serializeUrlState({ ...defaultQueryState(), q: "visceral" })).toBe("?q=visceral");
  });

  it("ignores unknown parameters and invalid kind or year values", () => {
    expect(parseUrlState("?q=test&kind=game,pretend&year=bad&extra=value")).toEqual({
      q: "test",
      kinds: ["game"],
      year: "",
    });
    expect(parseUrlState("?extra=value")).toEqual(defaultQueryState());
  });

  it("preserves an intentionally empty kind selection", () => {
    expect(parseUrlState(serializeUrlState({ q: "", kinds: [], year: "" }))).toEqual({
      q: "",
      kinds: [],
      year: "",
    });
  });
});
