export const DOT_SIZE = 2;
export const DOT_GAP = 1;
export const DOT_PITCH = DOT_SIZE + DOT_GAP;
export const MAX_CANVAS_DIMENSION = 4_096;
export const MAX_CANVAS_AREA = 4_194_304;
export const LIVE_CANVAS_BUDGET = 25_165_824;

export interface FieldTile {
  index: number;
  top: number;
  cssHeight: number;
  backingWidth: number;
  backingHeight: number;
  devicePixelArea: number;
  dotStart: number;
  dotCapacity: number;
}

export interface FieldLayout {
  cssWidth: number;
  dots: number;
  dpr: number;
  columns: number;
  rows: number;
  totalHeight: number;
  tileHeight: number;
  backingWidth: number;
  tiles: FieldTile[];
}

export interface LiveTileSelection {
  visibleIndices: number[];
  selectedIndices: number[];
  visibleDevicePixelArea: number;
  selectedDevicePixelArea: number;
}

export interface TileDotRanges {
  start: number;
  end: number;
  giftStart: number;
  giftEnd: number;
  fortuneEnd: number;
}

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0)
    throw new RangeError(`${name} must be a positive finite number`);
}

function getTileHeight(cssWidth: number, dpr: number, backingWidth: number): number {
  let height =
    Math.floor(
      Math.min(MAX_CANVAS_DIMENSION / dpr, MAX_CANVAS_AREA / (backingWidth * dpr)) / DOT_PITCH,
    ) * DOT_PITCH;

  const fits = (cssHeight: number) => {
    const backingHeight = Math.round(cssHeight * dpr);
    return backingHeight <= MAX_CANVAS_DIMENSION && backingWidth * backingHeight <= MAX_CANVAS_AREA;
  };

  while (height > 0 && !fits(height)) {
    height -= DOT_PITCH;
  }
  while (fits(height + DOT_PITCH)) {
    height += DOT_PITCH;
  }

  if (height > 0) return height;
  throw new RangeError(`The canvas width ${cssWidth} is too large for a bounded tile`);
}

/** Calculate a CSS-pixel layout and its device-pixel-bounded canvas tiles. */
export function calculateFieldLayout(cssWidth: number, dots: number, dpr: number): FieldLayout {
  assertPositiveFinite(cssWidth, "Field width");
  assertPositiveFinite(dots, "Dot count");
  assertPositiveFinite(dpr, "Device pixel ratio");

  const columns = Math.max(1, Math.floor(cssWidth / DOT_PITCH));
  const rows = Math.ceil(dots / columns);
  const totalHeight = rows * DOT_PITCH;
  const backingWidth = Math.max(1, Math.round(cssWidth * dpr));
  if (backingWidth > MAX_CANVAS_DIMENSION)
    throw new RangeError("The field backing width exceeds the canvas limit");
  const tileHeight = getTileHeight(cssWidth, dpr, backingWidth);
  const tileCount = Math.ceil(totalHeight / tileHeight);
  const tileRows = tileHeight / DOT_PITCH;
  const tiles = Array.from({ length: tileCount }, (_, index) => {
    const top = index * tileHeight;
    const cssHeight = Math.min(tileHeight, totalHeight - top);
    const backingHeight = Math.round(cssHeight * dpr);
    return {
      index,
      top,
      cssHeight,
      backingWidth,
      backingHeight,
      devicePixelArea: backingWidth * backingHeight,
      dotStart: index * tileRows * columns,
      dotCapacity: Math.ceil(cssHeight / DOT_PITCH) * columns,
    };
  });

  return { cssWidth, dots, dpr, columns, rows, totalHeight, tileHeight, backingWidth, tiles };
}

function tileIntersectsViewport(
  tile: FieldTile,
  scrollTop: number,
  viewportHeight: number,
): boolean {
  const tileBottom = tile.top + tile.cssHeight;
  const viewportBottom = scrollTop + viewportHeight;
  return tileBottom > scrollTop && tile.top < viewportBottom;
}

