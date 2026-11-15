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
import type { WorldKey } from '@portfolio/shared-types';

import { FrameLoopService } from '../../../../core/services/motion/frame-loop.service';
import { ReducedMotionService } from '../../../../core/services/motion/reduced-motion.service';
import { WorldStore } from '../../../../core/stores/world.store';

const N = 24;
// Fixed 2 ms substeps: an in-place chain stepped once per frame trails 60% longer at 60 Hz than at 144 Hz.
const STEP = 2;
const TAU = 12;
const K = 1 - Math.exp(-STEP / TAU);
const MAX_LENGTH = 220;
const SEG = MAX_LENGTH / (N - 1);
/** The line fades out over its last this-many pixels of length, so retracting and fading are one gesture. */
const FADE = 40;
const LEAVE_TAU = 50;
/** A pointer jump this large is a re-entry or a stall, not a gesture: no line is drawn across it. */
const SNAP = 320;
const TAIL_WIDTH = 0.3;
const MAX_DPR = 2;
const PAD = 3;

const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const SWEPT_SNAPSHOT = '::view-transition-old(root)';

export interface ThreadLook {
  readonly ink: string;
  readonly alpha: number;
  readonly width: number;
}

/** A dev ↔ cgi sweep under way: its eased progress, 0 → 1, and the look of the side it has covered. */
export interface SweepSplit {
  readonly to: WorldKey;
  readonly progress: number;
  readonly covered: ThreadLook;
}

export type ThreadSurface = Pick<
  CanvasRenderingContext2D,
  | 'setTransform'
  | 'clearRect'
  | 'save'
  | 'restore'
  | 'beginPath'
  | 'closePath'
  | 'moveTo'
  | 'lineTo'
  | 'quadraticCurveTo'
  | 'clip'
  | 'stroke'
  | 'strokeStyle'
  | 'globalAlpha'
  | 'lineWidth'
  | 'lineCap'
>;

/**
 * The CSS `cubic-bezier()` easing as a function, solved without allocating.
 * Anything else (a keyword, `linear`) falls back to linear.
 */
export function easingOf(css: string | undefined): (x: number) => number {
  const match = /^cubic-bezier\(([^)]+)\)$/.exec(css?.trim() ?? '');
  const points = match?.[1].split(',').map(Number);
  if (!points || points.length !== 4 || points.some(Number.isNaN)) return (x) => x;
  const [x1, y1, x2, y2] = points;
  const bezier = (s: number, a: number, b: number) =>
    3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
  return (x) => {
    let s = x;
    for (let i = 0; i < 8; i++) {
      const error = bezier(s, x1, x2) - x;
      if (Math.abs(error) < 1e-5) break;
      const slope = 3 * (1 - s) * (1 - s) * x1 + 6 * (1 - s) * s * (x2 - x1) + 3 * s * s * (1 - x2);
      if (Math.abs(slope) < 1e-6) break;
      s = Math.min(1, Math.max(0, s - error / slope));
    }
    return bezier(s, y1, y2);
  };
}

/**
 * The sweep's leading edge at eased progress `p`, as x at the top and the
 * bottom of the viewport, in viewport widths. Mirrors the old snapshot's
 * clip-path keyframes in src/styles/_route-transition.scss.
 */
export function sweepEdge(to: WorldKey, p: number): { top: number; bottom: number } {
  return to === 'cgi'
    ? { top: 1.4 - 1.6 * p, bottom: 1.2 - 1.6 * p }
    : { top: -0.4 + 1.8 * p, bottom: -0.2 + 1.4 * p };
}

/** A single tapering line trailing the mouse: the chain, its physics and its drawing. */
export class ThreadTrail {
  readonly x = new Float32Array(N);
  readonly y = new Float32Array(N);
  private headX = 0;
  private headY = 0;
  private fromX = 0;
  private fromY = 0;
  private acc = 0;
  inside = false;
  presence = 0;
  drawn = false;
  width = 0;
  height = 0;
  private dpr = 1;
  private left = 0;
  private top = 0;
  private right = 0;
  private bottom = 0;

