import { DestroyRef, Directive, ElementRef, inject, input, signal } from '@angular/core';

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
 * state only when the root carries `data-reveal-ready`, which this directive
 * stamps on construction. Without it — script blocked, observer missing — the
 * content is simply there, which is the only acceptable failure mode for a
 * page's own text.
 */
@Directive({
  selector: '[appReveal]',
  host: {
    class: 'reveal',
    '[class.reveal--in]': 'shown()',
    '[style.--reveal-index]': 'index()',
  },
})
export class Reveal {
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;

  /** Position in a staggered group. Each step adds one delay unit. */
  readonly index = input(0, { alias: 'appReveal', transform: staggerIndex });

  protected readonly shown = signal(false);

  constructor() {
    const view = this.element.ownerDocument.defaultView;

    // No observer, no gating: show the content and stop. Never leave a page's
    // own prose behind a capability check.
    if (!view || typeof view.IntersectionObserver !== 'function') {
      this.shown.set(true);
      return;
    }

    this.element.ownerDocument.documentElement.setAttribute('data-reveal-ready', '');

    const observer = new view.IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        this.shown.set(true);
        observer.disconnect();
      },
      // A third of the viewport, not a sliver. At -10% an element revealed the
      // moment its top edge crossed the fold, so by the time it was actually
      // being looked at the transition had already finished — the animation was
      // there and nobody saw it. Pulling the bottom edge up a third means the
      // element has to come properly into view before it moves.
      { rootMargin: '0px 0px -33% 0px' },
    );

    observer.observe(this.element);
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
}
