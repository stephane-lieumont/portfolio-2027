import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { CLOUD_POINTS, CloudModel, CloudState, type CloudSurface } from './cloud-state';

function surface(): CloudSurface & { rects: number } {
  const s = {
    rects: 0,
    fillStyle: '',
    globalAlpha: 1,
    setTransform: () => undefined,
    clearRect: () => undefined,
    fillRect: () => {
      s.rects += 1;
    },
  };
  return s;
}

const view = { width: 400, height: 500, dpr: 1, pointer: [0, 0] as const, field: null };
const glyph = Array.from({ length: 300 }, (_, i) => [i % 240, (i * 7) % 150] as const);

function seeded(): () => number {
  let x = 0.5;
  return () => (x = (x * 9301 + 0.49297) % 1);
}

describe('CloudModel', () => {
  it('starts already shaped as the world the site was loaded in', () => {
    const dev = new CloudModel(seeded());
    dev.init(glyph, 240, 150, 'dev');
    const cgi = new CloudModel(seeded());
    cgi.init(glyph, 240, 150, 'cgi');

    expect(dev.t).toBe(0);
    expect(cgi.t).toBe(1);
  });

  it('draws every point of the cloud each frame', () => {
    const model = new CloudModel(seeded());
    model.init(glyph, 240, 150, 'dev');
    const s = surface();
    model.frame(s, 16, view, false);

    expect(s.rects).toBeGreaterThanOrEqual(CLOUD_POINTS);
  });

  it('morphs toward the torus over 1.5s, from wherever it stands', () => {
    const model = new CloudModel(seeded());
    model.init(glyph, 240, 150, 'dev');
    model.aim('cgi');
    for (let i = 0; i < 15; i++) model.frame(surface(), 50, view, false);
    expect(model.t).toBeCloseTo(0.5, 5);

    model.aim('dev');
    for (let i = 0; i < 5; i++) model.frame(surface(), 50, view, false);
    expect(model.t).toBeCloseTo(1 / 3, 5);
  });

  it('lands on the target at once under reduced motion', () => {
    const model = new CloudModel(seeded());
    model.init(glyph, 240, 150, 'dev');
    model.aim('cgi');
    model.frame(surface(), 16, view, true);

    expect(model.t).toBe(1);
  });

  it('samples something even when the glyph raster came back empty', () => {
    const model = new CloudModel(seeded());
    model.init([], 240, 150, 'dev');
    expect(model.ready).toBe(true);
  });
});

describe('CloudState', () => {
  it('is one cloud for the whole application, so the next page continues the morph', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const leaving = TestBed.inject(CloudState).model;
    leaving.init(glyph, 240, 150, 'dev');
    leaving.aim('cgi');
    for (let i = 0; i < 10; i++) leaving.frame(surface(), 50, view, false);
    const midway = leaving.t;

    const arriving = TestBed.inject(CloudState).model;
    expect(arriving.ready).toBe(true);
    expect(arriving.t).toBe(midway);
    arriving.aim('cgi');
    arriving.frame(surface(), 50, view, false);
    expect(arriving.t).toBeGreaterThan(midway);
  });

  // Mimics the router: the leaving page goes, the arriving one comes, the
  // navigation ends, then the arriving page's cloud renders.
  let onWorldPage = false;
  async function world(state: CloudState, router: Router, url: string, page: 'dev' | 'cgi' | null) {
    if (onWorldPage) state.leave();
    if (page) state.arrive();
    onWorldPage = page !== null;
    await router.navigateByUrl(url);
    if (page) state.enter(page);
  }

  it('morphs on a direct switch between the worlds, and stands still after a page without the cloud', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([{ path: '**', children: [] }])],
    });
    const state = TestBed.inject(CloudState);
    const router = TestBed.inject(Router);
    state.arrive();
    onWorldPage = true;
    state.model.init(glyph, 240, 150, 'dev');

    await world(state, router, '/graphisme-3d', 'cgi');
    expect(state.continuing).toBe(true);
    expect(state.model.t).toBe(0);
    expect(state.model.target).toBe(1);

    await world(state, router, '/contact', null);
    await world(state, router, '/developpeur', 'dev');
    expect(state.continuing).toBe(false);
    expect(state.model.t).toBe(0);
    expect(state.model.target).toBe(0);

    await world(state, router, '/contact', null);
    await world(state, router, '/graphisme-3d', 'cgi');
    expect(state.model.t).toBe(1);
  });
});

describe('CloudModel framing', () => {
  it('keeps the torus inside its canvas at every rotation', () => {
    for (const [width, height] of [
      [575, 718],
      [358, 358],
      [412, 515],
    ]) {
      const model = new CloudModel(seeded());
      model.init(glyph, 240, 150, 'cgi');
      let counting = false;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      const s = {
        fillStyle: '',
        globalAlpha: 1,
        setTransform: () => undefined,
        clearRect: () => undefined,
        fillRect: (x: number, y: number, w: number, h: number) => {
          if (!counting) return;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x + w);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y + h);
        },
      };
      // Past the assembly, then a full turn and more.
      for (let i = 0; i < 400; i++) {
        counting = i > 80;
        model.frame(s, 50, { ...view, width, height }, false);
      }
      expect(minX).toBeGreaterThanOrEqual(0);
      expect(minY).toBeGreaterThanOrEqual(0);
      expect(maxX).toBeLessThanOrEqual(width);
      expect(maxY).toBeLessThanOrEqual(height);
    }
  });
});
