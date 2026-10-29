import { formatPartialDate } from "./dates.ts";
import type { Entry, PartialDate } from "./schema.ts";

function sharedPeriod(left: PartialDate, right: PartialDate): "day" | "month" | "year" | undefined {
  if (left.precision === "unknown" || right.precision === "unknown") return undefined;
  if (left.precision === "day" && right.precision === "day" && left.value === right.value)
    return "day";
  const coarser = left.precision === "year" || right.precision === "year" ? 4 : 7;
  if (left.value.slice(0, coarser) !== right.value.slice(0, coarser)) return undefined;
  return coarser === 7 ? "month" : "year";
}

/** The studio entry a game was made at, when the archive has one. */
export function studioOf(game: Entry, entries: Entry[]): Entry | undefined {
  if (game.kind !== "game" || game.studio === undefined) return undefined;
  return entries.find((entry) => entry.kind === "studio" && entry.name === game.studio);
}

/** Cancelled games in the archive that were made at a studio. */
export function gamesOf(studio: Entry, entries: Entry[]): Entry[] {
  if (studio.kind !== "studio") return [];
  return entries.filter((entry) => entry.kind === "game" && entry.studio === studio.name);
}

/**
 * The text before and after the studio's name in a game's studio line, such as "Its studio, " and
 * ", was closed too; both entries are dated May 2025.". It says only how the archive dates the two
 * entries, since a source may date a closure by its announcement rather than its completion.
 */
export function studioFateParts(game: Entry, studio: Entry): [string, string] {
  let dates: string;
  const period = sharedPeriod(game.end, studio.end);
  if (studio.end.precision === "unknown") {
    dates = "its date is unknown";
  } else if (period === undefined) {
    dates = `its entry is dated ${formatPartialDate(studio.end)}`;
  } else {
    const shared: PartialDate =
      period === "day"
        ? studio.end
        : { value: studio.end.value.slice(0, period === "month" ? 7 : 4), precision: period };
    dates = `both entries are dated ${formatPartialDate(shared)}`;
  }

  if (studio.announced === true)
    return ["EA also announced the closure of its studio, ", `; ${dates}.`];
  const verb =
    studio.status === "merged"
      ? `was merged into ${studio.mergedInto ?? "another studio"}`
      : "was closed too";
  return ["Its studio, ", `, ${verb}; ${dates}.`];
}
