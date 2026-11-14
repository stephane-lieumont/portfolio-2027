import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { signal } from '@angular/core';

import { FrameLoop, type FrameCallback } from '../../core/motion/frame-loop';
import { ReducedMotion } from '../../core/motion/reduced-motion';
import { CloudModel, CloudState } from '../../core/world/cloud-state';
import { PointCloud } from './point-cloud';

describe('PointCloud across a world switch', () => {
  let ticks: Set<FrameCallback>;
  let reduced: ReturnType<typeof signal<boolean>>;
  let seen: ((entries: { isIntersecting: boolean }[]) => void) | null;
  let fillRect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ticks = new Set();
    reduced = signal(false);
    seen = null;
    fillRect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof seen) {
          seen = callback;
        }
        observe = () => undefined;
        disconnect = () => undefined;
      },
    );
    const context = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      fillRect,
      fillText: vi.fn(),
      getImageData: (_x: number, _y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4).fill(255),
      }),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 500,
      top: 0,
      left: 0,
    } as DOMRect);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ReducedMotion, useValue: { reduced } },
        {
          provide: FrameLoop,
          useValue: {
            add: (callback: FrameCallback) => {
              ticks.add(callback);
              return () => ticks.delete(callback);
            },
          },
        },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function page(world: 'dev' | 'cgi') {
    const fixture = TestBed.createComponent(PointCloud);
    fixture.componentRef.setInput('world', world);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const frame = (ms: number) => ticks.forEach((tick) => tick(0, ms));

  it('picks the morph up where the leaving page left it, and never reassembles', async () => {
    const init = vi.spyOn(CloudModel.prototype, 'init');
    const state = TestBed.inject(CloudState);
    const model = state.model;

    state.arrive();
    const dev = await page('dev');
    expect(init).toHaveBeenCalledTimes(1);
    expect(model.t).toBe(0);

    dev.destroy();
    state.leave();
    expect(ticks.size).toBe(0);

    state.arrive();
    await page('cgi');
    expect(init).toHaveBeenCalledTimes(1);
    expect(model.target).toBe(1);
    expect(model.t).toBe(0);
    expect(ticks.size).toBe(1);

    frame(750);
    expect(model.t).toBeCloseTo(0.5, 5);
  });

  it('keeps the pointer’s turn across the switch, so the torus does not snap', async () => {
    const state = TestBed.inject(CloudState);
    state.arrive();
    const dev = await page('dev');
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: window.innerWidth, clientY: 0 }));
    const turned = [...state.pointer];
    expect(turned[0]).toBeCloseTo(0.5, 5);

    dev.destroy();
    state.leave();
    state.arrive();
    await page('cgi');
    expect(state.pointer).toEqual(turned);
  });

  it('draws one still frame under reduced motion, and again only when it comes back into view', async () => {
    reduced.set(true);
    TestBed.inject(CloudState).arrive();
    await page('cgi');
    frame(16);
    const once = fillRect.mock.calls.length;
    expect(once).toBeGreaterThan(0);
    frame(16);
    frame(16);
    expect(fillRect.mock.calls.length).toBe(once);

    seen!([{ isIntersecting: true }]);
    frame(16);
    expect(fillRect.mock.calls.length).toBe(2 * once);
  });

  it('draws nothing while off screen', async () => {
    TestBed.inject(CloudState).arrive();
    await page('dev');
    seen!([{ isIntersecting: false }]);
    frame(16);
    expect(fillRect).not.toHaveBeenCalled();
  });

  it('lets the motes go when the page leaves: no stage, no frames', async () => {
    const state = TestBed.inject(CloudState);
    state.arrive();
    const dev = await page('dev');
    expect(state.stage).not.toBeNull();
    dev.destroy();
    expect(state.stage).toBeNull();
    expect(ticks.size).toBe(0);
  });
});
