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

import { SWEEP_LEAN } from '@common/directives/world-reveal/world-reveal.directive';
import { ReducedMotionService } from '@core/services/motion/reduced-motion/reduced-motion.service';

/** The arrival of a picture: leaves gently, lands softly (traps.md: never y=1 at the start). */
export const EASE_ARRIVE = 'cubic-bezier(0.45, 0, 0.25, 1)';
const EASE_ENTER = 'cubic-bezier(0.33, 0.7, 0.35, 1)';
const EASE_EXIT = 'cubic-bezier(0.6, 0, 0.85, 0.4)';
const EASE_STATE = 'cubic-bezier(0.4, 0.15, 0.3, 1)';

const ARRIVAL_MS = { wall: 510, viewer: 360 } as const;

/**
 * How long a picture may load before the plate says so: most arrive sooner,
 * and an indicator that flashes for a cached picture is noise. The viewer's
 * starts after its 360ms morph, so the morph never captures it.
 */
export const WAIT_DELAY_MS = { wall: 400, viewer: 360 + 400 } as const;
const SWEEP_MS = 2100;
const PULSE_MS = 1200;
const WAIT_ENTER_MS = 255;
const WAIT_EXIT_MS = 180;

/**
 * The band's lean, in degrees: the sweep's diagonal on this viewport
 * (about 20° at 16:9, 5° on a phone held upright).
 */
export function sweepSkew(viewportWidth: number, viewportHeight: number): number {
  return (Math.atan((SWEEP_LEAN * viewportWidth) / viewportHeight) * 180) / Math.PI;
}

/**
 * The band crosses the plate in the first two-thirds of a cycle, then rests
 * off it. Its translation is in its own width, 60% of the plate's: from
 * fully off the left edge to fully off the right one, skew included.
 */
export function sweepKeyframes(skew: number): Keyframe[] {
  const lean = `skewX(${-skew}deg)`;
  const from = `translateX(-140%) ${lean}`;
  const to = `translateX(${100 / 0.6 + 40}%) ${lean}`;
  return [
    { transform: from, offset: 0, easing: EASE_STATE },
    { transform: to, offset: 0.67 },
    { transform: to, offset: 1 },
  ];
}

/**
 * Whether src/styles/_plate.scss already runs `name` on `element` or its
 * ::after: there the stylesheet owns the wait or the arrival, from before
 * the app booted, and a second animation would only fight it.
 */
export function cssRuns(element: Element, name: string): boolean {
  if (typeof element.getAnimations !== 'function' || typeof CSSAnimation !== 'function')
    return false;
  return element
    .getAnimations({ subtree: true })
    .some((run) => run instanceof CSSAnimation && run.animationName === name);
}

const promises = new WeakMap<HTMLImageElement, Promise<boolean>>();
const done = new WeakSet<HTMLImageElement>();

/** Whether `img` has already loaded and decoded, without waiting. */
export function isPainted(img: HTMLImageElement): boolean {
  return done.has(img);
}

/**
 * Resolves once `img` has loaded and decoded (true), or failed (false). One
 * promise per image, so the reveal and the plate wait on the same thing. A
 * decode rejection is not a failure: the image is there, it just could not be
 * decoded off the main thread.
 */
export function painted(img: HTMLImageElement): Promise<boolean> {
  let promise = promises.get(img);
  if (promise) return promise;
  const decode = (): Promise<boolean> =>
    (typeof img.decode === 'function' ? img.decode() : Promise.resolve()).then(
      () => true,
      () => true,
    );
  promise =
    img.complete && img.naturalWidth > 0
      ? decode()
      : new Promise<boolean>((resolve) => {
          const loaded = () => {
            img.removeEventListener('error', failed);
            resolve(decode());
          };
          const failed = () => {
            // A failed derivative is retried as the original (below); only
            // the original failing is a failure.
            if (img.currentSrc && img.currentSrc !== img.src) return;
            img.removeEventListener('load', loaded);
            resolve(false);
          };
          img.addEventListener('load', loaded, { once: true });
          img.addEventListener('error', failed);
        });
  promise.then((ok) => ok && done.add(img));
  promises.set(img, promise);
  return promise;
}

