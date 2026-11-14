import { WritableSignal, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FrameLoop, type FrameCallback } from '../core/motion/frame-loop';
import { ReducedMotion } from '../core/motion/reduced-motion';
import { ActiveWorld } from '../core/world/world';
import {
  Thread,
  ThreadTrail,
  easingOf,
  sweepEdge,
  type ThreadLook,
  type ThreadSurface,
} from './thread';

interface Stroke {
  ink: string;
  alpha: number;
  width: number;
}

function recorder() {
  const strokes: Stroke[] = [];
  const clears: number[][] = [];
  const clips: number[][] = [];
  let path: number[] = [];
  const state = { strokeStyle: '', globalAlpha: 1, lineWidth: 1 };
  const surface: ThreadSurface = {
    setTransform: () => undefined,
    clearRect: (...rect: number[]) => clears.push(rect),
    save: () => undefined,
    restore: () => undefined,
    beginPath: () => (path = []),
    closePath: () => undefined,
    moveTo: (x: number) => path.push(x),
    lineTo: (x: number) => path.push(x),
    quadraticCurveTo: () => undefined,
    clip: () => clips.push(path),
    stroke: () =>
      strokes.push({ ink: state.strokeStyle, alpha: state.globalAlpha, width: state.lineWidth }),
    lineCap: 'butt',
    get strokeStyle() {
      return state.strokeStyle;
    },
    set strokeStyle(value: string) {
      state.strokeStyle = value;
    },
    get globalAlpha() {
      return state.globalAlpha;
    },
    set globalAlpha(value: number) {
      state.globalAlpha = value;
    },
    get lineWidth() {
      return state.lineWidth;
    },
    set lineWidth(value: number) {
      state.lineWidth = value;
    },
  };
  return { surface, strokes, clears, clips };
}

const DEV: ThreadLook = { ink: '#f2a154', alpha: 0.9, width: 1.5 };
const CGI: ThreadLook = { ink: '#ffffff', alpha: 1, width: 2 };

function sized(): ThreadTrail {
  const trail = new ThreadTrail();
  trail.resize(1280, 800, 1);
  return trail;
}

/** Moves the mouse along x by `step` px each frame of `delta` ms, for `ms` in all. */
function drag(trail: ThreadTrail, surface: ThreadSurface, delta: number, ms: number, step: number) {
  let x = 100;
  for (let t = 0; t < ms; t += delta) {
    x += step * (delta / 16);
    trail.move(x, 400);
    trail.tick(surface, delta, DEV, null);
  }
  return x;
}

describe('easingOf', () => {
  it('solves the sweep’s cubic-bezier, and falls back to linear on anything else', () => {
    const ease = easingOf('cubic-bezier(0.65, 0, 0.35, 1)');
    expect(ease(0)).toBeCloseTo(0);
    expect(ease(0.5)).toBeCloseTo(0.5);
    expect(ease(1)).toBeCloseTo(1);
    expect(ease(0.25)).toBeLessThan(0.1);

    expect(easingOf('ease-in-out')(0.3)).toBe(0.3);
    expect(easingOf(undefined)(0.3)).toBe(0.3);
  });
});

describe('sweepEdge', () => {
  it('starts off-screen on the side the band enters from and leaves past the other', () => {
    const intoCgi = [sweepEdge('cgi', 0), sweepEdge('cgi', 1)];
    expect(Math.min(intoCgi[0].top, intoCgi[0].bottom)).toBeGreaterThanOrEqual(1);
    expect(Math.max(intoCgi[1].top, intoCgi[1].bottom)).toBeLessThanOrEqual(0);

    const intoDev = [sweepEdge('dev', 0), sweepEdge('dev', 1)];
    expect(Math.max(intoDev[0].top, intoDev[0].bottom)).toBeLessThanOrEqual(0);
    expect(Math.min(intoDev[1].top, intoDev[1].bottom)).toBeGreaterThanOrEqual(1);
  });
});