  /** Returns the backing store size the canvas needs, in device pixels. */
  resize(
    width: number,
    height: number,
    devicePixelRatio: number,
  ): { width: number; height: number } {
    this.width = width;
    this.height = height;
    this.dpr = Math.min(MAX_DPR, devicePixelRatio || 1);
    // Resizing the backing store wipes it.
    this.drawn = false;
    return { width: Math.round(width * this.dpr), height: Math.round(height * this.dpr) };
  }

  move(x: number, y: number): void {
    if (!this.inside || Math.abs(x - this.headX) + Math.abs(y - this.headY) > SNAP) {
      this.collapse(x, y);
    }
    this.headX = x;
    this.headY = y;
    this.inside = true;
    this.presence = 1;
  }

  /** Out and fully faded: nothing to step or clear, and re-entry collapses the chain anyway. */
  get idle(): boolean {
    return !this.inside && !this.drawn;
  }

  leave(): void {
    this.inside = false;
  }

  reset(surface: ThreadSurface): void {
    this.inside = false;
    this.presence = 0;
    this.collapse(this.headX, this.headY);
    this.clear(surface);
  }

  /** Steps the chain by `delta` ms and draws it in `look`, split along the sweep's edge while one runs. */
  tick(surface: ThreadSurface, delta: number, look: ThreadLook, sweep: SweepSplit | null): void {
    if (this.idle) return;
    if (!this.inside) this.presence *= Math.exp(-delta / LEAVE_TAU);

    this.acc += delta;
    const steps = Math.floor(this.acc / STEP);
    this.acc -= steps * STEP;
    const x = this.x;
    const y = this.y;
    for (let s = 1; s <= steps; s++) {
      const f = s / steps;
      x[0] = this.fromX + (this.headX - this.fromX) * f;
      y[0] = this.fromY + (this.headY - this.fromY) * f;
      for (let i = 1; i < N; i++) {
        x[i] += (x[i - 1] - x[i]) * K;
        y[i] += (y[i - 1] - y[i]) * K;
        const ex = x[i] - x[i - 1];
        const ey = y[i] - y[i - 1];
        const d = Math.sqrt(ex * ex + ey * ey);
        if (d > SEG) {
          x[i] = x[i - 1] + (ex / d) * SEG;
          y[i] = y[i - 1] + (ey / d) * SEG;
        }
      }
    }
    if (steps) {
      this.fromX = this.headX;
      this.fromY = this.headY;
    }

    let length = 0;
    let l = x[0];
    let t = y[0];
    let r = x[0];
    let b = y[0];
    for (let i = 1; i < N; i++) {
      const ex = x[i] - x[i - 1];
      const ey = y[i] - y[i - 1];
      length += Math.sqrt(ex * ex + ey * ey);
      if (x[i] < l) l = x[i];
      else if (x[i] > r) r = x[i];
      if (y[i] < t) t = y[i];
      else if (y[i] > b) b = y[i];
    }
    const fade = Math.min(1, length / FADE);
    const visibility = this.presence * fade * fade * (3 - 2 * fade);

    this.clear(surface);
    if (visibility < 0.01) return;

    surface.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    surface.lineCap = 'butt';
    if (sweep && sweep.progress < 1) {
      surface.save();
      this.clipToSweep(surface, sweep, false);
      this.stroke(surface, look, visibility);
      surface.restore();
      surface.save();
      this.clipToSweep(surface, sweep, true);
      this.stroke(surface, sweep.covered, visibility);
      surface.restore();
    } else {
      this.stroke(surface, sweep ? sweep.covered : look, visibility);
    }
    surface.globalAlpha = 1;
    this.left = l - PAD;
    this.top = t - PAD;
    this.right = r + PAD;
    this.bottom = b + PAD;
    this.drawn = true;
  }

  private collapse(x: number, y: number): void {
    this.x.fill(x);
    this.y.fill(y);
    this.headX = this.fromX = x;
    this.headY = this.fromY = y;
    this.acc = 0;
  }

  private clear(surface: ThreadSurface): void {
    if (!this.drawn) return;
    surface.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    surface.clearRect(this.left, this.top, this.right - this.left, this.bottom - this.top);
    this.drawn = false;
  }

