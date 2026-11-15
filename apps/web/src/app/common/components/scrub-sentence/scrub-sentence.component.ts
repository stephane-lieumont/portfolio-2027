import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';

import { ReducedMotionService } from '@core/services/motion/reduced-motion/reduced-motion.service';

/**
 * Where a sentence starts and stops lighting, as shares of the viewport's
 * height, and how much of its own height the ramp adds.
 */
export interface ScrubRamp {
  readonly start: number;
  readonly end: number;
  readonly height: number;
}

/**
 * The world pages' ramp. The mockup started at 85%; the hero now scales with
 * the viewport's height, the sentence sits higher, and 85% painted it half lit
 * at load on a laptop. 68% keeps the first paint about a fifth lit and the end
 * of the ramp where it was.
 */
export const HERO_RAMP: ScrubRamp = { start: 0.68, end: 0.35, height: 0.6 };

/** The project page's, as on its prototype: the sentence sits below the fold. */
export const BODY_RAMP: ScrubRamp = { start: 0.85, end: 0.4, height: 0.5 };

/**
 * How lit each word is, in [0, 1], for a sentence whose top edge sits at
 * `top` with a box `height` tall in a viewport `viewport` tall.
 */
export function scrubLevels(
  words: number,
  top: number,
  height: number,
  viewport: number,
  reduced: boolean,
  ramp: ScrubRamp = HERO_RAMP,
): number[] {
  const start = viewport * ramp.start;
  const end = viewport * ramp.end;
  const progress = reduced
    ? 1
    : Math.min(1, Math.max(0, (start - top) / (start - end + height * ramp.height)));
  return Array.from({ length: words }, (_, i) => Math.min(1, Math.max(0, progress * words - i)));
}

/**
 * The large sentence coloured word by word on scroll (spec 07 §15). A word not
 * yet reached is drawn at 55% of the ink mixed into the ground, so the whole
 * sentence reads at rest and with no script; scrolling only takes it to full ink.
 * The level is written straight onto each word's style: a scroll-linked value
 * has no business going through change detection.
 */
@Component({
  selector: 'app-scrub-sentence',
  template: `@for (word of words(); track $index) {
    <span>{{ word }}</span
    >{{ ' ' }}
  }`,
  styles: `
    :host {
      display: block;
      margin: 0;
      font-family: var(--font-sans);
      font-size: clamp(22px, min(2.6vw, 3.7svh), 36px);
      line-height: 1.16;
      letter-spacing: -0.01em;
      font-weight: 500;
      text-wrap: pretty;
    }
    span {
      color: color-mix(
        in srgb,
        var(--world-ink) calc(var(--lit, 0) * 45% + 55%),
        var(--world-ground)
      );
    }
  `,
  host: { class: 'scrub' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrubSentenceComponent {
  readonly text = input.required<string>();
  readonly ramp = input<ScrubRamp>(HERO_RAMP);

  protected readonly words = computed(() => this.text().split(/\s+/));

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(ReducedMotionService);

  constructor() {
    const document = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);
    let update = () => undefined as void;

    afterNextRender(() => {
      const view = document.defaultView;
      if (!view) return;
      let queued = false;
      update = () => {
        queued = false;
        const spans = this.host.querySelectorAll('span');
        const rect = this.host.getBoundingClientRect();
        const levels = scrubLevels(
          spans.length,
          rect.top,
          rect.height,
          view.innerHeight,
          this.motion.reduced(),
          this.ramp(),
        );
        spans.forEach((span, i) => span.style.setProperty('--lit', levels[i].toFixed(3)));
      };
      const schedule = () => {
        if (queued) return;
        queued = true;
        view.requestAnimationFrame(update);
      };
      view.addEventListener('scroll', schedule, { passive: true });
      view.addEventListener('resize', schedule);
      update();
      destroyRef.onDestroy(() => {
        view.removeEventListener('scroll', schedule);
        view.removeEventListener('resize', schedule);
      });
    });

    effect(() => {
      this.motion.reduced();
      update();
    });
  }
}
