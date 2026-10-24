// ajj-design tokens are imported in style.css; this registers the hardline components.
import "@ajustinjames/hardline-components";
import "./style.css";

import archive from "../data/entries.json";
import { formatAge, formatPartialDate } from "./core/dates.ts";
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
import { type ArchiveData, type Entry, type Kind, validate } from "./core/schema.ts";

const validationErrors = validate(archive);
if (validationErrors.length > 0) {
  throw new Error(`Invalid Killed by EA archive:\n${validationErrors.join("\n")}`);
}

const entries = (archive as ArchiveData).entries;
const kindNames: Record<Kind, string> = { game: "Game", studio: "Studio", project: "Project" };
const kindSymbols: Record<Kind, string> = { game: "G", studio: "S", project: "P" };
const kindButtons = [...document.querySelectorAll<HTMLButtonElement>("button[data-kind]")];
const searchInput = requireElement<HTMLInputElement>("#search");
const yearSelect = requireElement<HTMLSelectElement>("#year-filter");
const timeline = requireElement<HTMLElement>("#timeline");
const resultCount = requireElement<HTMLElement>("#result-count");
const emptyState = requireElement<HTMLElement>("#empty-state");
const clearButton = requireElement<HTMLButtonElement>("#clear-filters");
const containsUnknownDate = entries.some((entry) => entry.end.precision === "unknown");
const knownYears = [...yearsIn(entries), ...(containsUnknownDate ? ["unknown"] : [])];
let state: QueryState = parseUrlState(window.location.search, knownYears);

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Killed by EA page is missing ${selector}`);
  return element;
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

function updateUrl(): void {
  const url = `${window.location.pathname}${serializeUrlState(state)}${window.location.hash}`;
  window.history.replaceState(null, "", url);
}

function updateControls(): void {
  searchInput.value = state.q;
  yearSelect.value = state.year;
  for (const button of kindButtons) {
    const kind = button.dataset.kind;
    if (kind === undefined) continue;
    button.setAttribute("aria-pressed", String(state.kinds.includes(kind as Kind)));
  }
}

function appendRelatedGames(card: HTMLElement, studio: Entry): void {
  const hasRelatedGames = entries.some(
    (entry) => entry.kind === "game" && entry.studio === studio.name,
  );
  if (!hasRelatedGames) return;

  const linkState: QueryState = { q: studio.name, kinds: ["game"], year: "" };
  const link = createElement("a", "related-games-link", "Games in this archive");
  link.href = `${window.location.pathname}${serializeUrlState(linkState)}`;
  link.setAttribute("aria-label", `Games in this archive from ${studio.name}`);
  const paragraph = createElement("p", "related-games");
  paragraph.append(link);
  card.append(paragraph);
}

function createCard(entry: Entry): HTMLElement {
  const card = createElement("article", "entry-card");
  const cardHeading = createElement("div", "entry-heading");
  const kindLabel = createElement("p", `entry-kind kind-${entry.kind}`);
  const symbol = createElement("span", "kind-symbol", kindSymbols[entry.kind]);
  symbol.setAttribute("aria-hidden", "true");
  const kindName = createElement("span", "kind-label", kindNames[entry.kind]);
  kindLabel.append(symbol, kindName);

  const title = createElement("h3", "entry-title", entry.name);
  cardHeading.append(kindLabel, title);
  card.append(cardHeading);

  const statusText =
    entry.reported === true
      ? "Reported cancelled"
      : entry.status === "merged"
        ? `Merged into ${entry.mergedInto ?? ""}`
        : entry.status === "cancelled"
          ? "Cancelled"
          : entry.status === "closed"
            ? "Closed"
            : "Ended";
  card.append(createElement("p", "entry-status", statusText));

  if (entry.kind === "game" && entry.studio !== undefined) {
    card.append(createElement("p", "entry-studio", `Studio: ${entry.studio}`));
  }

  const dateLine = createElement("p", "entry-meta");
  const dateLabel = createElement("span", "entry-date", formatPartialDate(entry.end));
  dateLine.append(dateLabel);
  if (entry.kind !== "game") {
    const age = formatAge(entry.start, entry.end);
    if (age !== undefined) dateLine.append(createElement("span", "entry-age", age));
  }
  card.append(dateLine);

  card.append(createElement("p", "entry-summary", entry.summary));
  if (entry.note !== undefined) card.append(createElement("p", "entry-note", entry.note));
  if (entry.kind === "studio") appendRelatedGames(card, entry);

  const sourceList = createElement("ul", "source-links");
  for (const source of entry.sources) {
    const sourceItem = createElement("li");
    sourceItem.append(
      createSourceLink("Source", source.url, source.title),
      createSourceLink("Archived copy", source.archive, source.title),
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

    const cards = createElement("div", "entry-grid");
    for (const entry of group.entries) cards.append(createCard(entry));
    section.append(cards);
    timeline.append(section);
  }
}

function render(): void {
  const available = filterEntries(entries, { ...state, kinds: [...ALL_KINDS] });
  const visible = filterEntries(entries, state);
  const counts = countByKind(available);
  for (const button of kindButtons) {
    const kind = button.dataset.kind as Kind | undefined;
    if (kind === undefined) continue;
    const count = button.querySelector<HTMLElement>(".kind-count");
    if (count !== null) count.textContent = String(counts[kind]);
  }

  resultCount.textContent = countText(visible.length, "entry", "entries");
  emptyState.hidden = visible.length !== 0;
  timeline.hidden = visible.length === 0;
  renderTimeline(visible);
}

function applyState(nextState: QueryState, writeUrl = true): void {
  state = nextState;
  updateControls();
  if (writeUrl) updateUrl();
  render();
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
// Rewrite the URL so values the page ignored (an unknown year, say) don't stay in the address bar.
updateUrl();
render();

searchInput.addEventListener("input", () => {
  applyState({ ...state, q: searchInput.value });
});

yearSelect.addEventListener("change", () => {
  applyState({ ...state, year: yearSelect.value });
});

for (const button of kindButtons) {
  button.addEventListener("click", () => {
    const kind = button.dataset.kind;
    if (kind === undefined || !ALL_KINDS.includes(kind as Kind)) return;
    const kinds = state.kinds.includes(kind as Kind)
      ? state.kinds.filter((selected) => selected !== kind)
      : [...state.kinds, kind as Kind];
    applyState({ ...state, kinds });
  });
}

clearButton.addEventListener("click", () => {
  applyState(defaultQueryState());
  searchInput.focus();
});