/**
 * Watches the plates for the whole page, one observer for each question:
 * - `warm`: turns lazy images eager a viewport and a half ahead of the
 *   scroll, at low priority, so they are decoded before they arrive;
 * - `watch`: reports whether a plate is on screen, so a loading indicator
 *   only waits, and only moves, while it can be seen.
 */
@Injectable({ providedIn: 'root' })
export class PlateWatch {
  private readonly view = inject(DOCUMENT).defaultView;
  private warmer: IntersectionObserver | null = null;
  private seer: IntersectionObserver | null = null;
  private readonly seen = new Map<Element, (inView: boolean) => void>();

  warm(img: HTMLImageElement): () => void {
    if (typeof this.view?.IntersectionObserver !== 'function') return () => undefined;
    this.warmer ??= new this.view.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLImageElement;
          this.warmer?.unobserve(target);
          target.fetchPriority = 'low';
          target.loading = 'eager';
        }
      },
      { rootMargin: '150% 0px' },
    );
    this.warmer.observe(img);
    return () => this.warmer?.unobserve(img);
  }

  watch(plate: Element, report: (inView: boolean) => void): () => void {
    if (typeof this.view?.IntersectionObserver !== 'function') {
      report(true);
      return () => undefined;
    }
    this.seer ??= new this.view.IntersectionObserver((entries) => {
      for (const entry of entries) this.seen.get(entry.target)?.(entry.isIntersecting);
    });
    this.seen.set(plate, report);
    this.seer.observe(plate);
    return () => {
      this.seen.delete(plate);
      this.seer?.unobserve(plate);
    };
  }
}

/**
 * An image on its plate: the frame (`.plate`) shows the picture's mean colour
 * while it loads, the picture fades in once decoded, and a failure shows the
 * alt text on the world's neutral plate instead of a broken icon. States are
 * `data-plate` on the frame (src/styles/_plate.scss). Nothing happens while
 * prerendering, and an image already decoded at hydration just stays.
 *
 * A picture still loading after WAIT_DELAY_MS, on screen, says so
 * (`data-plate-wait`, spec 07 §16): a band sweeping across a wall plate, three
 * points pulsing in the viewer, a still « Chargement… » under reduced motion.
 * Its animations run on the plate's ::after and pause off screen.
 */
@Directive({
  selector: 'img[appPlate]',
  host: { '(error)': 'retry()' },
})
export class PlateImageDirective {
  readonly kind = input<'wall' | 'viewer'>('wall', { alias: 'appPlate' });

