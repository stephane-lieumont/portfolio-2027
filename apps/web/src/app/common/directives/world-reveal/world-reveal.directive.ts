import {
  DOCUMENT,
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  afterNextRender,
  inject,
  input,
} from '@angular/core';

import { isPainted, painted } from '@common/directives/plate-image/plate-image.directive';
import { ReducedMotionService } from '@core/services/motion/reduced-motion/reduced-motion.service';

/** The sweep's lean: 20% of the viewport width across the viewport height. */
export const SWEEP_LEAN = 0.2;

export const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const EASE_CUT = 'cubic-bezier(0.76, 0, 0.24, 1)';
export const EASE_SETTLE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * A diagonal cut across a box `height` tall, leaning like the sweep. `dir` 1
 * enters from the right edge, -1 from the left. Returns [from, to] polygons.
 */
export function diagonalCut(
  height: number,
  viewportWidth: number,
  viewportHeight: number,
  dir: 1 | -1,
): [string, string] {
  const lean = (height * SWEEP_LEAN * viewportWidth) / viewportHeight;
  const from =
    dir === 1
      ? `polygon(calc(100% + ${lean}px) 0, calc(100% + ${lean}px) 0, 100% 100%, 100% 100%)`
      : `polygon(0 0, 0 0, -${lean}px 100%, -${lean}px 100%)`;
  return [from, `polygon(0 0, calc(100% + ${lean}px) 0, 100% 100%, -${lean}px 100%)`];
}

/**
 * - `lines`: its children rise 12px, 60ms apart.
 * - `ruled`: the same, and its hairline draws (the stack head, the mastery panel).
 * - `row`: a project's picture, or a client's logo, cuts in along the diagonal.
 * - `tile`: a render fades in from a slight zoom.
 */
export type RevealKind = 'lines' | 'ruled' | 'row' | 'tile';

type Run = (k: number) => void;

/** How long something on screen may stay hidden, at worst. */
export const SAFETY_MS = 2000;

/**
 * One observer for every reveal on the page, so what enters together staggers
 * together (the mockup's `k`).
 */
@Injectable({ providedIn: 'root' })
export class RevealQueue {
  private readonly view = inject(DOCUMENT).defaultView;
  private readonly runs = new Map<Element, Run>();
  private observer: IntersectionObserver | null = null;
  private sweep: ReturnType<typeof setInterval> | null = null;

  watch(element: Element, run: Run): boolean {
    const view = this.view;
    if (typeof view?.IntersectionObserver !== 'function') return false;
    this.observer ??= new view.IntersectionObserver(
      (entries) => {
        let k = 0;
        for (const entry of entries) {
          if (entry.isIntersecting) this.release(entry.target, k++);
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    this.runs.set(element, run);
    this.observer.observe(element);
    // A safety net: whatever is on screen and still waiting after 2s is shown,
    // whatever the observer did or did not report. Content never stays hidden.
    this.sweep ??= setInterval(() => {
      let k = 0;
      for (const pending of [...this.runs.keys()]) {
        const rect = pending.getBoundingClientRect();
        if (rect.top < view.innerHeight && rect.bottom > 0) this.release(pending, k++);
      }
    }, SAFETY_MS);
    return true;
  }

  forget(element: Element): void {
    this.observer?.unobserve(element);
    this.runs.delete(element);
    if (this.runs.size === 0 && this.sweep !== null) {
      clearInterval(this.sweep);
      this.sweep = null;
    }
  }

  private release(element: Element, k: number): void {
    const run = this.runs.get(element);
    this.forget(element);
    run?.(k);
  }
}

/**
 * The mockup's scroll reveal. Only what starts below the fold at render takes
 * the hidden state (`data-reveal="pending"`), so it never fights the hero's
 * entrance and the prerendered page shows everything until script runs. The
 * hidden state is styled in src/styles/_world-page.scss, under `js-motion`.
 */
@Directive({ selector: '[appWorldReveal]' })
export class WorldRevealDirective {
  readonly kind = input.required<RevealKind>({ alias: 'appWorldReveal' });

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const queue = inject(RevealQueue);
    const motion = inject(ReducedMotionService);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const view = element.ownerDocument.defaultView;
      if (!view || motion.reduced()) return;
      if (!element.ownerDocument.documentElement.classList.contains('js-motion')) return;
      if (element.getBoundingClientRect().top <= view.innerHeight) return;
      const watching = queue.watch(element, (k) => this.reveal(element, view, k));
      if (!watching) return;
      element.dataset['reveal'] = 'pending';
      destroyRef.onDestroy(() => queue.forget(element));
    });
  }

  private reveal(element: HTMLElement, view: Window, k: number): void {
    const kind = this.kind();
    // A client reference's logo is a mask on its plate, drawn as soon as it
    // is styled: it cuts in like a picture, with nothing to wait for.
    const img =
      kind === 'tile' || kind === 'row'
        ? element.querySelector<HTMLImageElement | HTMLElement>('img, .row__logo')
        : null;
    if (img) {
      // Never an empty box arriving: the picture plays once it is decoded. The
      // stagger only holds between pictures that were all ready at once.
      const picture = img instanceof HTMLImageElement ? img : null;
      const ready = picture ? isPainted(picture) : true;
      void (picture ? painted(picture) : Promise.resolve(true)).then((ok) => {
        delete element.dataset['reveal'];
        if (!ok || typeof img.animate !== 'function') return;
        if (kind === 'tile') this.revealTile(img, ready ? k * 110 : 0);
        else this.revealRow(img, view, ready ? k * 80 : 0);
      });
      return;
    }
    if (kind === 'tile' || kind === 'row') {
      delete element.dataset['reveal'];
      return;
    }
    element.dataset['reveal'] = 'running';
    const parts = Array.from(element.querySelectorAll<HTMLElement>('[data-reveal-part]'));
    const runs = (parts.length ? parts : Array.from(element.children)).map((part, i) =>
      part.animate(
        [
          { transform: 'translateY(12px)', opacity: 0 },
          { transform: 'none', opacity: 1 },
        ],
        {
          duration: 520,
          delay: 120 + i * 60,
          easing: EASE_OUT,
          fill: 'backwards',
        },
      ),
    );
    if (kind === 'ruled') {
      runs.push(
        element.animate([{ backgroundSize: '0% 1px' }, { backgroundSize: '100% 1px' }], {
          duration: 900,
          easing: EASE_SETTLE,
          fill: 'forwards',
        }),
      );
    }
    Promise.allSettled(runs.map((run) => run.finished)).then(() => {
      delete element.dataset['reveal'];
      runs.forEach((run) => run.cancel());
    });
  }

  // The mockup's tile reveal exactly: one animation, fade and settle together.
  private revealTile(img: HTMLElement, delay: number): void {
    img.animate(
      [
        { opacity: 0, scale: 1.06 },
        { opacity: 1, scale: 1 },
      ],
      { duration: 1300, delay, easing: EASE_SETTLE, fill: 'backwards' },
    );
  }

  private revealRow(img: HTMLElement, view: Window, delay: number): void {
    const [from, to] = diagonalCut(img.clientHeight, view.innerWidth, view.innerHeight, -1);
    const timing = { delay, fill: 'backwards' } as const;
    img.animate([{ clipPath: from }, { clipPath: to }], {
      ...timing,
      duration: 900,
      easing: EASE_CUT,
    });
    img.animate([{ scale: 1.04 }, { scale: 1 }], {
      ...timing,
      duration: 1400,
      easing: EASE_SETTLE,
    });
  }
}
