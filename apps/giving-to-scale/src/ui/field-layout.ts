export const DOT_SIZE = 2;
export const DOT_GAP = 1;
export const DOT_PITCH = DOT_SIZE + DOT_GAP;

export interface FieldLayout {
  cssWidth: number;
  dots: number;
  columns: number;
  rows: number;
  totalHeight: number;
}

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0)
    throw new RangeError(`${name} must be a positive finite number`);
}

/** Lay out a field of dots in rows across a width in CSS pixels. */
export function calculateFieldLayout(cssWidth: number, dots: number): FieldLayout {
  assertPositiveFinite(cssWidth, "Field width");
  assertPositiveFinite(dots, "Dot count");

  const columns = Math.max(1, Math.floor(cssWidth / DOT_PITCH));
  const rows = Math.ceil(dots / columns);
  return { cssWidth, dots, columns, rows, totalHeight: rows * DOT_PITCH };
}

export const GIFT_BLOCK_MAX_CSS_HEIGHT = 300;

export interface GiftBlockLayout {
  columns: number;
  rows: number;
  cssWidth: number;
  cssHeight: number;
}

/**
 * Lay out the gift's dots as a near-square block, at the field's dot size.
 * Returns null when the block would be taller than GIFT_BLOCK_MAX_CSS_HEIGHT;
 * the gift is then shown only as the orange start of the field.
 */
export function calculateGiftBlock(giftDots: number, maxColumns: number): GiftBlockLayout | null {
  assertPositiveFinite(giftDots, "Gift dot count");
  assertPositiveFinite(maxColumns, "Maximum columns");

  const columns = Math.max(1, Math.min(Math.floor(maxColumns), Math.ceil(Math.sqrt(giftDots))));
  const rows = Math.ceil(giftDots / columns);
  const cssHeight = rows * DOT_PITCH;
  if (cssHeight > GIFT_BLOCK_MAX_CSS_HEIGHT) return null;
  return { columns, rows, cssWidth: columns * DOT_PITCH, cssHeight };
}

/**
 * The field is drawn as a few bands, not one element or canvas per dot: runs of full rows are
 * painted with a repeating CSS dot pattern, and a row where the gift or the fortune ends is
 * drawn as segments. So the page holds a handful of elements whatever the fortune's size.
 */
export type DotColor = "gift" | "fortune";

export type DotSegment =
  /** Whole dots of one colour, side by side. */
  | { kind: "dots"; color: DotColor; count: number }
  /** One dot cell filled from the left: first the gift's share of the dot, then the fortune's. */
  | { kind: "partial"; gift: number; fortune: number };

export type DotBand =
  /** Whole rows of one colour. */
  | { kind: "rows"; color: DotColor; rows: number }
  /** One row where the gift or the fortune ends. */
  | { kind: "row"; segments: DotSegment[] };

function rowSegments(
  rowStart: number,
  columns: number,
  giftDots: number,
  fortuneDots: number,
): DotSegment[] {
  const rowEnd = rowStart + columns;
  const segments: DotSegment[] = [];
  let position = rowStart;

  const giftFullEnd = Math.min(Math.floor(giftDots), rowEnd);
  if (giftFullEnd > position) {
    segments.push({ kind: "dots", color: "gift", count: giftFullEnd - position });
    position = giftFullEnd;
  }

  if (position < rowEnd && giftDots > position) {
    // The gift ends partway through this dot; the fortune may fill the rest of it.
    const gift = giftDots - position;
    const fortune = Math.min(1, fortuneDots - position) - gift;
    segments.push({ kind: "partial", gift, fortune });
    position += 1;
  }

  const fortuneFullEnd = Math.min(Math.floor(fortuneDots), rowEnd);
  if (fortuneFullEnd > position) {
    segments.push({ kind: "dots", color: "fortune", count: fortuneFullEnd - position });
    position = fortuneFullEnd;
  }

  if (position < rowEnd && fortuneDots > position) {
    segments.push({ kind: "partial", gift: 0, fortune: fortuneDots - position });
  }
  return segments;
}

/**
 * Plan the bands for a field whose first `giftDots` dots are the gift, out of `fortuneDots`.
 * Partial dots are filled from the left in proportion, at the gift's end and the fortune's end.
 */
