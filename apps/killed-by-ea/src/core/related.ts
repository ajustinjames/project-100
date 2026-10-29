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

/** "closed the same day", "was merged into Criterion Games in May 2022", and so on. */
export function studioFatePhrase(game: Entry, studio: Entry): string {
  const verb =
    studio.status === "merged"
      ? `was merged into ${studio.mergedInto ?? "another studio"}`
      : "closed";
  const period = sharedPeriod(game.end, studio.end);
  if (period !== undefined) return `${verb} the same ${period}`;
  if (studio.end.precision === "unknown") return `${verb} on a date unknown`;
  const when = formatPartialDate(studio.end);
  return `${verb} ${studio.end.precision === "day" ? "on" : "in"} ${when}`;
}
