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
