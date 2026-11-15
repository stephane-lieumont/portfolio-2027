export interface TilePlace {
  /** `grid-area` on the twelve-column grid, from 900px. */
  readonly area: string;
  /** Spans both columns below 900px, as a 16:9 band; the others are 4:3. */
  readonly wide: boolean;
  /** The tile's width over its height, from 900px. */
  readonly ratio: number;
}

/**
 * The wall is a grid of twelve columns whose rows are three quarters of a
 * column tall (4:3 cells), so every tile's ratio is a whole-cell span:
 * - the hero, 8 × 6 cells: 16:9, with two 16:9 tiles of 4 × 3 stacked beside it;
 * - a row of three 4:3 tiles, 4 × 4 cells each;
 * - a row of two 2:1 tiles, 6 × 4 cells each;
 * - a lone tile, 12 × 9 cells: 16:9.
 * Blocks of eight repeat, the hero alternating sides (ADR-0015, amended).
 * Measured on the sixteen renders: at most 27.5% cropped from 900px
 * (Gorgotte, 1280×696 in a 4:3), 25% for a 16:9 render in a 4:3. On a phone
 * the halves are 4:3 (same figures) and a full-width band takes its render's
 * ratio between 4:3 and 16:9 (ArtMosaicComponent), so the near-square Immeuble loses
 * 11% instead of 33%.
 */
const BLOCK = 8;
const ROW_SHAPE: Readonly<Record<number, { cols: number; rows: number }>> = {
  1: { cols: 12, rows: 9 },
  2: { cols: 6, rows: 4 },
  3: { cols: 4, rows: 4 },
};

/** How the pieces after a block's hero group fall into rows. */
function rowsOf(count: number): number[] {
  const rows: number[] = [];
  let left = count;
  while (left > 0) {
    const take = left === 4 ? 2 : Math.min(3, left);
    rows.push(take);
    left -= take;
  }
  return rows;
}

const ratio = (cols: number, rows: number): number => cols / (rows * 0.75);

/**
 * Places `count` pieces in the mosaic, a piece's shape following from its
 * position in publishing order (ADR-0015). Returns the places and the number
 * of grid rows the whole wall takes.
 */
export function mosaicLayout(count: number): { tiles: TilePlace[]; rows: number } {
  const tiles: TilePlace[] = [];
  let top = 1;
  for (let start = 0, block = 0; start < count; start += BLOCK, block++) {
    const size = Math.min(BLOCK, count - start);
    let rest = size;
    if (size >= 3) {
      const heroLeft = block % 2 === 0;
      const hero = heroLeft ? 1 : 5;
      const side = heroLeft ? 9 : 1;
      tiles.push({
        area: `${top} / ${hero} / ${top + 6} / ${hero + 8}`,
        wide: true,
        ratio: ratio(8, 6),
      });
      tiles.push({
        area: `${top} / ${side} / ${top + 3} / ${side + 4}`,
        wide: false,
        ratio: ratio(4, 3),
      });
      tiles.push({
        area: `${top + 3} / ${side} / ${top + 6} / ${side + 4}`,
        wide: false,
        ratio: ratio(4, 3),
      });
      top += 6;
      rest -= 3;
    }
    for (const n of rowsOf(rest)) {
      const { cols, rows } = ROW_SHAPE[n];
      for (let k = 0; k < n; k++) {
        const left = 1 + k * cols;
        tiles.push({
          area: `${top} / ${left} / ${top + rows} / ${left + cols}`,
          // On a phone, pairs sit side by side; the third of a row of three
          // and a lone tile take the full width, so no square is left alone.
          wide: n === 1 || (n === 3 && k === 2),
          ratio: ratio(cols, rows),
        });
      }
      top += rows;
    }
  }
  return { tiles, rows: top - 1 };
}
