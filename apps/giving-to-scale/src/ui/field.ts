import { formatAmount, formatDotCount, formatMultiple } from "../core/amount.ts";
import type { CompareResult } from "../core/compare.ts";
import type { FieldLayout, FieldTile } from "./field-layout.ts";
import {
  calculateFieldLayout,
  calculateGiftBlock,
  DOT_PITCH,
  DOT_SIZE,
  getTileDotRanges,
  selectLiveTiles,
} from "./field-layout.ts";

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

function dotValueText(result: DrawableResult, locale: string): string {
  const scaleText = result.dotScale > 1 ? `${formatMultiple(result.dotScale, locale)} times ` : "";
  return `One dot: ${scaleText}everything you own, ${formatAmount(result.dotValue, "USD", locale)}`;
}

/** "1,176 times everything you own", or "0.0059 of everything you own" below one. */
function multipleText(multiple: number, locale: string): string {
  const joiner = multiple < 1 ? "of" : "times";
  return `${formatMultiple(multiple, locale)} ${joiner} everything you own`;
}

function giftDotText(giftDots: number, locale: string): string {
  const count = formatDotCount(giftDots, locale);
  return giftDots < 1 ? `${count} of one dot` : `${count} dots`;
}

function screenReaderSummary(result: DrawableResult, locale: string): string {
  const scaleText = result.dotScale > 1 ? `${formatMultiple(result.dotScale, locale)} times ` : "";
  return [
    `Each dot is ${scaleText}everything you own, ${formatAmount(result.dotValue, "USD", locale)}.`,
    `The gift, ${formatAmount(result.gift, "USD", locale)}, is ${multipleText(result.giftMultiple, locale)}, drawn as ${giftDotText(result.giftDots, locale)}.`,
    `The fortune, ${formatAmount(result.fortune, "USD", locale)}, is ${multipleText(result.fortuneMultiple, locale)}, drawn as ${formatDotCount(result.fortuneDots, locale)} dots.`,
  ].join(" ");
}

type SmallFortuneResult = Extract<CompareResult, { kind: "small-fortune" }>;

/** Both multiples are against the reader's own figure, so both sentences say so. */
export function smallFortuneText(result: SmallFortuneResult, locale: string): string {
  return `Their whole fortune is ${multipleText(result.fortuneMultiple, locale)}. The gift is ${multipleText(result.giftMultiple, locale)}.`;
}

function renderSmallFortune(root: HTMLElement, result: SmallFortuneResult, locale: string): void {
  root.replaceChildren();
  root.append(createElement("p", "small-fortune-note", smallFortuneText(result, locale)));
}

function drawTile(
  canvas: HTMLCanvasElement,
  tile: FieldTile,
  layout: FieldLayout,
  result: DrawableResult,
  mutedColor: string,
  accentColor: string,
): void {
  canvas.width = tile.backingWidth;
  canvas.height = tile.backingHeight;
  canvas.style.height = `${tile.cssHeight}px`;
  const context = canvas.getContext("2d");
  if (context === null) return;

  context.setTransform(
    tile.backingWidth / layout.cssWidth,
    0,
    0,
    tile.backingHeight / tile.cssHeight,
    0,
    0,
  );
  const ranges = getTileDotRanges(
    tile.dotStart,
    tile.dotCapacity,
    result.giftDots,
    result.fortuneDots,
  );
  const firstDot = Math.floor(ranges.start);
  const lastDot = Math.ceil(ranges.fortuneEnd);

  for (let dotIndex = firstDot; dotIndex < lastDot; dotIndex += 1) {
    const fortuneFill = Math.max(0, Math.min(1, ranges.fortuneEnd - dotIndex));
    if (fortuneFill === 0) continue;

    const x = (dotIndex % layout.columns) * DOT_PITCH;
    const y = Math.floor(dotIndex / layout.columns) * DOT_PITCH - tile.top;
    const dotWidth = 2 * fortuneFill;
    const giftFill = Math.max(0, Math.min(fortuneFill, ranges.giftEnd - dotIndex));
    if (giftFill > 0) {
      context.fillStyle = accentColor;
      context.fillRect(x, y, 2 * giftFill, 2);
    }
    if (giftFill < fortuneFill) {
      context.fillStyle = mutedColor;
      context.fillRect(x + 2 * giftFill, y, dotWidth - 2 * giftFill, 2);
    }
  }
}