describe('ThreadTrail', () => {
  it('draws nothing for a still pointer, and a tapering line for a moving one', () => {
    const trail = sized();
    const { surface, strokes } = recorder();
    trail.move(100, 400);
    trail.tick(surface, 16, DEV, null);
    expect(strokes).toHaveLength(0);

    drag(trail, surface, 16, 200, 30);

    const last = strokes.slice(-24);
    expect(last.every((s) => s.ink === DEV.ink)).toBe(true);
    expect(last[0].alpha).toBeLessThanOrEqual(DEV.alpha);
    expect(last[0].alpha).toBeGreaterThan(last[23].alpha);
    expect(last[0].width).toBeGreaterThan(last[23].width);
    expect(last[23].width).toBeGreaterThanOrEqual(DEV.width * 0.3);
  });

  it('never grows longer than 220px, however fast the mouse', () => {
    const trail = sized();
    const { surface } = recorder();
    drag(trail, surface, 16, 400, 200);

    let length = 0;
    for (let i = 1; i < 24; i++) {
      length += Math.hypot(trail.x[i] - trail.x[i - 1], trail.y[i] - trail.y[i - 1]);
    }
    expect(length).toBeLessThanOrEqual(220.01);
    expect(length).toBeGreaterThan(200);
  });

  it('trails the same length at 60 Hz and at 144 Hz', () => {
    const slow = sized();
    const fast = sized();
    const { surface } = recorder();
    drag(slow, surface, 16, 192, 6);
    drag(fast, surface, 16 / 2.4, 192, 6);

    const lag = (trail: ThreadTrail) => trail.x[0] - trail.x[23];
    expect(Math.abs(lag(slow) - lag(fast))).toBeLessThan(lag(slow) * 0.1);
  });

  it('draws no line across a jump: a re-entry or a stall', () => {
    const trail = sized();
    const { surface, strokes } = recorder();
    trail.move(100, 400);
    trail.tick(surface, 16, DEV, null);
    trail.move(700, 400);
    trail.tick(surface, 16, DEV, null);

    expect(strokes).toHaveLength(0);
  });

  it('fades out once the pointer leaves, and clears what it drew', () => {
    const trail = sized();
    const { surface, strokes, clears } = recorder();
    drag(trail, surface, 16, 200, 30);
    trail.leave();
    for (let t = 0; t < 1000; t += 16) trail.tick(surface, 16, DEV, null);

    strokes.length = 0;
    trail.tick(surface, 16, DEV, null);
    expect(strokes).toHaveLength(0);
    expect(trail.drawn).toBe(false);
    expect(clears.length).toBeGreaterThan(0);
  });

  it('splits along the sweep’s edge: the covered side takes the target world’s look', () => {
    const trail = sized();
    const { surface, strokes, clips } = recorder();
    drag(trail, surface, 16, 200, 30);
    strokes.length = 0;

    trail.tick(surface, 16, DEV, { to: 'cgi', progress: 0.5, covered: CGI });
    expect(new Set(strokes.map((s) => s.ink))).toEqual(new Set([DEV.ink, CGI.ink]));
    // Into the 3D world the band travels leftward: covered is right of the edge.
    const [uncovered, covered] = clips.slice(-2);
    expect(uncovered[0]).toBeCloseTo(0.6 * 1280);
    expect(Math.min(...uncovered)).toBe(-1e5);
    expect(Math.max(...covered)).toBe(1e5);

    strokes.length = 0;
    trail.tick(surface, 16, DEV, { to: 'cgi', progress: 1, covered: CGI });
    expect(strokes.every((s) => s.ink === CGI.ink)).toBe(true);
  });
});

