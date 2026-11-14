import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { FrameLoop } from '../core/motion/frame-loop';
import { ReducedMotion } from '../core/motion/reduced-motion';
import { ActiveWorld } from '../core/world/world';

const MAX = 120;
const MIN = 16;
/** One mote per this many square CSS pixels. */
const AREA = 16000;
const MARGIN = 8;
/** A scroll jump larger than this (an anchor, the jump to the top) is not parallax. */
const JUMP = 120;
/** The sweep's lean: 20% of the viewport width across its height. */
const LEAN = 0.2;
const MAX_DPR = 1.5;

export type MoteSurface = Pick<
  CanvasRenderingContext2D,
  'setTransform' | 'clearRect' | 'fillRect' | 'fillStyle' | 'globalAlpha'
>;

/**
 * Stray points drifting up along the sweep's diagonal behind the page, with a
 * touch of scroll parallax: the deeper ones move more. The canvas's CSS opacity
 * is the cap on how visible they get (`--motes-max`); here alpha never exceeds 1.
 */
export class MoteField {
  readonly x = new Float32Array(MAX);
  readonly y = new Float32Array(MAX);
  private readonly depth = new Float32Array(MAX);
  private readonly phase = new Float32Array(MAX);
  count = 0;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private ux = 0;
  private uy = -1;
  private clock = 0;
  private scrollY = 0;
  ink = '#000';
  sizeK = 1;

  private readonly random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
    for (let i = 0; i < MAX; i++) {
      const r = random();
      this.depth[i] = 0.15 + 0.85 * r * r;
      this.phase[i] = random() * Math.PI * 2;
    }
  }

  /** Returns the backing store size the canvas needs, in device pixels. */
  resize(
    width: number,
    height: number,
    devicePixelRatio: number,
  ): { width: number; height: number } {
    for (let i = 0; i < MAX; i++) {
      if (this.width) {
        this.x[i] *= width / this.width;
        this.y[i] *= height / this.height;
      } else {
        this.x[i] = this.random() * width;
        this.y[i] = this.random() * height;
      }
    }
    this.width = width;
    this.height = height;
    this.dpr = Math.min(MAX_DPR, devicePixelRatio || 1);
    this.count = Math.min(MAX, Math.max(MIN, Math.round((width * height) / AREA)));
    const lean = LEAN * width;
    const length = Math.hypot(lean, height);
    this.ux = lean / length;
    this.uy = -height / length;
    return { width: Math.round(width * this.dpr), height: Math.round(height * this.dpr) };
  }

  /** Moves by `delta` ms and draws. `still` draws where they stand, for reduced motion. */
  draw(surface: MoteSurface, delta: number, scrollY: number, still: boolean): void {
    if (!this.count) return;
    const shift = still ? 0 : Math.max(-JUMP, Math.min(JUMP, scrollY - this.scrollY));
    this.scrollY = scrollY;
    const t = delta / 1000;
    if (!still) this.clock += t;

    surface.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    surface.clearRect(0, 0, this.width, this.height);
    surface.fillStyle = this.ink;
    const wrapW = this.width + 2 * MARGIN;
    const wrapH = this.height + 2 * MARGIN;

    for (let i = 0; i < this.count; i++) {
      const d = this.depth[i];
      if (!still) {
        const v = (4 + 12 * d) * t;
        this.x[i] += this.ux * v;
        this.y[i] += this.uy * v - shift * (0.06 + 0.24 * d);
        if (this.y[i] < -MARGIN) {
          this.y[i] += wrapH;
          this.x[i] = this.random() * this.width;
        } else if (this.y[i] > this.height + MARGIN) {
          this.y[i] -= wrapH;
          this.x[i] = this.random() * this.width;
        }
        if (this.x[i] > this.width + MARGIN) this.x[i] -= wrapW;
        else if (this.x[i] < -MARGIN) this.x[i] += wrapW;
      }
      const sway = still ? 0 : Math.sin(this.clock * (0.12 + 0.08 * d) + this.phase[i]) * 6 * d;
      // Not rounded: a drift of 4px a second would visibly step.
      const x = this.x[i] - this.uy * sway;
      const y = this.y[i] + this.ux * sway;
      const size = (1.2 + 1.8 * d) * this.sizeK;
      surface.globalAlpha = 0.3 + 0.7 * d;
      surface.fillRect(x - size / 2, y - size / 2, size, size);
    }
    surface.globalAlpha = 1;
  }
}

/**
 * The background motes. Fixed behind the page (z-index -1 under a transparent
 * body, the ground painted by <html>), so they pass under every band and image
 * and never over one. Nothing is drawn while prerendering
 * or when the tab is hidden; under reduced motion they are drawn once, still.
 */
@Component({
  selector: 'app-motes',
  template: `<canvas #canvas class="motes" aria-hidden="true"></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Motes {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly document = inject(DOCUMENT);
  private readonly frames = inject(FrameLoop);
  private readonly motion = inject(ReducedMotion);
  private readonly active = inject(ActiveWorld);

  private readonly field = new MoteField();
  private readonly size = signal<{ width: number; height: number } | null>(null);
  private surface: MoteSurface | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const canvas = this.canvas().nativeElement;
      const view = this.document.defaultView;
      this.surface = canvas.getContext('2d');
      if (!this.surface || !view || typeof view.ResizeObserver !== 'function') return;

      const fit = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (!width || !height) return;
        const store = this.field.resize(width, height, view.devicePixelRatio);
        canvas.width = store.width;
        canvas.height = store.height;
        this.size.set({ width, height });
      };

      // Sized on 100lvh in CSS, so the mobile URL bar never resizes the
      // backing store in the middle of a scroll.
      const observer = new view.ResizeObserver(fit);
      observer.observe(canvas);

      // Moving the window to another screen changes the pixel ratio and not
      // the size, which the observer does not report. The query is for the
      // current ratio, so it is rebuilt each time it stops matching.
      let density: MediaQueryList | undefined;
      const watchDensity = () => {
        density?.removeEventListener('change', onDensity);
        density = view.matchMedia?.(`(resolution: ${view.devicePixelRatio}dppx)`);
        density?.addEventListener('change', onDensity);
      };
      const onDensity = () => {
        fit();
        watchDensity();
      };
      watchDensity();

      destroyRef.onDestroy(() => {
        observer.disconnect();
        density?.removeEventListener('change', onDensity);
      });
    });

    effect((onCleanup) => {
      const surface = this.surface;
      const world = this.active.world();
      const still = this.motion.reduced();
      if (!this.size() || !surface) return;

      const root = this.document.documentElement;
      this.field.ink = getComputedStyle(root).getPropertyValue('--world-ink').trim() || '#000';
      // Dark motes on the orange ground read smaller than light ones on black.
      this.field.sizeK = world === 'cgi' ? 1.4 : 1;

      const view = this.document.defaultView;
      if (still) {
        this.field.draw(surface, 0, view?.scrollY ?? 0, true);
        return;
      }
      onCleanup(
        this.frames.add((_time, delta) =>
          this.field.draw(surface, delta, view?.scrollY ?? 0, false),
        ),
      );
    });
  }
}
