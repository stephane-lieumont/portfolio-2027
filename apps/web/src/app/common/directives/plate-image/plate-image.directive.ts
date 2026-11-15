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

import { ReducedMotionService } from '@core/services/motion/reduced-motion.service';

/** The arrival of a picture: leaves gently, lands softly (traps.md: never y=1 at the start). */
export const EASE_ARRIVE = 'cubic-bezier(0.45, 0, 0.25, 1)';

const ARRIVAL_MS = { wall: 800, viewer: 400 } as const;

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
 * Turns lazy images to eager a viewport and a half ahead of the scroll, at low
 * priority, so they are decoded before they arrive instead of as they do.
 */
@Injectable({ providedIn: 'root' })
export class PlateWarmer {
  private readonly view = inject(DOCUMENT).defaultView;
  private observer: IntersectionObserver | null = null;

  warm(img: HTMLImageElement): () => void {
    if (typeof this.view?.IntersectionObserver !== 'function') return () => undefined;
    this.observer ??= new this.view.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLImageElement;
          this.observer?.unobserve(target);
          target.fetchPriority = 'low';
          target.loading = 'eager';
        }
      },
      { rootMargin: '150% 0px' },
    );
    this.observer.observe(img);
    return () => this.observer?.unobserve(img);
  }
}

/**
 * An image on its plate: the frame (`.plate`) shows the picture's mean colour
 * while it loads, the picture fades in once decoded, and a failure shows the
 * alt text on the world's neutral plate instead of a broken icon. States are
 * `data-plate` on the frame (src/styles/_plate.scss). Nothing happens while
 * prerendering, and an image already decoded at hydration just stays.
 */
@Directive({
  selector: 'img[appPlate]',
  host: { '(error)': 'retry()' },
})
export class PlateImageDirective {
  readonly kind = input<'wall' | 'viewer'>('wall', { alias: 'appPlate' });

  private readonly img = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;
  private readonly motion = inject(ReducedMotionService);

  constructor() {
    const warmer = inject(PlateWarmer);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const img = this.img;
      const plate = img.closest<HTMLElement>('.plate');
      if (!plate) return;
      if (img.complete && img.naturalWidth > 0) {
        plate.dataset['plate'] = 'ready';
        void painted(img);
        return;
      }
      if (img.complete && !img.hasAttribute('srcset')) {
        plate.dataset['plate'] = 'error';
        return;
      }
      // Failed before hydration: the derivative, retried as the original.
      if (img.complete) this.retry();
      plate.dataset['plate'] = 'loading';
      if (img.loading === 'lazy') destroyRef.onDestroy(warmer.warm(img));
      void painted(img).then((ok) => {
        plate.dataset['plate'] = ok ? 'ready' : 'error';
        if (ok && !img.closest('[data-reveal="pending"]')) this.arrive();
      });
    });
  }

  /** A failed derivative falls back to the original `src`; browsers never do it alone. */
  protected retry(): void {
    if (!this.img.hasAttribute('srcset')) return;
    this.img.removeAttribute('srcset');
    this.img.removeAttribute('sizes');
  }

  private arrive(): void {
    if (typeof this.img.animate !== 'function') return;
    const reduced = this.motion.reduced();
    this.img.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: reduced ? 200 : ARRIVAL_MS[this.kind()],
      easing: reduced ? 'linear' : EASE_ARRIVE,
    });
  }
}