export function planDotBands(columns: number, giftDots: number, fortuneDots: number): DotBand[] {
  assertPositiveFinite(columns, "Columns");
  assertPositiveFinite(fortuneDots, "Fortune dot count");
  if (!Number.isFinite(giftDots) || giftDots < 0 || giftDots > fortuneDots)
    throw new RangeError("The gift must be between zero and the fortune");

  const bands: DotBand[] = [];
  let row = 0;

  const fullGiftRows = Math.floor(giftDots / columns);
  if (fullGiftRows > 0) {
    bands.push({ kind: "rows", color: "gift", rows: fullGiftRows });
    row = fullGiftRows;
  }

  if (giftDots > row * columns) {
    bands.push({
      kind: "row",
      segments: rowSegments(row * columns, columns, giftDots, fortuneDots),
    });
    row += 1;
  }

  const fullFortuneRows = Math.floor(fortuneDots / columns);
  if (fullFortuneRows > row) {
    bands.push({ kind: "rows", color: "fortune", rows: fullFortuneRows - row });
    row = fullFortuneRows;
  }

  if (fortuneDots > row * columns) {
    bands.push({
      kind: "row",
      segments: rowSegments(row * columns, columns, giftDots, fortuneDots),
    });
  }
  return bands;
}

/**
 * Landmarks are ruled lines across the field at round amounts ("$10B", "$20B", ...). A field of
 * identical dots looks still while it scrolls, so they show that it is moving, and how far.
 * The step is the smallest 1, 2, or 5 times a power of ten that keeps them at least
 * LANDMARK_MIN_SPACING apart, so they fall 300-750 px apart: one to three on screen at a time.
 * A very narrow field (heavy zoom) is very tall, so there they spread out to stay within
 * MAX_LANDMARKS.
 */
export const LANDMARK_MIN_SPACING = 300;
export const MAX_LANDMARKS = 200;
/** No landmark this close to the field's top or bottom edge, where its label would be cut off. */
export const LANDMARK_EDGE_CLEARANCE = 24;

export interface Landmark {
  /** The amount of the fortune above the line. */
  amount: number;
  /** The line's position from the top of the field, in CSS pixels: the first row boundary with at least `amount` above it. */
  top: number;
}

/** The smallest 1, 2, or 5 times a power of ten that is at least `minimum`. */
export function roundStepAtLeast(minimum: number): number {
  assertPositiveFinite(minimum, "Minimum step");
  const power = 10 ** Math.floor(Math.log10(minimum));
  // Far below any amount the app uses, the power of ten can round to zero.
  if (power <= 0) throw new RangeError("Minimum step is too small");
  for (const multiple of [1, 2, 5]) {
    if (multiple * power >= minimum) return multiple * power;
  }
  return 10 * power;
}

/** Place a landmark at each multiple of a round step, at the first row boundary at or after that amount. */
export function planLandmarks(columns: number, dotValue: number, fortuneDots: number): Landmark[] {
  assertPositiveFinite(columns, "Columns");
  assertPositiveFinite(dotValue, "Dot value");
  assertPositiveFinite(fortuneDots, "Fortune dot count");

  // One row of dots is `columns * dotValue` of the fortune and DOT_PITCH pixels tall.
  const totalHeight = Math.ceil(fortuneDots / columns) * DOT_PITCH;
  const minSpacing = Math.max(LANDMARK_MIN_SPACING, totalHeight / MAX_LANDMARKS);
  const step = roundStepAtLeast((minSpacing / DOT_PITCH) * columns * dotValue);
  const fortune = fortuneDots * dotValue;
  const lastTop = totalHeight - LANDMARK_EDGE_CLEARANCE;
  const landmarks: Landmark[] = [];
  for (let index = 1; index * step < fortune; index += 1) {
    const amount = index * step;
    // The line goes below the row where the amount is reached, never above it. The small
    // allowance keeps an exact boundary, like $10,000 after 100 rows of $100, from moving a row;
    // the check after it moves the line down if rounding left it short of the amount.
    let row = Math.ceil(amount / dotValue / columns - 1e-9);
    if (row * columns * dotValue < amount) row += 1;
    const top = row * DOT_PITCH;
    if (top > lastTop) break;
    if (top >= LANDMARK_EDGE_CLEARANCE) landmarks.push({ amount, top });
  }
  return landmarks;
}
