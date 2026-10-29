// ajj-design tokens are imported in style.css; this registers the hardline components.
import "@ajustinjames/hardline-components";
import "./style.css";

import archive from "../data/entries.json";
import { formatAge, formatAgo, formatPartialDate } from "./core/dates.ts";
import {
  ALL_KINDS,
  countByKind,
  defaultQueryState,
  filterEntries,
  groupByYear,
  parseUrlState,
  type QueryState,
  serializeUrlState,
  yearsIn,
} from "./core/query.ts";
import { gamesOf, studioFateParts, studioOf } from "./core/related.ts";
import { type ArchiveData, type Entry, type Kind, validate } from "./core/schema.ts";

const validationErrors = validate(archive);
if (validationErrors.length > 0) {
  throw new Error(`Invalid Killed by EA archive:\n${validationErrors.join("\n")}`);
}

const entries = (archive as ArchiveData).entries;
const kindNames: Record<Kind, string> = { game: "Game", studio: "Studio", project: "Project" };
const kindPlurals: Record<Kind, string> = { game: "Games", studio: "Studios", project: "Projects" };
const searchInput = requireElement<HTMLInputElement>("#search");
const kindSelect = requireElement<HTMLSelectElement>("#kind-filter");
const yearSelect = requireElement<HTMLSelectElement>("#year-filter");
const timeline = requireElement<HTMLElement>("#timeline");
const resultCount = requireElement<HTMLElement>("#result-count");
const emptyState = requireElement<HTMLElement>("#empty-state");
const clearButton = requireElement<HTMLButtonElement>("#clear-filters");
const containsUnknownDate = entries.some((entry) => entry.end.precision === "unknown");
const knownYears = [...yearsIn(entries), ...(containsUnknownDate ? ["unknown"] : [])];
const today = localIsoDay(new Date());
// Read before the first URL rewrite, which drops an entry hash the filters hide. Entry ids are
// kebab-case ASCII, so the hash is compared as is: decoding a malformed one (`#%`) would throw.
const linkedEntryId = window.location.hash.slice(1);
let state: QueryState = parseUrlState(window.location.search, knownYears);
// The kind select shows one kind or all of them, so any other mix from an old link means all.
if (state.kinds.length !== 1) state = { ...state, kinds: [...ALL_KINDS] };

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Killed by EA page is missing ${selector}`);
  return element;
}

function localIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function countText(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className !== undefined) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createSourceLink(label: string, url: string, title: string): HTMLAnchorElement {
  const link = createElement("a", "source-link", label);
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.setAttribute("aria-label", `${label}: ${title}`);
  return link;
}

function createEntryLink(target: Entry): HTMLAnchorElement {
  const link = createElement("a", "entry-link", target.name);
  link.href = `#${target.id}`;
  link.dataset.entry = target.id;
  return link;
}

function updateUrl(): void {
  // Drop an entry hash once the filters hide that entry, so the URL reproduces what's shown.
  const hashId = window.location.hash.slice(1);
  const hidesEntry =
    entries.some((entry) => entry.id === hashId) && document.getElementById(hashId) === null;
  const hash = hidesEntry ? "" : window.location.hash;
  const url = `${window.location.pathname}${serializeUrlState(state)}${hash}`;
  window.history.replaceState(null, "", url);
}

function updateControls(): void {
  searchInput.value = state.q;
  kindSelect.value = state.kinds.length === 1 ? (state.kinds[0] ?? "") : "";
  yearSelect.value = state.year;
}

function statusText(entry: Entry): string {
  if (entry.reported === true) return "Reported cancelled";
  if (entry.status === "merged") return "Merged";
  if (entry.status === "cancelled") return "Cancelled";
  if (entry.announced === true)
    return entry.status === "closed" ? "Closure announced" : "Shutdown announced";
  if (entry.status === "closed") return "Closed";
  return "Ended";
}

function appendStudioLine(card: HTMLElement, game: Entry): void {
  const studio = studioOf(game, entries);
  if (studio === undefined) {
    if (game.studio !== undefined)
      card.append(createElement("p", "entry-related", `Studio: ${game.studio}.`));
    return;
  }
  const line = createElement("p", "entry-related");
  const [before, after] = studioFateParts(game, studio);
  line.append(before, createEntryLink(studio), after);
  card.append(line);
}

function appendStudioGames(card: HTMLElement, studio: Entry): void {
  const games = gamesOf(studio, entries);
  if (games.length === 0) return;
  const line = createElement("p", "entry-related", "Cancelled games from this studio: ");
  games.forEach((game, index) => {
    if (index > 0) line.append(", ");
    line.append(createEntryLink(game));
  });
  line.append(".");
  card.append(line);
}

