import { DOCUMENT, DestroyRef, Injectable, inject, signal } from '@angular/core';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * The visitor's motion preference as a signal, live: changing the OS setting
 * with the page open stops the loops and the smooth scrolling at once
 * (spec 07 §11.4). False while prerendering, where nothing moves anyway.
 */
@Injectable({ providedIn: 'root' })
export class ReducedMotion {
  private readonly state = signal(false);
  readonly reduced = this.state.asReadonly();

  constructor() {
    const media = inject(DOCUMENT).defaultView?.matchMedia?.(QUERY);
    if (!media) return;

    this.state.set(media.matches);
    const follow = (event: MediaQueryListEvent) => this.state.set(event.matches);
    media.addEventListener('change', follow);
    inject(DestroyRef).onDestroy(() => media.removeEventListener('change', follow));
  }
}
