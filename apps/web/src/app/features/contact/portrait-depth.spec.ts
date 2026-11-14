import { describe, expect, it } from 'vitest';

import { approach, depthTarget, translateOf } from './portrait-depth';

const BOX = { left: 100, top: 100, width: 200, height: 200 };

describe('depthTarget', () => {
  it('is at rest at the portrait centre', () => {
    expect(depthTarget(200, 200, BOX)).toEqual({ x: 0, y: 0 });
  });

  it('reaches ±1 at the portrait edges', () => {
    expect(depthTarget(300, 200, BOX)).toEqual({ x: 1, y: 0 });
    expect(depthTarget(100, 200, BOX).x).toBe(-1);
  });

  it('keeps full strength to 1.6 half-sizes, then fades to nothing at 3', () => {
    expect(depthTarget(200 + 1.6 * 100, 200, BOX).x).toBe(1);
    expect(depthTarget(200 + 2.3 * 100, 200, BOX).x).toBeCloseTo(0.5);
    expect(depthTarget(200 + 3 * 100, 200, BOX).x).toBe(0);
    expect(depthTarget(200 + 5 * 100, 200, BOX).x).toBe(0);
  });
});

describe('approach', () => {
  it('moves alike at 60 Hz and 120 Hz', () => {
    let at60 = 0;
    let at120 = 0;
    for (let i = 0; i < 6; i += 1) at60 = approach(at60, 1, 1000 / 60, 240);
    for (let i = 0; i < 12; i += 1) at120 = approach(at120, 1, 1000 / 120, 240);

    expect(at120).toBeCloseTo(at60, 10);
  });
});

describe('translateOf', () => {
  it('scales the offset by the layer travel', () => {
    expect(translateOf({ x: 1, y: -1 }, { x: -26, y: -16 })).toBe('translate(-26.00px, 16.00px)');
  });
});
