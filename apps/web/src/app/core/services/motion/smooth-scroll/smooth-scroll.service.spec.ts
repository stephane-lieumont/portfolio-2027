import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Lenis from 'lenis';

import { FrameLoopService } from '@core/services/motion/frame-loop/frame-loop.service';
import { ReducedMotionService } from '@core/services/motion/reduced-motion/reduced-motion.service';
import { SmoothScrollService } from './smooth-scroll.service';

describe('SmoothScrollService', () => {
  const root = document.documentElement;
  const original = window.ResizeObserver;
  let reduced: ReturnType<typeof signal<boolean>>;
  let ticking: number;

  beforeEach(() => {
    // Lenis measures with a ResizeObserver, which jsdom does not have.
    const nothing = () => undefined;
    window.ResizeObserver = class {
      observe = nothing;
      unobserve = nothing;
      disconnect = nothing;
    };
    reduced = signal(false);
    ticking = 0;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: ReducedMotionService, useValue: { reduced } },
        {
          provide: FrameLoopService,
          useValue: {
            add: () => {
              ticking += 1;
              return () => (ticking -= 1);
            },
          },
        },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    window.ResizeObserver = original;
    vi.restoreAllMocks();
  });

  async function enabled(): Promise<SmoothScrollService> {
    const smooth = TestBed.inject(SmoothScrollService);
    smooth.enable();
    TestBed.tick();
    await vi.waitFor(() => expect(smooth.active).toBe(true));
    return smooth;
  }

  it('does nothing until the page has rendered in a browser', () => {
    const smooth = TestBed.inject(SmoothScrollService);
    TestBed.tick();
    expect(smooth.active).toBe(false);
    expect(root.classList.contains('lenis')).toBe(false);
  });

  it('smooths the wheel on the shared frame loop once enabled', async () => {
    await enabled();
    expect(root.classList.contains('lenis')).toBe(true);
    expect(ticking).toBe(1);
  });

  it('goes away when the visitor asks for reduced motion, and comes back', async () => {
    const smooth = await enabled();

    reduced.set(true);
    TestBed.tick();
    expect(smooth.active).toBe(false);
    expect(root.classList.contains('lenis')).toBe(false);
    expect(ticking).toBe(0);

    reduced.set(false);
    TestBed.tick();
    await vi.waitFor(() => expect(smooth.active).toBe(true));
  });

  it('never starts when reduced motion is asked for from the outset', async () => {
    reduced.set(true);
    const smooth = TestBed.inject(SmoothScrollService);
    smooth.enable();
    TestBed.tick();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(smooth.active).toBe(false);
  });

  it('holds the page still under a dialog until the last one closes', async () => {
    const smooth = await enabled();

    smooth.pause();
    smooth.pause();
    expect(root.classList.contains('lenis-stopped')).toBe(true);
    smooth.resume();
    expect(root.classList.contains('lenis-stopped')).toBe(true);
    smooth.resume();
    expect(root.classList.contains('lenis-stopped')).toBe(false);
  });

  it('jumps with the browser when smoothing is off', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    TestBed.inject(SmoothScrollService).jumpTo(0);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
  });

  it('jumps through Lenis when it runs, so no easing drags the page back', async () => {
    const smooth = await enabled();
    const lenisScroll = vi.spyOn(Lenis.prototype, 'scrollTo');
    const browserScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    smooth.jumpTo(0);
    smooth.settle();

    expect(lenisScroll).toHaveBeenCalledTimes(2);
    for (const [, options] of lenisScroll.mock.calls) {
      expect(options).toMatchObject({ immediate: true, force: true });
    }
    expect(browserScroll).not.toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
  });

  it('has nothing to settle when smoothing is off', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    TestBed.inject(SmoothScrollService).settle();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
