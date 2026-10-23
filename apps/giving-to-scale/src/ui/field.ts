import { type Currency, formatAmount, formatDotCount, formatMultiple } from "../core/amount.ts";
import type { CompareResult, Mode } from "../core/compare.ts";
import type { DotBand, DotColor, DotSegment, FieldLayout, Landmark } from "./field-layout.ts";
import {
  calculateFieldLayout,
  calculateGiftBlock,
  DOT_PITCH,
  DOT_SIZE,
  planDotBands,
  planLandmarks,
} from "./field-layout.ts";
import { startWalk } from "./walk.ts";

type DrawableResult = Extract<CompareResult, { kind: "result" }>;

function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/** How amounts are written: the browser locale and the page currency. */
export interface FormatContext {
  locale: string;
  currency: Currency;
}

/** What one unit of the reader's own figure is called. */
export function ownText(mode: Mode): string {
  return mode === "income" ? "a year of your income" : "everything you own";
}

function dotValueText(result: DrawableResult, format: FormatContext): string {
  const scaleText =
    result.dotScale > 1 ? `${formatMultiple(result.dotScale, format.locale)} times ` : "";
  return `One dot: ${scaleText}${ownText(result.mode)}, ${formatAmount(result.dotValue, format.currency, format.locale)}`;
}

/** "1,176 times everything you own", or "0.0059 of everything you own" below one. */
function multipleText(multiple: number, mode: Mode, locale: string): string {
  const joiner = multiple < 1 ? "of" : "times";
  return `${formatMultiple(multiple, locale)} ${joiner} ${ownText(mode)}`;
}

function giftDotText(giftDots: number, locale: string): string {
  const count = formatDotCount(giftDots, locale);
  return giftDots < 1 ? `${count} of one dot` : `${count} dots`;
}

function screenReaderSummary(result: DrawableResult, format: FormatContext): string {
  const { locale, currency } = format;
  const scaleText = result.dotScale > 1 ? `${formatMultiple(result.dotScale, locale)} times ` : "";
  return [
    `Each dot is ${scaleText}${ownText(result.mode)}, ${formatAmount(result.dotValue, currency, locale)}.`,
    `The gift, ${formatAmount(result.gift, currency, locale)}, is ${multipleText(result.giftMultiple, result.mode, locale)}, drawn as ${giftDotText(result.giftDots, locale)}.`,
    `The fortune, ${formatAmount(result.fortune, currency, locale)}, is ${multipleText(result.fortuneMultiple, result.mode, locale)}, drawn as ${formatDotCount(result.fortuneDots, locale)} dots.`,
  ].join(" ");
}

type SmallFortuneResult = Extract<CompareResult, { kind: "small-fortune" }>;

/** Both multiples are against the reader's own figure, so both sentences say so. */
export function smallFortuneText(result: SmallFortuneResult, locale: string): string {
  return `Their whole fortune is ${multipleText(result.fortuneMultiple, result.mode, locale)}. The gift is ${multipleText(result.giftMultiple, result.mode, locale)}.`;
}

function renderSmallFortune(root: HTMLElement, result: SmallFortuneResult, locale: string): void {
  root.replaceChildren();
  root.append(createElement("p", "small-fortune-note", smallFortuneText(result, locale)));
}

function dotsElement(color: DotColor, count: number, rows = 1): HTMLElement {
  const element = createElement("span", `dots dots-${color}`);
  element.style.width = `${count * DOT_PITCH}px`;
  element.style.height = `${rows * DOT_PITCH}px`;
  return element;
}

function partialDotElement(segment: Extract<DotSegment, { kind: "partial" }>): HTMLElement {
  const cell = createElement("span", "dot-cell");
  for (const [color, fill] of [
    ["gift", segment.gift],
    ["fortune", segment.fortune],
  ] as const) {
    if (fill <= 0) continue;
    const part = createElement("span", `dot-part dot-part-${color}`);
    part.style.width = `${DOT_SIZE * fill}px`;
    cell.append(part);
  }
  return cell;
}

/** Build a dot field from its bands: full rows as a repeating CSS pattern, ragged rows as segments. */
function renderBands(container: HTMLElement, bands: DotBand[], columns: number): void {
  container.replaceChildren(
    ...bands.map((band) => {
      if (band.kind === "rows") return dotsElement(band.color, columns, band.rows);
      const row = createElement("span", "dot-row");
      for (const segment of band.segments) {
        row.append(
          segment.kind === "dots"
            ? dotsElement(segment.color, segment.count)
            : partialDotElement(segment),
        );
      }
      return row;
    }),
  );
}

