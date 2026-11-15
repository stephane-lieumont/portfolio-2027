import { describe, expect, it } from 'vitest';

import { PROJECTS } from '@core/data/static-content/static-content';
import { LOGO_MAX_WIDTH, logoWidth } from './logo-width';

describe('logoWidth', () => {
  it('gives every logo the same bounding-box area, so none outweighs another', () => {
    const areas = [
      { width: 383, height: 128 },
      { width: 783, height: 414 },
      { width: 72.731, height: 59.227 },
    ].map((size) => {
      const w = logoWidth(size);
      return w * ((w * size.height) / size.width);
    });

    for (const area of areas) expect(area).toBeCloseTo(areas[0], 6);
  });

  it('caps a very long wordmark rather than letting it touch the plate’s edges', () => {
    expect(logoWidth({ width: 1000, height: 10 })).toBe(LOGO_MAX_WIDTH);
  });

  it('sizes the shipped logos as the spec measured them', () => {
    const widths = Object.fromEntries(
      PROJECTS.flatMap((p) => (p.logo ? [[p.slug.fr, logoWidth(p.logo).toFixed(2)]] : [])),
    );

    expect(widths).toEqual({
      'immobilier-ch': '0.62',
      'web-atrio': '0.26',
      'cir-scancir': '0.32',
      linxea: '0.50',
      ledger: '0.40',
    });
  });
});