  /** Covered = already the target world's ground. */
  private clipToSweep(surface: ThreadSurface, sweep: SweepSplit, covered: boolean): void {
    const edge = sweepEdge(sweep.to, sweep.progress);
    const leftward = sweep.to === 'cgi';
    const far = covered === leftward ? 1e5 : -1e5;
    surface.beginPath();
    surface.moveTo(edge.top * this.width, 0);
    surface.lineTo(far, 0);
    surface.lineTo(far, this.height);
    surface.lineTo(edge.bottom * this.width, this.height);
    surface.closePath();
    surface.clip();
  }

  // Midpoint quadratics: piece 0 is head → m(0,1), pieces 1…N-2 curve through p[i], the last runs m(N-2,N-1) → tail. Tangents match at every midpoint, so butt caps join without beads.
  private stroke(surface: ThreadSurface, look: ThreadLook, visibility: number): void {
    const x = this.x;
    const y = this.y;
    surface.strokeStyle = look.ink;
    for (let j = 0; j < N; j++) {
      const fall = 1 - (j + 0.5) / N;
      surface.globalAlpha = look.alpha * visibility * fall * Math.sqrt(fall);
      surface.lineWidth = look.width * (TAIL_WIDTH + (1 - TAIL_WIDTH) * fall);
      surface.beginPath();
      if (j === 0) {
        surface.moveTo(x[0], y[0]);
        surface.lineTo((x[0] + x[1]) / 2, (y[0] + y[1]) / 2);
      } else if (j === N - 1) {
        surface.moveTo((x[N - 2] + x[N - 1]) / 2, (y[N - 2] + y[N - 1]) / 2);
        surface.lineTo(x[N - 1], y[N - 1]);
      } else {
        surface.moveTo((x[j - 1] + x[j]) / 2, (y[j - 1] + y[j]) / 2);
        surface.quadraticCurveTo(x[j], y[j], (x[j] + x[j + 1]) / 2, (y[j] + y[j + 1]) / 2);
      }
      surface.stroke();
    }
  }
}

interface RunningSweep {
  readonly animation: Animation;
  readonly to: WorldKey;
  readonly duration: number;
  readonly ease: (x: number) => number;
}

/**
 * The pointer's wake: one tapering line trailing the mouse, above the header
 * and the dock, under the viewer's dialog (the top layer). Mouse only; nothing
 * on touch, under reduced motion, in forced colours or in print, and nothing
 * at all while prerendering.
 */