/** Rule a line across the field at each landmark, labelled with the amount above it. */
function renderLandmarks(
  container: HTMLElement,
  landmarks: Landmark[],
  format: FormatContext,
): void {
  container.replaceChildren(
    ...landmarks.map((landmark) => {
      const line = createElement("span", "field-landmark");
      line.style.top = `${landmark.top}px`;
      line.append(
        createElement(
          "span",
          "field-landmark-label",
          formatAmount(landmark.amount, format.currency, format.locale),
        ),
      );
      return line;
    }),
  );
}

/** Render the key and true-scale dot field. Returns a cleanup function for its observers and listeners. */
export function renderField(
  root: HTMLElement,
  result: CompareResult,
  format: FormatContext,
): () => void {
  const { locale, currency } = format;
  root.replaceChildren();
  if (result.kind === "small-fortune") {
    renderSmallFortune(root, result, locale);
    return () => root.replaceChildren();
  }
  if (result.kind !== "result") return () => root.replaceChildren();

  const key = createElement("div", "field-key");
  const keyDots = createElement("span", "field-key-dots");
  keyDots.setAttribute("aria-hidden", "true");
  const fieldSizeDot = createElement("span", "field-key-dot");
  const magnifiedDot = createElement("span", "field-key-dot field-key-dot-magnified");
  keyDots.append(fieldSizeDot, magnifiedDot);
  key.append(
    keyDots,
    createElement("p", "field-key-copy technical-copy", dotValueText(result, format)),
  );

  const gift = createElement("div", "gift-block");
  const giftCopy = createElement("div", "gift-block-copy");
  giftCopy.append(
    createElement("p", "gift-block-title", "Their gift"),
    createElement("p", "gift-block-amount", formatAmount(result.gift, currency, locale)),
    createElement(
      "p",
      "gift-block-detail technical-copy",
      `${multipleText(result.giftMultiple, result.mode, locale)} · ${giftDotText(result.giftDots, locale)}`,
    ),
  );
  const giftNote = createElement(
    "p",
    "gift-block-note technical-copy",
    "Too large to draw on its own: it is the orange start of the field below.",
  );
  giftNote.hidden = true;
  giftCopy.append(giftNote);
  const giftDots = createElement("div", "gift-block-dots");
  giftDots.setAttribute("aria-hidden", "true");
  gift.append(giftCopy, giftDots);

  const sticky = createElement("div", "field-sticky technical-copy");
  sticky.setAttribute("aria-hidden", "true");
  const stickyText = createElement("span", "field-sticky-text");
  sticky.append(stickyText);

  const field = createElement("div", "dot-field");
  field.setAttribute("role", "region");
  field.setAttribute("aria-label", "Fortune dot field");
  field.tabIndex = 0;
  const fieldDots = createElement("div", "dot-field-dots");
  fieldDots.setAttribute("aria-hidden", "true");
  const fieldLandmarks = createElement("div", "dot-field-landmarks");
  fieldLandmarks.setAttribute("aria-hidden", "true");
  field.append(fieldDots, fieldLandmarks);
  const fortuneTitle = createElement("div", "field-title-row");
  const walkButton = createElement(
    "button",
    "text-button walk-button technical-copy",
    "Walk the fortune",
  );
  walkButton.type = "button";
  fortuneTitle.append(
    createElement("p", "field-title technical-copy", "Their fortune"),
    walkButton,
  );
  const closing = createElement(
    "p",
    "field-closing-line",
    `That was ${formatAmount(result.fortune, currency, locale)}: ${multipleText(result.fortuneMultiple, result.mode, locale)} · ${formatDotCount(result.fortuneDots, locale)} dots.`,
  );
  const summary = createElement(
    "p",
    "visually-hidden field-screen-reader-summary",
    screenReaderSummary(result, format),
  );
  summary.id = "field-screen-reader-summary";
  field.setAttribute("aria-describedby", summary.id);

  root.append(key, gift, fortuneTitle, sticky, field, closing, summary);

  let layout: FieldLayout | undefined;
  let frame = 0;
  let disposed = false;
  let stopWalk = () => {};

  const pageTop = (element: Element) => element.getBoundingClientRect().top + window.scrollY;
  /** Where the field starts: its title in view. */
  const fieldStart = () => Math.max(0, pageTop(fortuneTitle) - 16);
  /** Where the field ends: the closing line in view at the bottom of the screen. */
  const fieldEnd = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const end = pageTop(closing) + closing.offsetHeight + 24 - window.innerHeight;
    return Math.min(maxScroll, Math.max(fieldStart(), end));
  };
  // Move focus to the closing line, so keyboard and screen-reader users arrive there too.
  const arriveAtEnd = () => {
    closing.tabIndex = -1;
    closing.focus({ preventScroll: true });
  };

  walkButton.addEventListener("click", () => {
    stopWalk();
    stopWalk = startWalk({ start: fieldStart(), end: fieldEnd(), onArrive: arriveAtEnd });
  });

  // With the field focused, End goes to the field's end and Home to its start. The page's own
  // End would go past the closing line to the footer, out of view on a short screen.
  field.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "End") {
      event.preventDefault();
      window.scrollTo({ top: fieldEnd(), behavior: "auto" });
      arriveAtEnd();
    } else if (event.key === "Home") {
      event.preventDefault();
      window.scrollTo({ top: fieldStart(), behavior: "auto" });
    }
  });

  const readPositionDots = (): number => {
    if (layout === undefined) return 0;
    const top = field.getBoundingClientRect().top + window.scrollY;
    const dotsScrolledPast =
      Math.floor(Math.max(0, window.scrollY - top) / DOT_PITCH) * layout.columns;
    return Math.min(result.fortuneDots, dotsScrolledPast);
  };

  const updateSticky = () => {
    if (layout === undefined) return;
    // Count the dots scrolled past the top of the viewport; the closing line gives the full total.
    const currentAmount = Math.min(result.fortune, readPositionDots() * result.dotValue);
    stickyText.textContent = `${formatAmount(currentAmount, currency, locale)} of ${formatAmount(result.fortune, currency, locale)}`;
  };

  const rebuildLayout = () => {
    if (disposed) return;
    const cssWidth = field.getBoundingClientRect().width;
    if (cssWidth <= 0) return;
    const nextLayout = calculateFieldLayout(cssWidth, result.fortuneDots);
    if (layout !== undefined && layout.columns === nextLayout.columns) {
      updateSticky();
      return;
    }

    // Keep the reader's place, in dots, when the number of columns changes.
    const dotsAtPosition = readPositionDots();
    const hadLayout = layout !== undefined;
    layout = nextLayout;
    field.style.height = `${layout.totalHeight}px`;
    renderBands(
      fieldDots,
      planDotBands(layout.columns, result.giftDots, result.fortuneDots),
      layout.columns,
    );
    renderLandmarks(
      fieldLandmarks,
      planLandmarks(layout.columns, result.dotValue, result.fortuneDots),
      format,
    );

    const block = calculateGiftBlock(result.giftDots, layout.columns);
    giftDots.hidden = block === null;
    giftNote.hidden = block !== null;
    if (block !== null) {
      giftDots.style.width = `${block.cssWidth}px`;
      renderBands(
        giftDots,
        planDotBands(block.columns, result.giftDots, result.giftDots),
        block.columns,
      );
    }

    if (hadLayout && dotsAtPosition > 0) {
      const fieldTop = field.getBoundingClientRect().top + window.scrollY;
      const row = Math.min(Math.floor(dotsAtPosition / layout.columns), layout.rows - 1);
      window.scrollTo({ top: fieldTop + row * DOT_PITCH, behavior: "auto" });
    }
    updateSticky();
  };

  const scheduleLayout = () => {
    if (frame !== 0) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      rebuildLayout();
    });
  };

  const resizeObserver = new ResizeObserver(scheduleLayout);
  resizeObserver.observe(field);
  window.addEventListener("scroll", scheduleLayout, { passive: true });
  window.addEventListener("resize", scheduleLayout, { passive: true });
  scheduleLayout();

  return () => {
    disposed = true;
    stopWalk();
    resizeObserver.disconnect();
    window.removeEventListener("scroll", scheduleLayout);
    window.removeEventListener("resize", scheduleLayout);
    if (frame !== 0) window.cancelAnimationFrame(frame);
    root.replaceChildren();
  };
}
