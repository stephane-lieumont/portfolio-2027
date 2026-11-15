import { DOCUMENT, DestroyRef, Injectable, inject } from '@angular/core';

/** `time` is the frame's timestamp, `delta` the milliseconds since the last one, capped. */
export type FrameCallback = (time: number, delta: number) => void;

// A frame after a stall (a long task, a GC pause) is not a reason to teleport
// everything that moves by the time it lost.
const MAX_DELTA = 64;

/**
 * The site's one requestAnimationFrame owner (ADR-0013): Lenis and every canvas
 * subscribe here instead of running loops of their own. The loop runs only
 * while someone listens and the tab is visible — a hidden tab gets no frames
 * anyway, and a loop with no subscribers is battery spent on nothing.
 */
@Injectable({ providedIn: 'root' })
export class FrameLoopService {
  private readonly document = inject(DOCUMENT);
  private readonly callbacks = new Set<FrameCallback>();
  private handle: number | null = null;
  private last: number | null = null;

  constructor() {
    const sync = () => this.sync();
    this.document.addEventListener('visibilitychange', sync);
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('visibilitychange', sync);
      this.callbacks.clear();
      this.sync();
    });
  }

  get running(): boolean {
    return this.handle !== null;
  }

  /** Returns the unsubscribe. */
  add(callback: FrameCallback): () => void {
    this.callbacks.add(callback);
    this.sync();
    return () => {
      this.callbacks.delete(callback);
      this.sync();
    };
  }

  private sync(): void {
    const view = this.document.defaultView;
    const wanted =
      this.callbacks.size > 0 &&
      this.document.visibilityState === 'visible' &&
      typeof view?.requestAnimationFrame === 'function';

    if (wanted && this.handle === null) {
      this.last = null;
      this.handle = view.requestAnimationFrame(this.tick);
    } else if (!wanted && this.handle !== null) {
      view?.cancelAnimationFrame(this.handle);
      this.handle = null;
    }
  }

  private readonly tick = (time: number): void => {
    const delta = this.last === null ? 0 : Math.min(MAX_DELTA, time - this.last);
    this.last = time;
    this.handle = this.document.defaultView?.requestAnimationFrame(this.tick) ?? null;
    for (const callback of this.callbacks) callback(time, delta);
  };
}