@Component({
  selector: 'app-thread',
  template: `<canvas #canvas class="thread" aria-hidden="true"></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThreadComponent {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly document = inject(DOCUMENT);
  private readonly frames = inject(FrameLoopService);
  private readonly motion = inject(ReducedMotionService);
  private readonly active = inject(WorldStore);

  private readonly trail = new ThreadTrail();
  private readonly ready = signal(false);
  private readonly fine = signal(false);
  private surface: ThreadSurface | null = null;
  private looks: Record<WorldKey, ThreadLook> | null = null;
  private sweep: RunningSweep | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const canvas = this.canvas().nativeElement;
      const view = this.document.defaultView;
      const surface = canvas.getContext('2d');
      if (!surface || !view || typeof view.ResizeObserver !== 'function') return;
      this.surface = surface;

      const style = view.getComputedStyle(this.document.documentElement);
      const look = (world: WorldKey): ThreadLook => ({
        ink: style.getPropertyValue(`--thread-ink-${world}`).trim(),
        alpha: parseFloat(style.getPropertyValue(`--thread-alpha-${world}`)),
        width: parseFloat(style.getPropertyValue(`--thread-width-${world}`)),
      });
      this.looks = { dev: look('dev'), cgi: look('cgi') };

      const fit = () => {
        const store = this.trail.resize(
          canvas.clientWidth,
          canvas.clientHeight,
          view.devicePixelRatio,
        );
        canvas.width = store.width;
        canvas.height = store.height;
      };
      const observer = new view.ResizeObserver(fit);
      observer.observe(canvas);

      // Moving the window to another screen changes the pixel ratio and not
      // the size, which the observer does not report. The query is for the
      // current ratio, so it is rebuilt each time it stops matching.
      let density: MediaQueryList | undefined;
      const watchDensity = () => {
        density?.removeEventListener('change', onDensity);
        density = view.matchMedia(`(resolution: ${view.devicePixelRatio}dppx)`);
        density.addEventListener('change', onDensity);
      };
      const onDensity = () => {
        fit();
        watchDensity();
      };
      watchDensity();

      const fine = view.matchMedia(FINE_POINTER);
      const followFine = () => this.fine.set(fine.matches);
      followFine();
      fine.addEventListener('change', followFine);

      const root = this.document.documentElement;
      const move = (event: PointerEvent) => {
        if (event.pointerType === 'mouse') this.trail.move(event.clientX, event.clientY);
      };
      const leave = () => this.trail.leave();
      const hide = () => {
        if (this.document.hidden) this.trail.reset(surface);
      };
      view.addEventListener('pointermove', move, { passive: true });
      view.addEventListener('blur', leave);
      root.addEventListener('pointerleave', leave);
      this.document.addEventListener('visibilitychange', hide);

      destroyRef.onDestroy(() => {
        observer.disconnect();
        density?.removeEventListener('change', onDensity);
        fine.removeEventListener('change', followFine);
        view.removeEventListener('pointermove', move);
        view.removeEventListener('blur', leave);
        root.removeEventListener('pointerleave', leave);
        this.document.removeEventListener('visibilitychange', hide);
      });
      this.ready.set(true);
    });

    effect((onCleanup) => {
      if (!this.ready() || !this.fine() || this.motion.reduced()) return;
      const surface = this.surface;
      const looks = this.looks;
      if (!surface || !looks) return;
      onCleanup(this.frames.add((_time, delta) => this.frame(surface, looks, delta)));
      onCleanup(() => this.trail.reset(surface));
    });
  }

  private frame(surface: ThreadSurface, looks: Record<WorldKey, ThreadLook>, delta: number): void {
    if (this.trail.idle) return;
    if (!this.trail.width || this.document.querySelector('dialog[open]')) {
      if (this.trail.drawn || this.trail.presence) this.trail.reset(surface);
      return;
    }
    const sweep = this.runningSweep();
    if (!sweep) {
      this.trail.tick(surface, delta, looks[this.active.world()], null);
      return;
    }
    const time = Number(sweep.animation.currentTime ?? 0);
    const progress = sweep.ease(Math.min(1, Math.max(0, time / sweep.duration)));
    const from: WorldKey = sweep.to === 'cgi' ? 'dev' : 'cgi';
    this.trail.tick(surface, delta, looks[from], {
      to: sweep.to,
      progress,
      covered: looks[sweep.to],
    });
  }

  /**
   * The dev ↔ cgi sweep is a view transition: its band is the transition's
   * ground, uncovered as the old page's snapshot is clipped away, so its
   * leading edge is that clip, read from the running animation. The contact
   * wipe paints the band in ink, not a world's ground: the thread keeps its
   * colour there.
   */
  private runningSweep(): RunningSweep | null {
    const vt = this.document.documentElement.dataset['vt'];
    if (vt !== 'sweep-dev' && vt !== 'sweep-cgi') {
      this.sweep = null;
      return null;
    }
    const to: WorldKey = vt === 'sweep-cgi' ? 'cgi' : 'dev';
    // A Back during the band starts the opposite sweep at once and cancels
    // the first one: its animation goes idle, its currentTime null.
    if (this.sweep && (this.sweep.to !== to || this.sweep.animation.playState === 'idle')) {
      this.sweep = null;
    }
    if (this.sweep || typeof KeyframeEffect === 'undefined') return this.sweep;
    // The pseudo-elements' animations exist only once the transition is ready.
    for (const animation of this.document.getAnimations()) {
      const effect = animation.effect;
      if (!(effect instanceof KeyframeEffect) || effect.pseudoElement !== SWEPT_SNAPSHOT) continue;
      if (animation.playState === 'idle') continue;
      const duration = Number(effect.getTiming().duration);
      if (!duration) return null;
      this.sweep = {
        animation,
        to,
        duration,
        // A CSS animation's timing function applies per keyframe, not to the effect.
        ease: easingOf(effect.getKeyframes()[0]?.easing),
      };
      break;
    }
    return this.sweep;
  }
}
