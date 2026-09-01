import { DOCUMENT, Directive, ElementRef, effect, inject, signal } from '@angular/core';

/**
 * Watches a zero-height sentinel placed at the top of the document and reports
 * whether it has scrolled out of view.
 *
 * An IntersectionObserver rather than a scroll listener: the browser does the
 * work off the main thread and reports a boundary crossing instead of a
 * position, which is the only thing the header needs to know. A scroll handler
 * would fire on every frame to answer the same question.
 */
@Directive({ selector: '[appScrollSentinel]', exportAs: 'appScrollSentinel' })
export class ScrollSentinel {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);

  readonly passed = signal(false);

  constructor() {
    const view = this.document.defaultView;

    // No IntersectionObserver — server render, or an engine without it. The
    // header then keeps its resting state, which is a complete design rather
    // than a broken one.
    if (!view || typeof view.IntersectionObserver !== 'function') return;

    const observer = new view.IntersectionObserver(
      ([entry]) => this.passed.set(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(this.element.nativeElement);

    effect((onCleanup) => {
      onCleanup(() => observer.disconnect());
    });
  }
}