function createCard(entry: Entry): HTMLElement {
  const card = createElement("article", `entry kind-${entry.kind}`);
  card.id = entry.id;
  card.tabIndex = -1;

  const label = createElement("p", "entry-label");
  label.append(
    createElement("span", "entry-kind", kindNames[entry.kind]),
    createElement("span", "entry-status", statusText(entry)),
  );
  card.append(label, createElement("h3", "entry-title", entry.name));

  const when = createElement("p", "entry-when");
  when.append(createElement("span", undefined, formatPartialDate(entry.end)));
  const ago = formatAgo(entry.end, today);
  if (ago !== undefined) when.append(createElement("span", undefined, ago));
  const age = entry.kind === "game" ? undefined : formatAge(entry.start, entry.end);
  if (age !== undefined) {
    const start = entry.start === undefined ? "" : `from ${formatPartialDate(entry.start)}, `;
    when.append(createElement("span", undefined, `${start}${age.toLocaleLowerCase()} old`));
  }
  card.append(when);

  card.append(createElement("p", "entry-summary", entry.summary));
  if (entry.kind === "game") appendStudioLine(card, entry);
  if (entry.kind === "studio") appendStudioGames(card, entry);
  if (entry.note !== undefined) card.append(createElement("p", "entry-note", entry.note));

  const sourceList = createElement("ul", "source-links");
  sourceList.setAttribute("aria-label", "Sources");
  for (const source of entry.sources) {
    const sourceItem = createElement("li");
    sourceItem.append(
      createSourceLink(source.publisher, source.url, source.title),
      createSourceLink("archived", source.archive, source.title),
    );
    sourceList.append(sourceItem);
  }
  card.append(sourceList);
  return card;
}

function renderTimeline(filtered: Entry[]): void {
  timeline.replaceChildren();
  for (const group of groupByYear(filtered)) {
    const section = createElement("section", "year-group");
    const heading = createElement("h2", "year-heading");
    heading.id = `year-${group.year}`;
    heading.append(
      createElement("span", "year-label", group.label),
      createElement("span", "year-count", countText(group.entries.length, "entry", "entries")),
    );
    section.setAttribute("aria-labelledby", heading.id);
    section.append(heading);

    const list = createElement("div", "entry-list");
    for (const entry of group.entries) list.append(createCard(entry));
    section.append(list);
    timeline.append(section);
  }
}

function render(): void {
  const available = filterEntries(entries, { ...state, kinds: [...ALL_KINDS] });
  const visible = filterEntries(entries, state);
  const counts = countByKind(available);
  for (const option of kindSelect.options) {
    const kind = option.value as Kind | "";
    option.textContent =
      kind === "" ? `All kinds (${available.length})` : `${kindPlurals[kind]} (${counts[kind]})`;
  }

  resultCount.textContent = countText(visible.length, "entry", "entries");
  emptyState.hidden = visible.length !== 0;
  timeline.hidden = visible.length === 0;
  renderTimeline(visible);
}

function applyState(nextState: QueryState, writeUrl = true): void {
  state = nextState;
  updateControls();
  render();
  if (writeUrl) updateUrl();
}

function populateYearSelect(): void {
  for (const year of yearsIn(entries)) {
    const option = createElement("option", undefined, year);
    option.value = year;
    yearSelect.append(option);
  }
  if (containsUnknownDate) {
    const option = createElement("option", undefined, "Date unknown");
    option.value = "unknown";
    yearSelect.append(option);
  }
}

populateYearSelect();
updateControls();
render();
// Rewrite the URL so values the page ignored (an unknown year, say) don't stay in the address bar.
updateUrl();

searchInput.addEventListener("input", () => {
  applyState({ ...state, q: searchInput.value });
});

kindSelect.addEventListener("change", () => {
  const kind = kindSelect.value;
  applyState({
    ...state,
    kinds: ALL_KINDS.includes(kind as Kind) ? [kind as Kind] : [...ALL_KINDS],
  });
});

yearSelect.addEventListener("change", () => {
  applyState({ ...state, year: yearSelect.value });
});

/** Shows one entry: clears the filters if they hide it, then scrolls to it and focuses it. */
function jumpTo(id: string): void {
  if (!entries.some((entry) => entry.id === id)) return;
  if (document.getElementById(id) === null) applyState(defaultQueryState());
  const target = document.getElementById(id);
  if (target === null) return;
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${serializeUrlState(state)}#${id}`,
  );
  for (const marked of timeline.querySelectorAll(".is-target")) {
    marked.classList.remove("is-target");
  }
  target.classList.add("is-target");
  target.scrollIntoView({ block: "start" });
  target.focus({ preventScroll: true });
}

timeline.addEventListener("click", (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>("a[data-entry]");
  const id = link?.dataset.entry;
  if (link === null || id === undefined) return;
  // A modified click opens a new tab or window as usual; the hash handling on load does the rest.
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return;
  event.preventDefault();
  jumpTo(id);
});

// A link opened in a new tab, or shared, arrives with the entry in the hash and maybe a filter that hides it.
jumpTo(linkedEntryId);

clearButton.addEventListener("click", () => {
  applyState(defaultQueryState());
  searchInput.focus();
});
