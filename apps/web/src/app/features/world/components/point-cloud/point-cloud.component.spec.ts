import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { signal } from '@angular/core';

import {
  FrameLoopService,
  type FrameCallback,
} from '@core/services/motion/frame-loop/frame-loop.service';
import { ReducedMotionService } from '@core/services/motion/reduced-motion/reduced-motion.service';
import { CloudModel, CloudStore } from '@core/stores/cloud/cloud.store';
import { PointCloudComponent } from './point-cloud.component';

describe('PointCloudComponent across a world switch', () => {
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
        { provide: ReducedMotionService, useValue: { reduced } },
        {
          provide: FrameLoopService,
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
    const fixture = TestBed.createComponent(PointCloudComponent);
    fixture.componentRef.setInput('world', world);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const frame = (ms: number) => ticks.forEach((tick) => tick(0, ms));

  it('picks the morph up where the leaving page left it, and never reassembles', async () => {
    const init = vi.spyOn(CloudModel.prototype, 'init');
    const state = TestBed.inject(CloudStore);
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
    const state = TestBed.inject(CloudStore);
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
    TestBed.inject(CloudStore).arrive();
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

  it('lets the frame loop go once the still frame is drawn, and takes it back when needed', async () => {
    reduced.set(true);
    TestBed.inject(CloudStore).arrive();
    await page('cgi');
    frame(16);
    expect(ticks.size).toBe(0);

    seen!([{ isIntersecting: true }]);
    expect(ticks.size).toBe(1);
    frame(16);
    expect(ticks.size).toBe(0);

    reduced.set(false);
    TestBed.tick();
    expect(ticks.size).toBe(1);
    frame(16);
    frame(16);
    expect(ticks.size).toBe(1);
  });

  it('runs no frame loop while off screen, and resumes on the way back', async () => {
    TestBed.inject(CloudStore).arrive();
    await page('cgi');
    seen!([{ isIntersecting: false }]);
    frame(16);
    expect(ticks.size).toBe(0);
    seen!([{ isIntersecting: true }]);
    expect(ticks.size).toBe(1);
  });

  it('draws nothing while off screen', async () => {
    TestBed.inject(CloudStore).arrive();
    await page('dev');
    seen!([{ isIntersecting: false }]);
    frame(16);
    expect(fillRect).not.toHaveBeenCalled();
  });

  describe('grabbing the torus', () => {
    let captured: Set<number>;

    beforeEach(() => {
      captured = new Set();
      Object.assign(HTMLCanvasElement.prototype, {
        setPointerCapture: (id: number) => captured.add(id),
        releasePointerCapture: (id: number) => captured.delete(id),
        hasPointerCapture: (id: number) => captured.has(id),
      });
    });

    const press = (
      canvas: HTMLCanvasElement,
      type: string,
      x: number,
      y: number,
      {
        button = 0,
        buttons = type === 'pointerup' ? 0 : 1,
        ...pointer
      }: { button?: number; buttons?: number; pointerType?: string; isPrimary?: boolean } = {},
    ) => {
      const event = new MouseEvent(type, {
        clientX: x,
        clientY: y,
        cancelable: true,
        button,
        buttons,
      });
      Object.assign(event, { pointerId: 1, pointerType: 'mouse', isPrimary: true, ...pointer });
      canvas.dispatchEvent(event);
      return event;
    };

    async function stage(world: 'dev' | 'cgi') {
      TestBed.inject(CloudStore).arrive();
      const fixture = await page(world);
      frame(16);
      const host: HTMLElement = fixture.nativeElement;
      return { fixture, host, canvas: host.querySelector('canvas')! };
    }

    it('turns the torus with the hand: a full stage width is half a turn', async () => {
      const { fixture, host, canvas } = await stage('cgi');
      const model = TestBed.inject(CloudStore).model;
      expect(host.dataset['grab']).toBe('free');
      const before = model.pose;

      const down = press(canvas, 'pointerdown', 100, 100);
      press(canvas, 'pointermove', 300, 150);
      frame(16);
      await fixture.whenStable();

      expect(down.defaultPrevented).toBe(true);
      expect(captured.has(1)).toBe(true);
      expect(host.dataset['grab']).toBe('held');
      expect(model.pose.yaw).toBeCloseTo(before.yaw - Math.PI / 2, 6);
      expect(model.pose.pitch).toBeCloseTo(before.pitch + Math.PI / 8, 6);

      press(canvas, 'pointerup', 300, 150);
      await fixture.whenStable();
      expect(model.grabbed).toBe(false);
      expect(captured.size).toBe(0);
      expect(host.dataset['grab']).toBe('free');
    });

    it('lets go on a cancelled pointer, a lost window, and a page leaving mid-drag', async () => {
      const { fixture, canvas } = await stage('cgi');
      const model = TestBed.inject(CloudStore).model;

      press(canvas, 'pointerdown', 100, 100);
      press(canvas, 'pointercancel', 100, 100);
      expect(model.grabbed).toBe(false);

      press(canvas, 'pointerdown', 100, 100);
      window.dispatchEvent(new Event('blur'));
      expect(model.grabbed).toBe(false);

      press(canvas, 'pointerdown', 100, 100);
      fixture.destroy();
      expect(model.grabbed).toBe(false);
      expect(captured.size).toBe(0);
    });

    it('ignores other buttons, a pen’s barrel button and secondary touches', async () => {
      const { canvas } = await stage('cgi');
      const model = TestBed.inject(CloudStore).model;
      press(canvas, 'pointerdown', 100, 100, { button: 2 });
      press(canvas, 'pointerdown', 100, 100, { button: 2, pointerType: 'pen' });
      press(canvas, 'pointerdown', 100, 100, { pointerType: 'touch', isPrimary: false });
      press(canvas, 'pointermove', 200, 100, { pointerType: 'touch', isPrimary: false });
      expect(model.grabbed).toBe(false);
    });

    it('lets go when the button came up unseen, or a context menu opened', async () => {
      const { canvas } = await stage('cgi');
      const model = TestBed.inject(CloudStore).model;

      press(canvas, 'pointerdown', 100, 100);
      press(canvas, 'pointermove', 150, 100, { buttons: 0 });
      expect(model.grabbed).toBe(false);
      expect(captured.size).toBe(0);

      press(canvas, 'pointerdown', 100, 100);
      canvas.dispatchEvent(new MouseEvent('contextmenu'));
      expect(model.grabbed).toBe(false);
    });

    it('leaves a vertical touch to the page’s scroll: no grab, no turn', async () => {
      const { canvas } = await stage('cgi');
      const model = TestBed.inject(CloudStore).model;
      const touch = { pointerType: 'touch' };
      press(canvas, 'pointerdown', 100, 100, touch);
      press(canvas, 'pointermove', 102, 106, touch);
      press(canvas, 'pointermove', 103, 114, touch);
      frame(16);
      press(canvas, 'pointercancel', 103, 114, touch);
      press(canvas, 'pointermove', 300, 114, touch);
      frame(16);

      expect(model.grabbed).toBe(false);
      expect(captured.size).toBe(0);
      expect(model.pose.yaw).toBeCloseTo(model.clock * 0.45, 9);
    });

    it('takes a sideways touch once past the slop, without a jump', async () => {
      const { canvas } = await stage('cgi');
      const model = TestBed.inject(CloudStore).model;
      const touch = { pointerType: 'touch' };
      const down = press(canvas, 'pointerdown', 100, 100, touch);
      press(canvas, 'pointermove', 106, 101, touch);
      expect(model.grabbed).toBe(false);

      press(canvas, 'pointermove', 112, 102, touch);
      expect(model.grabbed).toBe(true);
      frame(16);
      const taken = model.pose.yaw;
      press(canvas, 'pointermove', 212, 102, touch);
      frame(16);

      expect(down.defaultPrevented).toBe(false);
      expect(model.pose.yaw).toBeCloseTo(taken - Math.PI / 4, 6);
    });

    it('leaves the glyph of the dev world alone', async () => {
      const { host, canvas } = await stage('dev');
      const model = TestBed.inject(CloudStore).model;
      const down = press(canvas, 'pointerdown', 100, 100);
      press(canvas, 'pointermove', 300, 150);

      expect(model.grabbed).toBe(false);
      expect(down.defaultPrevented).toBe(false);
      expect(host.dataset['grab']).toBeUndefined();
    });

    it('redraws the still frame as the hand turns it under reduced motion', async () => {
      reduced.set(true);
      const { canvas } = await stage('cgi');
      const drawn = fillRect.mock.calls.length;
      frame(16);
      expect(fillRect.mock.calls.length).toBe(drawn);

      press(canvas, 'pointerdown', 100, 100);
      press(canvas, 'pointermove', 140, 100);
      frame(16);
      expect(fillRect.mock.calls.length).toBe(2 * drawn);
    });
  });

  it('lets the motes go when the page leaves: no stage, no frames', async () => {
    const state = TestBed.inject(CloudStore);
    state.arrive();
    const dev = await page('dev');
    expect(state.stage).not.toBeNull();
    dev.destroy();
    expect(state.stage).toBeNull();
    expect(ticks.size).toBe(0);
  });
});
