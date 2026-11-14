import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Coerces the stagger index, defaulting anything unusable to 0.
 *
 * `numberAttribute` cannot be used here: a bare `appReveal` with no value
 * arrives as the empty string, which it turns into `NaN`. That reaches the
 * stylesheet as `calc(NaN * 100ms)` — an invalid declaration, so the element
 * loses its transition delay entirely. Every un-indexed reveal on the site was
 * in that state, and nothing errored.
 */
function staggerIndex(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Reveals an element the first time it enters the viewport.
 *
 * Carried over from the 2022 site, which did it with a scroll listener that
 * read `offsetTop` and `window.pageYOffset` on every scroll event and
 * recomputed three section positions in a React effect. That is a forced
 * layout per frame while scrolling, which spec 07 forbids for exactly this
 * reason. An IntersectionObserver does the same job off the main thread and
 * reports once.
 *
 * Once revealed, it stays revealed and the observer disconnects: this is an
 * arrival, not a scroll-linked effect. Scrolling back up to watch a section
 * fade out again is a tic, and the 2022 code went out of its way to avoid it
 * too (`if (!appearSectionSpecialities) setAppear…`).
 *
 * The element is visible with no JavaScript at all: `.reveal` sets the hidden
 * state only when the root carries both `js-motion`, set in the document head,
 * and `data-reveal-ready`, which this directive stamps once it has rendered.
 * Without them — script blocked, observer missing, bootstrap failed — the
 * content is simply there, which is the only acceptable failure mode for a
 * page's own text (spec 07 §4.2).
 *
 * The page is prerendered, so its content is painted before this runs. What
 * is on screen has been seen: it settles where it stands and never drops to
 * hidden. Only what is below the fold takes the hidden state.
 */
@Directive({
  selector: '[appReveal]',
  host: {
    class: 'reveal',
    '[class.reveal--in]': 'shown()',
    '[class.reveal--settled]': 'settled()',
    '[style.--reveal-index]': 'index()',
  },
})
export class Reveal {
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;

  private withinViewport(view: Window): boolean {
    const rect = this.element.getBoundingClientRect();
    return rect.top < view.innerHeight && rect.bottom > 0;
  }

  /** Position in a staggered group. Each step adds one delay unit. */
  readonly index = input(0, { alias: 'appReveal', transform: staggerIndex });

  protected readonly shown = signal(false);
  protected readonly settled = signal(false);

  constructor() {
    // Prerendering stamps nothing and adds no class, so the delivered HTML is
    // readable with no script and matches what the browser starts from.
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    const view = this.element.ownerDocument.defaultView;

    // No observer, no gating: show the content and stop. Never leave a page's
    // own prose behind a capability check.
    if (!view || typeof view.IntersectionObserver !== 'function') {
      this.shown.set(true);
      return;
    }

    const document = this.element.ownerDocument;

    // Measured here, before anything is stamped: a hydrated element is the
    // painted one, while a freshly created one has no box yet and reads as off
    // screen, which is right — nobody has seen it.
    if (this.withinViewport(view)) {
      this.shown.set(true);
      this.settled.set(true);
      return;
    }

    // After the first render, so every settled element already carries its
    // classes when the hidden state starts to apply. Stamped any earlier, the
    // next element's measurement would compute them hidden, and the class
    // arriving afterwards would fade them back in from zero.
    afterNextRender(() => document.documentElement.setAttribute('data-reveal-ready', ''));

    // Two different questions, answered by one observer.
    //
    // On arrival: is this already on screen? If so it belongs to the page's
    // entrance and plays now. The margin below must not apply here — content
    // sitting in the bottom third of the first viewport would wait for a scroll
    // that, on a page short enough not to scroll, never comes. It would simply
    // never appear.
    //
    // Afterwards: has it come properly into view? A third of the viewport, not
    // a sliver. At -10% an element revealed the moment its top edge crossed the
    // fold, so the transition had finished before anyone was looking at it —
    // the animation was there and nobody saw it.
    let arrival = true;

    const observer = new view.IntersectionObserver(
      (entries) => {
        const intersecting = entries.some((entry) => entry.isIntersecting);
        const onScreenNow = arrival && this.withinViewport(view);
        arrival = false;

        if (!intersecting && !onScreenNow) return;
        this.shown.set(true);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -33% 0px' },
    );

    observer.observe(this.element);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
