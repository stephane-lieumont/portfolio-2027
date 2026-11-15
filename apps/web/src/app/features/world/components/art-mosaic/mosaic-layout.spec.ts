import { describe, expect, it } from 'vitest';

import { ARTWORKS } from '@core/data/static-content';
import { mosaicLayout } from './mosaic-layout';

/** Every cell of the 12-column grid, and how many tiles cover it. */
function coverage(count: number): number[] {
  const { tiles, rows } = mosaicLayout(count);
  const cells = new Array<number>(rows * 12).fill(0);
  for (const { area } of tiles) {
    const [r1, c1, r2, c2] = area.split(' / ').map(Number);
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++) cells[(r - 1) * 12 + (c - 1)] += 1;
  }
  return cells;
}

/** The share of a picture `cover` cuts away in a tile of the given ratio. */
const cropped = (image: number, tile: number) => 1 - Math.min(image, tile) / Math.max(image, tile);

describe('mosaicLayout', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 16, 17])(
    'packs %i pieces with no hole and no overlap',
    (count) => {
      expect(coverage(count).every((n) => n === 1)).toBe(true);
    },
  );

  it('keeps every tile between 4:3 and 2:1, close to the renders’ 16:9', () => {
    for (const tile of mosaicLayout(16).tiles) {
      expect(tile.ratio).toBeGreaterThanOrEqual(4 / 3 - 1e-9);
      expect(tile.ratio).toBeLessThanOrEqual(2 + 1e-9);
    }
  });

  it('never crops away more than a third of a real render', () => {
    const { tiles } = mosaicLayout(ARTWORKS.length);
    ARTWORKS.forEach((artwork, i) => {
      const share = cropped(artwork.image.width / artwork.image.height, tiles[i].ratio);
      expect(share, artwork.slug.fr).toBeLessThanOrEqual(1 / 3);
    });
  });

  it('opens each block of eight on a 16:9 hero, alternating sides', () => {
    const { tiles, rows } = mosaicLayout(16);
    expect(rows).toBe(28);
    expect(tiles[0].area).toBe('1 / 1 / 7 / 9');
    expect(tiles[8].area).toBe('15 / 5 / 21 / 13');
  });

  it('never leaves a tile alone on its row on a phone', () => {
    for (const count of [1, 2, 3, 4, 5, 6, 7, 8, 16]) {
      let half = 0;
      for (const tile of mosaicLayout(count).tiles) {
        if (tile.wide) expect(half % 2, `count ${count}`).toBe(0);
        else half += 1;
      }
      expect(half % 2, `count ${count}`).toBe(0);
    }
  });
});