/** Draw the gift's dots as a block; hide the canvas when the block is too large to show. */
function drawGiftBlock(
  canvas: HTMLCanvasElement,
  note: HTMLElement,
  giftDots: number,
  maxColumns: number,
  dpr: number,
  accentColor: string,
): void {
  const block = calculateGiftBlock(giftDots, maxColumns);
  canvas.hidden = block === null;
  note.hidden = block !== null;
  if (block === null) return;

  canvas.width = Math.round(block.cssWidth * dpr);
  canvas.height = Math.round(block.cssHeight * dpr);
  canvas.style.width = `${block.cssWidth}px`;
  canvas.style.height = `${block.cssHeight}px`;
  const context = canvas.getContext("2d");
  if (context === null) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.fillStyle = accentColor;
  for (let dotIndex = 0; dotIndex < Math.ceil(giftDots); dotIndex += 1) {
    const fill = Math.min(1, giftDots - dotIndex);
    const x = (dotIndex % block.columns) * DOT_PITCH;
    const y = Math.floor(dotIndex / block.columns) * DOT_PITCH;
    context.fillRect(x, y, DOT_SIZE * fill, DOT_SIZE);
  }
}

function freeTile(canvas: HTMLCanvasElement): void {
  canvas.width = 0;
  canvas.height = 0;
  canvas.style.height = "0px";
}

