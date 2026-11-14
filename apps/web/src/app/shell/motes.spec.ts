import { WritableSignal, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FrameLoop, type FrameCallback } from '../core/motion/frame-loop';
import { ReducedMotion } from '../core/motion/reduced-motion';
import { ActiveWorld } from '../core/world/world';
import { MoteField, Motes, type MoteSurface } from './motes';

function surface() {
  const rects: { x: number; y: number; size: number; alpha: number }[] = [];
  let alpha = 1;
  const fake: MoteSurface = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillStyle: '',
    get globalAlpha() {
      return alpha;
    },
    set globalAlpha(value: number) {
      alpha = value;
    },
    fillRect: (x: number, y: number, size: number) => {
      rects.push({ x, y, size, alpha });
    },
  };
  return { fake, rects };
}

// Deterministic, so a failing case can be replayed.
function seeded(seed = 7): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

describe('MoteField', () => {
  it('scales the count with the area, within its bounds', () => {
    const field = new MoteField(seeded());
    field.resize(390, 844, 3);
    expect(field.count).toBe(Math.round((390 * 844) / 16000));

    field.resize(200, 200, 1);
    expect(field.count).toBe(16);

    field.resize(3840, 2160, 1);
    expect(field.count).toBe(120);
  });

  it('caps the backing store at 1.5 device pixels per CSS pixel', () => {
    const field = new MoteField(seeded());
    expect(field.resize(390, 844, 3)).toEqual({ width: 585, height: 1266 });
    expect(field.resize(1280, 800, 1)).toEqual({ width: 1280, height: 800 });
  });

  it('never draws a mote more opaque than the canvas cap allows', () => {
    const field = new MoteField(seeded());
    field.resize(1280, 800, 1);
    const { fake, rects } = surface();

    field.draw(fake, 16, 0, false);

    expect(rects).toHaveLength(field.count);
    expect(rects.every((r) => r.alpha > 0 && r.alpha <= 1)).toBe(true);
    expect(fake.globalAlpha).toBe(1);
  });

  it('holds every mote where it stands under reduced motion', () => {
    const field = new MoteField(seeded());
    field.resize(1280, 800, 1);
    const { fake, rects } = surface();

    field.draw(fake, 16, 0, true);
    const first = rects.splice(0).map((r) => [r.x, r.y]);
    field.draw(fake, 500, 400, true);

    expect(rects.map((r) => [r.x, r.y])).toEqual(first);
  });

  it('drifts up the diagonal when motion is allowed', () => {
    const field = new MoteField(seeded());
    field.resize(1280, 800, 1);
    const { fake } = surface();
    const before = Array.from(field.y.slice(0, field.count));

    field.draw(fake, 64, 0, false);

    const risen = before.filter((y, i) => field.y[i] < y).length;
    expect(risen).toBeGreaterThan(field.count * 0.9);
  });

  it('draws larger motes for the 3D world', () => {
    const field = new MoteField(seeded());
    field.resize(1280, 800, 1);
    const plain = surface();
    field.draw(plain.fake, 0, 0, true);

    field.sizeK = 1.4;
    const large = surface();
    field.draw(large.fake, 0, 0, true);

    expect(large.rects[0].size).toBeCloseTo(plain.rects[0].size * 1.4);
  });
});

describe('Motes', () => {
  const root = document.documentElement;
  const originalObserver = window.ResizeObserver;
  const originalMatchMedia = window.matchMedia;
  let resize: () => void;
  let densityChange: (() => void) | undefined;
  let frames: Set<FrameCallback>;
  let reduced: WritableSignal<boolean>;
  let drawn: { fills: number; fillStyle: string; sizes: number[] };

  beforeEach(() => {
    window.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        resize = () => callback([], this);
      }
      observe = () => undefined;
      unobserve = () => undefined;
      disconnect = () => undefined;
    };
    window.matchMedia = () =>
      ({
        addEventListener: (_: string, listener: () => void) => (densityChange = listener),
        removeEventListener: () => (densityChange = undefined),
      }) as unknown as MediaQueryList;
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1280);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(800);

    drawn = { fills: 0, fillStyle: '', sizes: [] };
    const context = {
      setTransform: () => undefined,
      clearRect: () => undefined,
      fillRect: (_x: number, _y: number, size: number) => {
        drawn.fills += 1;
        drawn.sizes.push(size);
      },
      globalAlpha: 1,
      set fillStyle(value: string) {
        drawn.fillStyle = value;
      },
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );

    frames = new Set();
    reduced = signal(false);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ReducedMotion, useValue: { reduced } },
        {
          provide: FrameLoop,
          useValue: {
            add: (callback: FrameCallback) => {
              frames.add(callback);
              return () => frames.delete(callback);
            },
          },
        },
      ],
    });
  });

  afterEach(() => {
    window.ResizeObserver = originalObserver;
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
    root.removeAttribute('data-world');
    root.style.removeProperty('--world-ink');
  });

  async function mount(path: string) {
    TestBed.inject(ActiveWorld).enter(path);
    root.style.setProperty('--world-ink', '#f3eee8');
    const fixture = TestBed.createComponent(Motes);
    fixture.detectChanges();
    await fixture.whenStable();
    resize();
    TestBed.tick();
    const canvas: HTMLCanvasElement = fixture.nativeElement.querySelector('canvas');
    return { fixture, canvas };
  }

  const tick = () => {
    for (const frame of frames) frame(0, 16);
  };

  it('draws every frame in the world ink once sized', async () => {
    const { canvas } = await mount('/developpeur');

    expect(frames.size).toBe(1);
    tick();
    expect(drawn.fills).toBe(Math.round((1280 * 800) / 16000));
    expect(drawn.fillStyle).toBe('#f3eee8');
    expect(canvas.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws once and holds still under reduced motion', async () => {
    reduced.set(true);
    await mount('/developpeur');

    expect(frames.size).toBe(0);
    expect(drawn.fills).toBe(64);
  });

  it('draws larger motes in the 3D world', async () => {
    await mount('/developpeur');
    tick();
    const dev = drawn.sizes.splice(0);

    TestBed.inject(ActiveWorld).enter('/graphisme-3d');
    TestBed.tick();
    tick();

    expect(Math.max(...drawn.sizes)).toBeGreaterThan(Math.max(...dev));
  });

  it('stops when the motion preference changes, and draws a still frame', async () => {
    await mount('/developpeur');
    reduced.set(true);
    TestBed.tick();
    expect(frames.size).toBe(0);
  });

  it('refits the backing store when the pixel ratio changes', async () => {
    const { canvas } = await mount('/developpeur');
    expect(canvas.width).toBe(1280);

    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(2);
    densityChange?.();
    expect(canvas.width).toBe(1920);
    expect(densityChange).toBeDefined();
  });
});
