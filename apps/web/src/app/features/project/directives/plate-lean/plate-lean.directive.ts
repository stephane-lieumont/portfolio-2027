import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';

import { SWEEP_LEAN } from '../../../../common/directives/world-reveal/world-reveal.directive';

/**
 * How far the plate's left edge leans, in px: the sweep's angle at the
 * viewport's aspect across the plate's height, so the cut stays parallel to
 * the sweep on every screen. Capped at 22% of its width on a tall phone.
 */
export function plateLean(
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
): number {
  return Math.min((height * SWEEP_LEAN * viewportWidth) / viewportHeight, width * 0.22);
}

/**
 * Keeps `--lean` on the plate's ground, read by its clip-path and by its
 * entrance (src/styles/_project-page.scss). Prerendered with the stylesheet's
 * 24px until the browser measures.
 */
@Directive({ selector: '[appPlateLean]' })
export class PlateLeanDirective {
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const view = element.ownerDocument.defaultView;
      if (!view) return;
      const update = () => {
        const lean = plateLean(
          element.clientWidth,
          element.clientHeight,
          view.innerWidth,
          view.innerHeight,
        );
        element.style.setProperty('--lean', `${lean.toFixed(1)}px`);
      };
      update();
      view.addEventListener('resize', update, { passive: true });
      const observer =
        typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(update) : null;
      observer?.observe(element);
      destroyRef.onDestroy(() => {
        view.removeEventListener('resize', update);
        observer?.disconnect();
      });
    });
  }
}