describe('Thread', () => {
  const root = document.documentElement;
  const originalObserver = window.ResizeObserver;
  const originalMatchMedia = window.matchMedia;
  let resize: () => void;
  let fineChange: (() => void) | undefined;
  let fine: boolean;
  let frames: Set<FrameCallback>;
  let reduced: WritableSignal<boolean>;
  let rec: ReturnType<typeof recorder>;

  beforeEach(() => {
    window.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        resize = () => callback([], this);
      }
      observe = () => undefined;
      unobserve = () => undefined;
      disconnect = () => undefined;
    };
    fine = true;
    window.matchMedia = () =>
      ({
        get matches() {
          return fine;
        },
        addEventListener: (_: string, listener: () => void) => (fineChange = listener),
        removeEventListener: () => (fineChange = undefined),
      }) as unknown as MediaQueryList;
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1280);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(800);

    rec = recorder();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      rec.surface as unknown as CanvasRenderingContext2D,
    );
    for (const [world, look] of [
      ['dev', DEV],
      ['cgi', CGI],
    ] as const) {
      root.style.setProperty(`--thread-ink-${world}`, look.ink);
      root.style.setProperty(`--thread-alpha-${world}`, String(look.alpha));
      root.style.setProperty(`--thread-width-${world}`, String(look.width));
    }

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
    vi.unstubAllGlobals();
    root.removeAttribute('data-world');
    root.removeAttribute('data-vt');
    root.removeAttribute('style');
    document.querySelectorAll('dialog').forEach((d) => d.remove());
  });

  async function mount(path = '/developpeur') {
    TestBed.inject(ActiveWorld).enter(path);
    const fixture = TestBed.createComponent(Thread);
    fixture.detectChanges();
    await fixture.whenStable();
    resize();
    TestBed.tick();
    return fixture;
  }

  const pointer = (x: number, pointerType = 'mouse') => {
    const event = new Event('pointermove');
    Object.assign(event, { clientX: x, clientY: 400, pointerType });
    window.dispatchEvent(event);
  };

  const sweepAcross = (pointerType = 'mouse') => {
    for (let x = 100; x < 700; x += 30) {
      pointer(x, pointerType);
      for (const frame of frames) frame(0, 16);
    }
  };

  it('draws in the world’s look while the mouse moves, from a decorative canvas', async () => {
    const fixture = await mount('/graphisme-3d');
    sweepAcross();

    expect(rec.strokes.length).toBeGreaterThan(0);
    expect(rec.strokes.every((s) => s.ink === CGI.ink)).toBe(true);
    const canvas: HTMLCanvasElement = fixture.nativeElement.querySelector('canvas');
    expect(canvas.getAttribute('aria-hidden')).toBe('true');
  });

  it('ignores touch and pen', async () => {
    await mount();
    sweepAcross('touch');
    sweepAcross('pen');
    expect(rec.strokes).toHaveLength(0);
  });

  it('does not run without a canvas', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await mount();
    expect(frames.size).toBe(0);
  });

  it('does not run on a coarse pointer, and stops when the mouse goes away', async () => {
    fine = false;
    await mount();
    expect(frames.size).toBe(0);

    fine = true;
    fineChange?.();
    TestBed.tick();
    expect(frames.size).toBe(1);

    sweepAcross();
    fine = false;
    fineChange?.();
    TestBed.tick();
    expect(frames.size).toBe(0);
  });

  it('stops and clears its line when reduced motion is switched on mid-way', async () => {
    await mount();
    sweepAcross();
    const clears = rec.clears.length;

    reduced.set(true);
    TestBed.tick();

    expect(frames.size).toBe(0);
    expect(rec.clears.length).toBe(clears + 1);
  });

  it('draws nothing while the viewer’s dialog is open', async () => {
    await mount();
    const dialog = document.createElement('dialog');
    dialog.setAttribute('open', '');
    document.body.append(dialog);

    sweepAcross();
    expect(rec.strokes).toHaveLength(0);
  });

  it('clears its line when the tab is hidden', async () => {
    await mount();
    sweepAcross();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));

    rec.strokes.length = 0;
    for (const frame of frames) frame(0, 16);
    expect(rec.strokes).toHaveLength(0);
  });

  describe('across a route transition', () => {
    class FakeEffect {
      constructor(readonly pseudoElement: string) {}
      getTiming = () => ({ duration: 640 });
      getKeyframes = () => [{ easing: 'linear' }];
    }

    beforeEach(() => {
      vi.stubGlobal('KeyframeEffect', FakeEffect);
      document.getAnimations = () =>
        [
          { effect: new FakeEffect('::view-transition-new(root)'), currentTime: 320 },
          { effect: new FakeEffect('::view-transition-old(root)'), currentTime: 320 },
        ] as unknown as Animation[];
    });

    afterEach(() => {
      Reflect.deleteProperty(document, 'getAnimations');
    });

    it('takes the target world’s look on the side the sweep has covered', async () => {
      await mount('/developpeur');
      sweepAcross();
      root.dataset['vt'] = 'sweep-cgi';
      TestBed.inject(ActiveWorld).enter('/graphisme-3d');
      rec.strokes.length = 0;

      pointer(730);
      for (const frame of frames) frame(0, 16);

      expect(new Set(rec.strokes.map((s) => s.ink))).toEqual(new Set([DEV.ink, CGI.ink]));
    });

    it('keeps its colour through the contact wipe', async () => {
      await mount('/graphisme-3d');
      root.dataset['vt'] = 'wipe';
      sweepAcross();

      expect(rec.strokes.every((s) => s.ink === CGI.ink)).toBe(true);
    });
  });
});
