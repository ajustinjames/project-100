import { describe, expect, it } from "vitest";
import {
  calculateFieldLayout,
  calculateGiftBlock,
  DOT_PITCH,
  GIFT_BLOCK_MAX_CSS_HEIGHT,
  getTileDotRanges,
  LIVE_CANVAS_BUDGET,
  MAX_CANVAS_AREA,
  MAX_CANVAS_DIMENSION,
  selectLiveTiles,
} from "./field-layout.ts";

describe("calculateFieldLayout", () => {
  it.each([
    [360, 1, 4095],
    [360, 2, 2046],
    [360, 3, 1293],
    [1200, 1, 3495],
    [1200, 2, 873],
    [1200, 3, 387],
  ])("bounds 2,000,000 dots at %s CSS px and dpr %s", (width, dpr, expectedTileHeight) => {
    const layout = calculateFieldLayout(width, 2_000_000, dpr);

    expect(layout.columns).toBe(Math.floor(width / DOT_PITCH));
    expect(layout.totalHeight).toBe(Math.ceil(2_000_000 / layout.columns) * DOT_PITCH);
    expect(layout.tileHeight).toBe(expectedTileHeight);
    expect(layout.tiles.length).toBe(Math.ceil(layout.totalHeight / expectedTileHeight));
    for (const tile of layout.tiles) {
      expect(tile.backingWidth).toBeLessThanOrEqual(MAX_CANVAS_DIMENSION);
      expect(tile.backingHeight).toBeLessThanOrEqual(MAX_CANVAS_DIMENSION);
      expect(tile.devicePixelArea).toBeLessThanOrEqual(MAX_CANVAS_AREA);
    }
  });

  it("uses one column for widths below one pitch", () => {
    const layout = calculateFieldLayout(2, 4, 1);
    expect(layout.columns).toBe(1);
    expect(layout.rows).toBe(4);
    expect(layout.totalHeight).toBe(12);
  });

  it("rejects invalid widths, dot counts, and device pixel ratios", () => {
    expect(() => calculateFieldLayout(0, 1, 1)).toThrow(RangeError);
    expect(() => calculateFieldLayout(360, 0, 1)).toThrow(RangeError);
    expect(() => calculateFieldLayout(360, 1, 0)).toThrow(RangeError);
    expect(() => calculateFieldLayout(2000, 1, 3)).toThrow(RangeError);
  });
});

describe("selectLiveTiles", () => {
  it("draws the visible tiles and adds nearby off-screen tiles within the live budget", () => {
    const layout = calculateFieldLayout(360, 2_000_000, 3);
    const selection = selectLiveTiles(layout, 5_000, 844);

    expect(selection.visibleIndices.length).toBeGreaterThan(0);
    expect(
      selection.visibleIndices.every((index) => selection.selectedIndices.includes(index)),
    ).toBe(true);
    expect(selection.selectedIndices.length).toBeGreaterThan(selection.visibleIndices.length);
    expect(selection.selectedDevicePixelArea).toBeLessThanOrEqual(LIVE_CANVAS_BUDGET);
    expect(selection.selectedIndices.length).toBeLessThan(layout.tiles.length);
  });

  it("draws every visible tile when visible tiles alone exceed the budget", () => {
    const layout = calculateFieldLayout(1200, 2_000_000, 3);
    const selection = selectLiveTiles(layout, 0, 3_000);

    expect(selection.visibleIndices).toHaveLength(8);
    expect(selection.visibleDevicePixelArea).toBeGreaterThan(LIVE_CANVAS_BUDGET);
    expect(selection.selectedIndices).toEqual(selection.visibleIndices);
    expect(selection.selectedDevicePixelArea).toBe(selection.visibleDevicePixelArea);
  });

  it("leaves all off-screen tiles unselected when no visible tile intersects the viewport", () => {
    const layout = calculateFieldLayout(360, 100_000, 2);
    expect(selectLiveTiles(layout, layout.totalHeight + 100, 800).selectedIndices).toEqual([]);
    expect(selectLiveTiles(layout, -1_500, 800).selectedIndices).toEqual([]);
  });

  it("treats a field partly below the viewport as visible", () => {
    const layout = calculateFieldLayout(360, 100_000, 2);
    const selection = selectLiveTiles(layout, -100, 800);
    expect(selection.visibleIndices[0]).toBe(0);
  });
});

describe("getTileDotRanges", () => {
  it("places a gift wholly inside one tile", () => {
    expect(getTileDotRanges(0, 10, 3.5, 20)).toEqual({
      start: 0,
      end: 10,
      giftStart: 0,
      giftEnd: 3.5,
      fortuneEnd: 10,
    });
  });

  it("finds the gift overlap across two tiles", () => {
    expect(getTileDotRanges(0, 4, 6.5, 20)).toMatchObject({ giftStart: 0, giftEnd: 4 });
    expect(getTileDotRanges(4, 4, 6.5, 20)).toMatchObject({ giftStart: 4, giftEnd: 6.5 });
  });

  it("finds the gift overlap in a third tile", () => {
    expect(getTileDotRanges(0, 4, 9.25, 20)).toMatchObject({ giftStart: 0, giftEnd: 4 });
    expect(getTileDotRanges(4, 4, 9.25, 20)).toMatchObject({ giftStart: 4, giftEnd: 8 });
    expect(getTileDotRanges(8, 4, 9.25, 20)).toMatchObject({ giftStart: 8, giftEnd: 9.25 });
  });

  it("leaves the next tile unaccented when a gift ends on a tile boundary", () => {
    expect(getTileDotRanges(0, 4, 4, 20).giftEnd).toBe(4);
    expect(getTileDotRanges(4, 4, 4, 20).giftStart).toBe(4);
    expect(getTileDotRanges(4, 4, 4, 20).giftEnd).toBe(4);
  });

  it("supports a gift equal to the fortune, including a partial final dot", () => {
    const lastTile = getTileDotRanges(4, 4, 4.5, 4.5);
    expect(lastTile).toEqual({ start: 4, end: 4.5, giftStart: 4, giftEnd: 4.5, fortuneEnd: 4.5 });
  });

  it("keeps the fortune's partial final dot in the last tile", () => {
    expect(getTileDotRanges(4, 4, 2, 4.25)).toEqual({
      start: 4,
      end: 4.25,
      giftStart: 4,
      giftEnd: 4,
      fortuneEnd: 4.25,
    });
  });

  it("rejects a gift larger than the fortune", () => {
    expect(() => getTileDotRanges(0, 4, 5, 4)).toThrow(RangeError);
  });
});

describe("calculateGiftBlock", () => {
  it("lays out the worked example's 117.6 gift dots as an 11 by 11 block", () => {
    expect(calculateGiftBlock(117.647, 400)).toEqual({
      columns: 11,
      rows: 11,
      cssWidth: 33,
      cssHeight: 33,
    });
  });

  it("draws a gift under one dot as a single partial dot", () => {
    expect(calculateGiftBlock(0.03, 400)).toEqual({
      columns: 1,
      rows: 1,
      cssWidth: 3,
      cssHeight: 3,
    });
  });

  it("never uses more columns than the field has", () => {
    const block = calculateGiftBlock(3_000, 50);
    expect(block?.columns).toBe(50);
    expect(block?.rows).toBe(60);
  });

  it("returns null when the block would be taller than the limit", () => {
    const tallestRows = GIFT_BLOCK_MAX_CSS_HEIGHT / DOT_PITCH;
    expect(calculateGiftBlock(100 * tallestRows, 100)).not.toBeNull();
    expect(calculateGiftBlock(100 * tallestRows + 1, 100)).toBeNull();
  });
});