  private readonly img = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;
  private readonly motion = inject(ReducedMotionService);
  private readonly watcher = inject(PlateWatch);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private inView = false;
  private slideWatch: MutationObserver | null = null;
  private waiting: Animation[] = [];
  private unwatch: () => void = () => undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.settle());
    afterNextRender(() => {
      const img = this.img;
      const plate = img.closest<HTMLElement>('.plate');
      if (!plate) return;
      // The head script (index.html) may have settled it before the app booted.
      if (plate.hasAttribute('data-plate-loaded') || (img.complete && img.naturalWidth > 0)) {
        plate.dataset['plate'] = 'ready';
        plate.dataset['plateLoaded'] ??= '';
        void painted(img);
        return;
      }
      if (
        plate.hasAttribute('data-plate-failed') ||
        (img.complete && !img.hasAttribute('srcset'))
      ) {
        plate.dataset['plate'] = 'error';
        return;
      }
      // Failed before hydration: the derivative, retried as the original.
      if (img.complete) this.retry();
      plate.dataset['plate'] = 'loading';
      if (img.loading === 'lazy') destroyRef.onDestroy(this.watcher.warm(img));
      this.unwatch = this.watcher.watch(plate, (inView) => {
        this.inView = inView;
        this.seen(plate);
      });
      // The viewer's slides are all laid out, the hidden ones too, and an
      // observer counts them as on screen: only the current one may wait.
      if (this.kind() === 'viewer' && typeof MutationObserver === 'function') {
        this.slideWatch = new MutationObserver(() => this.seen(plate));
        this.slideWatch.observe(plate, { attributeFilter: ['class'] });
      }
      void painted(img).then(async (ok) => {
        const shown = this.settle();
        if (ok) {
          plate.dataset['plate'] = 'ready';
          plate.dataset['plateLoaded'] ??= '';
          if (!img.closest('[data-reveal="pending"]')) this.arrive();
          return;
        }
        if (shown) await shown;
        plate.dataset['plate'] = 'error';
      });
    });
  }

  /** A failed derivative falls back to the original `src`; browsers never do it alone. */
  protected retry(): void {
    if (!this.img.hasAttribute('srcset')) return;
    this.img.removeAttribute('srcset');
    this.img.removeAttribute('sizes');
  }

  private seen(plate: HTMLElement): void {
    if (plate.dataset['plate'] !== 'loading') return;
    const inView =
      this.inView && (this.kind() !== 'viewer' || plate.classList.contains('is-current'));
    if (this.waiting.length || plate.hasAttribute('data-plate-wait')) {
      for (const run of this.waiting) {
        if (inView) run.play();
        else run.pause();
      }
      return;
    }
    if (!inView) {
      if (this.timer !== null) clearTimeout(this.timer);
      this.timer = null;
      return;
    }
    this.timer ??= setTimeout(() => {
      this.timer = null;
      this.wait(plate);
    }, WAIT_DELAY_MS[this.kind()]);
  }

  private wait(plate: HTMLElement): void {
    if (cssRuns(plate, 'plate-wait-in')) return;
    const reduced = this.motion.reduced();
    const kind = this.kind();
    const canAnimate = typeof plate.animate === 'function';
    if (reduced || !canAnimate) {
      plate.dataset['plateWait'] = 'still';
      return;
    }
    if (kind === 'viewer') {
      plate.dataset['plateWait'] = 'pulse';
      this.waiting = [
        plate.animate(
          [
            { opacity: 0.35, easing: EASE_STATE },
            { opacity: 1, easing: EASE_STATE },
            { opacity: 0.35 },
          ],
          { duration: PULSE_MS, iterations: Infinity, pseudoElement: '::after' },
        ),
      ];
      return;
    }
    plate.dataset['plateWait'] = 'sweep';
    const view = plate.ownerDocument.defaultView;
    const skew = view ? sweepSkew(view.innerWidth, view.innerHeight) : 0;
    this.waiting = [
      plate.animate(sweepKeyframes(skew), {
        duration: SWEEP_MS,
        iterations: Infinity,
        pseudoElement: '::after',
      }),
      plate.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: WAIT_ENTER_MS,
        easing: EASE_ENTER,
        fill: 'forwards',
        pseudoElement: '::after',
      }),
    ];
  }

  /** Stops waiting: the indicator fades from wherever it is, then goes. */
  private settle(): Promise<void> | null {
    this.unwatch();
    this.unwatch = () => undefined;
    this.slideWatch?.disconnect();
    this.slideWatch = null;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    const plate = this.img.closest<HTMLElement>('.plate');
    if (!plate?.hasAttribute('data-plate-wait')) return null;
    const runs = this.waiting;
    this.waiting = [];
    const clear = () => {
      runs.forEach((run) => run.cancel());
      delete plate.dataset['plateWait'];
    };
    if (!runs.length) {
      clear();
      return null;
    }
    const exit = plate.animate([{ opacity: 0 }], {
      duration: WAIT_EXIT_MS,
      easing: EASE_EXIT,
      fill: 'forwards',
      pseudoElement: '::after',
    });
    return exit.finished.then(
      () => {
        clear();
        exit.cancel();
      },
      () => clear(),
    );
  }

  private arrive(): void {
    const img = this.img;
    if (typeof img.animate !== 'function' || cssRuns(img, 'plate-arrive')) return;
    if (this.motion.reduced()) {
      img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'linear' });
      return;
    }
    const kind = this.kind();
    img.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: ARRIVAL_MS[kind],
      easing: EASE_ARRIVE,
    });
    if (kind === 'wall')
      img.animate([{ scale: 1.025 }, { scale: 1 }], {
        duration: ARRIVAL_MS.wall,
        easing: EASE_ENTER,
      });
  }
}
