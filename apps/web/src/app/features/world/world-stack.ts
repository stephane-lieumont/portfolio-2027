import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { WorldStack as WorldStackContent } from '@portfolio/shared-types';

import { toolView } from '../../core/content/tool-marks';
import { ReducedMotion } from '../../core/motion/reduced-motion';
import { EASE_OUT, WorldReveal } from './world-reveal';

const SUBTITLES = {
  dev: $localize`:@@stack.subtitle.dev:Ce avec quoi je travaille`,
  cgi: $localize`:@@stack.subtitle.cgi:Mes logiciels`,
} as const;

/**
 * The marks row and its « Maîtrise » panel, as tabs: one tool chosen at a
 * time (`aria-selected`), its points in the tab panel. Inactive marks dim the
 * icon only: the names stay at full contrast.
 */
@Component({
  selector: 'app-world-stack',
  imports: [WorldReveal],
  templateUrl: './world-stack.html',
  styleUrl: './world-stack.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldStack {
  readonly stack = input.required<WorldStackContent>();

  protected readonly selected = signal(0);
  protected readonly subtitle = computed(() => SUBTITLES[this.stack().world]);
  protected readonly marks = computed(() =>
    this.stack().entries.map((entry) => toolView(entry.tool, 'stack')),
  );

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('markList');
  private readonly injector = inject(Injector);
  private readonly motion = inject(ReducedMotion);

  constructor() {
    const destroyRef = inject(DestroyRef);
    const view = inject(DOCUMENT).defaultView;
    // The marks bubble in once, the first time the row comes into view.
    afterNextRender(() => {
      if (typeof view?.IntersectionObserver !== 'function') return;
      const observer = new view.IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting) return;
          observer.disconnect();
          if (!this.motion.reduced()) this.bubble();
        },
        { threshold: 0.35 },
      );
      observer.observe(this.list().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** Arrows wrap through the marks, Home and End jump; the choice follows focus. */
  protected onKey(event: KeyboardEvent): void {
    const count = this.marks().length;
    const now = this.selected();
    const to =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? (now + 1) % count
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? (now - 1 + count) % count
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? count - 1
              : null;
    if (to === null) return;
    event.preventDefault();
    this.select(to);
    this.list().nativeElement.querySelectorAll<HTMLElement>('[role="tab"]')[to]?.focus();
  }

  protected select(index: number): void {
    if (index === this.selected()) return;
    this.selected.set(index);
    if (this.motion.reduced()) return;
    // The panel keeps its height; only the new name and points arrive.
    afterNextRender(
      () => {
        const box = this.panel().nativeElement;
        box.querySelector('.mastery__name.is-current')?.animate(
          [
            { transform: 'translateY(12px)', opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          { duration: 420, easing: EASE_OUT },
        );
        box.querySelectorAll('.mastery__list.is-current li').forEach((li, n) =>
          li.animate(
            [
              { transform: 'translateY(14px)', opacity: 0 },
              { transform: 'none', opacity: 1 },
            ],
            {
              duration: 480,
              delay: 60 + n * 60,
              easing: EASE_OUT,
              fill: 'backwards',
            },
          ),
        );
      },
      { injector: this.injector },
    );
  }

  private bubble(): void {
    this.list()
      .nativeElement.querySelectorAll('.mark')
      .forEach((mark, i) => {
        // On the wrapper, never on the mask: the mask's own opacity is its
        // dimmed state, and an entrance written over it would end on full
        // colour and snap back to the dim (measured, Stéphane saw it).
        mark.querySelector('.mark__icon')?.animate(
          [
            { transform: 'scale(0)', opacity: 0 },
            { transform: 'scale(1.12)', opacity: 1, offset: 0.6 },
            { transform: 'scale(0.96)', offset: 0.85 },
            { transform: 'scale(1)', opacity: 1 },
          ],
          { duration: 640, delay: i * 70, easing: EASE_OUT, fill: 'backwards' },
        );
        mark.querySelector('.mark__name')?.animate(
          [
            { transform: 'translateY(10px)', opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          { duration: 480, delay: 160 + i * 70, easing: EASE_OUT, fill: 'backwards' },
        );
      });
  }
}