/** Render the key and true-scale dot field. Returns a cleanup function for its observers and listeners. */
export function renderField(root: HTMLElement, result: CompareResult, locale: string): () => void {
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
    createElement("p", "field-key-copy technical-copy", dotValueText(result, locale)),
  );

  const gift = createElement("div", "gift-block");
  const giftCopy = createElement("div", "gift-block-copy");
  giftCopy.append(
    createElement("p", "gift-block-title", "Their gift"),
    createElement("p", "gift-block-amount", formatAmount(result.gift, "USD", locale)),
    createElement(
      "p",
      "gift-block-detail technical-copy",
      `${multipleText(result.giftMultiple, locale)} · ${giftDotText(result.giftDots, locale)}`,
    ),
  );
  const giftNote = createElement(
    "p",
    "gift-block-note technical-copy",
    "Too large to draw on its own: it is the orange start of the field below.",
  );
  giftNote.hidden = true;
  giftCopy.append(giftNote);
  const giftCanvas = createElement("canvas", "gift-block-dots");
  giftCanvas.setAttribute("aria-hidden", "true");
  gift.append(giftCopy, giftCanvas);

  const sticky = createElement("div", "field-sticky technical-copy");
  sticky.setAttribute("aria-hidden", "true");
  const stickyText = createElement("span", "field-sticky-text");
  sticky.append(stickyText);

  const canvasHost = createElement("div", "dot-field");
  canvasHost.setAttribute("role", "region");
  canvasHost.setAttribute("aria-label", "Fortune dot field");
  canvasHost.tabIndex = 0;
  const fortuneTitle = createElement("p", "field-title technical-copy", "Their fortune");
  const closing = createElement(
    "p",
    "field-closing-line",
    `That was ${formatAmount(result.fortune, "USD", locale)}: ${multipleText(result.fortuneMultiple, locale)} · ${formatDotCount(result.fortuneDots, locale)} dots.`,
  );
  const summary = createElement(
    "p",
    "visually-hidden field-screen-reader-summary",
    screenReaderSummary(result, locale),
  );
  summary.id = "field-screen-reader-summary";
  canvasHost.setAttribute("aria-describedby", summary.id);

  root.append(key, gift, fortuneTitle, sticky, canvasHost, closing, summary);
  const rootStyle = getComputedStyle(document.documentElement);
  const accentColor = rootStyle.getPropertyValue("--gift-dot").trim() || "#e84700";
  const mutedColor = rootStyle.getPropertyValue("--fortune-dot").trim() || "#1a1a1a";

  let layout: FieldLayout | undefined;
  let canvases: HTMLCanvasElement[] = [];
  let liveIndices = new Set<number>();
  let frame = 0;
  let disposed = false;

  const clearCanvases = () => {
    for (const canvas of canvases) freeTile(canvas);
    canvases = [];
    liveIndices = new Set();
    canvasHost.replaceChildren();
  };

  const readPositionDots = (): number => {
    if (layout === undefined) return 0;
    const top = canvasHost.getBoundingClientRect().top + window.scrollY;
    const dotsScrolledPast =
      Math.floor(Math.max(0, window.scrollY - top) / DOT_PITCH) * layout.columns;
    return Math.min(result.fortuneDots, dotsScrolledPast);
  };

  const updateSticky = () => {
    if (layout === undefined) return;
    // Count the dots scrolled past the top of the viewport; the closing line gives the full total.
    const currentAmount = Math.min(result.fortune, readPositionDots() * result.dotValue);
    stickyText.textContent = `${formatAmount(currentAmount, "USD", locale)} of ${formatAmount(result.fortune, "USD", locale)}`;
  };

  const updateLiveTiles = () => {
    if (layout === undefined || disposed) return;
    const fieldTop = canvasHost.getBoundingClientRect().top + window.scrollY;
    const localScrollTop = window.scrollY - fieldTop;
    const selection = selectLiveTiles(layout, localScrollTop, Math.max(1, window.innerHeight));
    const nextLiveIndices = new Set(selection.selectedIndices);

    for (const tile of layout.tiles) {
      const canvas = canvases[tile.index];
      if (canvas === undefined) continue;
      if (nextLiveIndices.has(tile.index)) {
        if (!liveIndices.has(tile.index))
          drawTile(canvas, tile, layout, result, mutedColor, accentColor);
      } else if (liveIndices.has(tile.index) || canvas.width !== 0 || canvas.height !== 0) {
        freeTile(canvas);
      }
    }
    liveIndices = nextLiveIndices;
    updateSticky();
  };

  const rebuildLayout = () => {
    if (disposed) return;
    const cssWidth = canvasHost.getBoundingClientRect().width;
    if (cssWidth <= 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const nextLayout = calculateFieldLayout(cssWidth, result.fortuneDots, dpr);
    const unchanged =
      layout !== undefined &&
      layout.cssWidth === nextLayout.cssWidth &&
      layout.dpr === nextLayout.dpr &&
      layout.totalHeight === nextLayout.totalHeight;

    if (unchanged) {
      updateLiveTiles();
      return;
    }

    const dotsAtPosition = readPositionDots();
    const oldTotalHeight = layout?.totalHeight;
    layout = nextLayout;
    canvasHost.style.height = `${layout.totalHeight}px`;
    clearCanvases();
    canvases = layout.tiles.map((tile) => {
      const canvas = document.createElement("canvas");
      canvas.className = "dot-field-tile";
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.top = `${tile.top}px`;
      canvas.style.height = "0px";
      return canvas;
    });
    canvasHost.append(...canvases);
    drawGiftBlock(giftCanvas, giftNote, result.giftDots, layout.columns, dpr, accentColor);

    if (oldTotalHeight !== undefined && dotsAtPosition > 0) {
      const fieldTop = canvasHost.getBoundingClientRect().top + window.scrollY;
      const row = Math.floor(dotsAtPosition / layout.columns);
      const maxRow = layout.rows - 1;
      window.scrollTo({ top: fieldTop + Math.min(row, maxRow) * DOT_PITCH, behavior: "auto" });
    }
    updateLiveTiles();
  };

  const scheduleLayout = () => {
    if (frame !== 0) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      rebuildLayout();
    });
  };

  const resizeObserver = new ResizeObserver(scheduleLayout);
  resizeObserver.observe(canvasHost);
  window.addEventListener("scroll", scheduleLayout, { passive: true });
  window.addEventListener("resize", scheduleLayout, { passive: true });
  scheduleLayout();

  return () => {
    disposed = true;
    resizeObserver.disconnect();
    window.removeEventListener("scroll", scheduleLayout);
    window.removeEventListener("resize", scheduleLayout);
    if (frame !== 0) window.cancelAnimationFrame(frame);
    clearCanvases();
    root.replaceChildren();
  };
}
