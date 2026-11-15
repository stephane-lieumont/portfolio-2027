import { DOCUMENT, DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import type Lenis from 'lenis';

import { FrameLoopService } from './frame-loop.service';
import { ReducedMotionService } from './reduced-motion.service';

/**
 * Wheel smoothing with Lenis, under ADR-0013's rules: it drives the native
 * scroll position, it is created in the browser after the first render only,
 * it ticks on the shared frame loop, and it does not exist while the visitor
 * asks for reduced motion — destroyed and recreated as that preference changes.
 *
 * Lenis is imported on demand, so its weight stays out of the initial bundle.
 */
@Injectable({ providedIn: 'root' })
export class SmoothScrollService {
  private readonly view = inject(DOCUMENT).defaultView;
  private readonly frames = inject(FrameLoopService);
  private readonly motion = inject(ReducedMotionService);

  private readonly enabled = signal(false);
  private lenis: Lenis | null = null;
  private stopTicking: (() => void) | null = null;
  private pauses = 0;
  private generation = 0;

  constructor() {
    effect(() => {
      if (this.enabled() && !this.motion.reduced()) void this.create();
      else this.destroy();
    });
    inject(DestroyRef).onDestroy(() => this.destroy());
  }

  get active(): boolean {
    return this.lenis !== null;
  }

  /** Call from afterNextRender: never during prerendering. */
  enable(): void {
    this.enabled.set(true);
  }

  /** For a modal dialog: the page under it must not move. Calls nest. */
  pause(): void {
    this.pauses += 1;
    this.lenis?.stop();
  }

  resume(): void {
    this.pauses = Math.max(0, this.pauses - 1);
    if (this.pauses === 0) this.lenis?.start();
  }

  /**
   * Goes to `y` with no easing — the jump to the top under a page transition.
   * Without Lenis the browser's own scroll does it; with Lenis both must agree,
   * or an easing still in flight drags the page back where it was.
   */
  jumpTo(y: number): void {
    if (this.lenis) this.lenis.scrollTo(y, { immediate: true, force: true });
    else this.view?.scrollTo({ top: y, behavior: 'instant' });
  }

  /** Drops any easing in flight and settles where the page is now. */
  settle(): void {
    if (this.lenis && this.view) {
      this.lenis.scrollTo(this.view.scrollY, { immediate: true, force: true });
    }
  }

  private async create(): Promise<void> {
    // Lenis measures the page with a ResizeObserver; without one it throws,
    // and native scrolling is the right answer anyway.
    if (this.lenis || typeof this.view?.ResizeObserver !== 'function') return;
    const generation = ++this.generation;
    const { default: LenisClass } = await import('lenis');
    // The preference may have changed while the chunk was on its way.
    if (generation !== this.generation || this.lenis) return;

    const lenis = new LenisClass({ lerp: 0.12, smoothWheel: true, syncTouch: false });
    if (this.pauses > 0) lenis.stop();
    this.lenis = lenis;
    this.stopTicking = this.frames.add((time) => lenis.raf(time));
  }

  private destroy(): void {
    this.generation += 1;
    this.stopTicking?.();
    this.stopTicking = null;
    this.lenis?.destroy();
    this.lenis = null;
  }
}
