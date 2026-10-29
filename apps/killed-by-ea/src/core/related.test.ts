import { describe, expect, it } from "vitest";
import { gamesOf, studioFateParts, studioOf } from "./related.ts";
import type { Entry, PartialDate } from "./schema.ts";

function entry(overrides: Partial<Entry> & Pick<Entry, "id" | "kind" | "status" | "end">): Entry {
  return { name: overrides.id, summary: "", sources: [], check: "", ...overrides };
}

const day = (value: string): PartialDate => ({ value, precision: "day" });
const month = (value: string): PartialDate => ({ value, precision: "month" });

describe("studio links", () => {
  const bioware = entry({
    id: "bioware",
    name: "BioWare",
    kind: "studio",
    status: "closed",
    end: day("2026-10-21"),
  });
  const massEffect = entry({
    id: "mass-effect",
    kind: "game",
    status: "cancelled",
    end: day("2026-10-21"),
    studio: "BioWare",
  });
  const respawnGame = entry({
    id: "respawn-game",
    kind: "game",
    status: "cancelled",
    end: day("2024-02-28"),
    studio: "Respawn",
  });
  const entries = [bioware, massEffect, respawnGame];

  it("finds a game's studio entry and a studio's games", () => {
    expect(studioOf(massEffect, entries)).toBe(bioware);
    expect(studioOf(respawnGame, entries)).toBeUndefined();
    expect(gamesOf(bioware, entries)).toEqual([massEffect]);
    expect(gamesOf(massEffect, entries)).toEqual([]);
  });

  it("gives the archive's dates for both entries, at the precision they share", () => {
    expect(studioFateParts(massEffect, bioware)).toEqual([
      "Its studio, ",
      ", was closed too; both entries are dated 21 October 2026.",
    ]);
    const studio = entry({ id: "s", kind: "studio", status: "closed", end: month("2025-05") });
    expect(
      studioFateParts(
        entry({ id: "g", kind: "game", status: "cancelled", end: month("2025-05") }),
        studio,
      ),
    ).toEqual(["Its studio, ", ", was closed too; both entries are dated May 2025."]);
    expect(
      studioFateParts(
        entry({ id: "g", kind: "game", status: "cancelled", end: day("2025-05-02") }),
        studio,
      ),
    ).toEqual(["Its studio, ", ", was closed too; both entries are dated May 2025."]);
    expect(
      studioFateParts(
        entry({ id: "g", kind: "game", status: "cancelled", end: day("2023-01-05") }),
        studio,
      ),
    ).toEqual(["Its studio, ", ", was closed too; its entry is dated May 2025."]);
    expect(
      studioFateParts(
        entry({ id: "g", kind: "game", status: "cancelled", end: { precision: "unknown" } }),
        bioware,
      ),
    ).toEqual(["Its studio, ", ", was closed too; its entry is dated 21 October 2026."]);
  });

  it("names the studio a merged studio joined", () => {
    const merged = entry({
      id: "m",
      kind: "studio",
      status: "merged",
      mergedInto: "Criterion Games",
      end: day("2022-05-12"),
    });
    const game = entry({
      id: "g",
      kind: "game",
      status: "cancelled",
      end: { value: "2022", precision: "year" },
    });
    expect(studioFateParts(game, merged)).toEqual([
      "Its studio, ",
      ", was merged into Criterion Games; both entries are dated 2022.",
    ]);
  });

  it("says only that a closure was announced when the source says no more", () => {
    const announced = { ...bioware, announced: true };
    expect(studioFateParts(massEffect, announced)).toEqual([
      "EA also announced the closure of its studio, ",
      "; both entries are dated 21 October 2026.",
    ]);
  });
});