/** Select visible tiles first, then nearest off-screen tiles within one viewport per side and the live budget. */
export function selectLiveTiles(
  layout: FieldLayout,
  scrollTop: number,
  viewportHeight: number,
  budget = LIVE_CANVAS_BUDGET,
): LiveTileSelection {
  if (!Number.isFinite(scrollTop)) throw new RangeError("Scroll position must be finite");
  assertPositiveFinite(viewportHeight, "Viewport height");
  assertPositiveFinite(budget, "Canvas budget");

  const boundedScrollTop = Math.min(scrollTop, layout.totalHeight);
  const visibleTiles = layout.tiles.filter((tile) =>
    tileIntersectsViewport(tile, boundedScrollTop, viewportHeight),
  );
  const visibleIndices = visibleTiles.map((tile) => tile.index);
  const selected = new Set(visibleIndices);
  let selectedDevicePixelArea = visibleTiles.reduce((area, tile) => area + tile.devicePixelArea, 0);
  const visibleDevicePixelArea = selectedDevicePixelArea;

  if (selectedDevicePixelArea <= budget && visibleTiles.length > 0) {
    const firstVisibleTile = visibleTiles[0];
    const lastVisibleTile = visibleTiles[visibleTiles.length - 1];
    if (firstVisibleTile === undefined || lastVisibleTile === undefined) {
      return {
        visibleIndices,
        selectedIndices: [...selected].sort((left, right) => left - right),
        visibleDevicePixelArea,
        selectedDevicePixelArea,
      };
    }
    const firstVisible = firstVisibleTile.index;
    const lastVisible = lastVisibleTile.index;
    const viewportBottom = boundedScrollTop + viewportHeight;
    const below = layout.tiles
      .slice(lastVisible + 1)
      .filter((tile) => tile.top < viewportBottom + viewportHeight);
    const above = layout.tiles
      .slice(0, firstVisible)
      .reverse()
      .filter((tile) => tile.top + tile.cssHeight > boundedScrollTop - viewportHeight);

    const candidates: FieldTile[] = [];
    const candidateCount = Math.max(below.length, above.length);
    for (let distance = 0; distance < candidateCount; distance += 1) {
      const belowTile = below[distance];
      const aboveTile = above[distance];
      if (belowTile !== undefined) candidates.push(belowTile);
      if (aboveTile !== undefined) candidates.push(aboveTile);
    }

    for (const tile of candidates) {
      if (selectedDevicePixelArea + tile.devicePixelArea <= budget) {
        selected.add(tile.index);
        selectedDevicePixelArea += tile.devicePixelArea;
      }
    }
  }

  return {
    visibleIndices,
    selectedIndices: [...selected].sort((left, right) => left - right),
    visibleDevicePixelArea,
    selectedDevicePixelArea,
  };
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

/** Return the fractional dot ranges drawn by one tile. */
export function getTileDotRanges(
  tileStart: number,
  tileCapacity: number,
  giftDots: number,
  fortuneDots: number,
): TileDotRanges {
  if (![tileStart, tileCapacity, giftDots, fortuneDots].every(Number.isFinite)) {
    throw new RangeError("Dot ranges must use finite numbers");
  }
  if (
    tileStart < 0 ||
    tileCapacity <= 0 ||
    giftDots < 0 ||
    fortuneDots < 0 ||
    giftDots > fortuneDots
  ) {
    throw new RangeError("Dot ranges must be ordered and non-negative");
  }

  const start = tileStart;
  const end = tileStart + tileCapacity;
  const giftStart = start;
  const giftEnd = Math.max(start, Math.min(end, giftDots));
  return {
    start,
    end: Math.min(end, fortuneDots),
    giftStart,
    giftEnd,
    fortuneEnd: Math.min(end, fortuneDots),
  };
}
