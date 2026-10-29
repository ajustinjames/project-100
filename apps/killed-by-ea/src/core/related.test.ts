import { describe, expect, it } from "vitest";
import { gamesOf, studioFatePhrase, studioOf } from "./related.ts";
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

  it("says when the studio closed, at the precision both dates share", () => {
    expect(studioFatePhrase(massEffect, bioware)).toBe("closed the same day");
    const studio = entry({ id: "s", kind: "studio", status: "closed", end: month("2025-05") });
    expect(
      studioFatePhrase(
        entry({ id: "g", kind: "game", status: "cancelled", end: month("2025-05") }),
        studio,
      ),
    ).toBe("closed the same month");
    expect(
      studioFatePhrase(
        entry({ id: "g", kind: "game", status: "cancelled", end: day("2025-05-02") }),
        studio,
      ),
    ).toBe("closed the same month");
    expect(
      studioFatePhrase(
        entry({ id: "g", kind: "game", status: "cancelled", end: day("2023-01-05") }),
        studio,
      ),
    ).toBe("closed in May 2025");
    expect(
      studioFatePhrase(
        entry({ id: "g", kind: "game", status: "cancelled", end: { precision: "unknown" } }),
        bioware,
      ),
    ).toBe("closed on 21 October 2026");
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
    expect(studioFatePhrase(game, merged)).toBe("was merged into Criterion Games the same year");
  });
});
