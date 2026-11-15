import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';

import type { PublicImage } from '../../../../core/data/world-content';
import { InLocalePipe } from '../../../../core/i18n/in-locale.pipe';
import { FrameLoopService } from '../../../../core/services/motion/frame-loop.service';
import { ReducedMotionService } from '../../../../core/services/motion/reduced-motion.service';
import {
  FIGURE_TAU,
  FIGURE_TRAVEL,
  type Offset,
  PLATE_TAU,
  PLATE_TRAVEL,
  approach,
  depthTarget,
  translateOf,
} from './portrait-depth';

const AT_REST: Offset = { x: 0, y: 0 };

/**
 * The cut-out standing on its diagonal plate. On a mouse, the plate swings
 * against the pointer and the figure follows it, each easing at its own pace.
 */
@Component({
  selector: 'app-contact-portrait',
  imports: [NgOptimizedImage, InLocalePipe],
  template: `
    <figure>
      <div #portraitEl class="portrait">
        <span #plateEl class="portrait__plate" aria-hidden="true"></span>
        <div #figureEl class="portrait__mask">
          <img
            class="portrait__img"
            [ngSrc]="image().src"
            [alt]="image().alt | inLocale"
            [width]="image().width"
            [height]="image().height"
            priority
          />
        </div>
      </div>
      <figcaption>{{ caption() }}</figcaption>
    </figure>
  `,
  styleUrl: './contact-portrait.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPortraitComponent {
  readonly image = input.required<PublicImage>();
  readonly caption = input.required<string>();
  /** Where the pointer is followed: the whole contact view, as on the mockup. */
  readonly area = input.required<HTMLElement>();

  private readonly frames = inject(FrameLoopService);
  private readonly reduced = inject(ReducedMotionService).reduced;
  private readonly portrait = viewChild.required<ElementRef<HTMLElement>>('portraitEl');
  private readonly plateEl = viewChild.required<ElementRef<HTMLElement>>('plateEl');
  private readonly figureEl = viewChild.required<ElementRef<HTMLElement>>('figureEl');

  private target: Offset = AT_REST;
  private plate: Offset = AT_REST;
  private figure: Offset = AT_REST;
  private box: DOMRect | null = null;
  private stopDrift: (() => void) | null = null;
  private painted = false;

  constructor() {
    effect(() => {
      if (this.reduced()) this.reset();
    });

    const destroyRef = inject(DestroyRef);
    // Listened to outside the template: a binding there would run change
    // detection on every pointermove, for styles written straight to the DOM.
    afterNextRender(() => {
      const area = this.area();
      const view = area.ownerDocument.defaultView;
      const move = (event: PointerEvent) => this.follow(event);
      const leave = () => this.aim(AT_REST);
      const forget = () => (this.box = null);
      area.addEventListener('pointermove', move);
      area.addEventListener('pointerleave', leave);
      view?.addEventListener('scroll', forget, { passive: true });
      view?.addEventListener('resize', forget, { passive: true });
      destroyRef.onDestroy(() => {
        area.removeEventListener('pointermove', move);
        area.removeEventListener('pointerleave', leave);
        view?.removeEventListener('scroll', forget);
        view?.removeEventListener('resize', forget);
        this.stopDrift?.();
      });
    });
  }

  private follow(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this.box ??= this.portrait().nativeElement.getBoundingClientRect();
    this.aim(depthTarget(event.clientX, event.clientY, this.box));
  }

  private aim(target: Offset): void {
    if (this.reduced()) return;
    this.target = target;
    this.stopDrift ??= this.frames.add((_time, delta) => this.drift(delta || 16));
  }

  private drift(dt: number): void {
    const t = this.target;
    this.plate = {
      x: approach(this.plate.x, t.x, dt, PLATE_TAU),
      y: approach(this.plate.y, t.y, dt, PLATE_TAU),
    };
    this.figure = {
      x: approach(this.figure.x, t.x, dt, FIGURE_TAU),
      y: approach(this.figure.y, t.y, dt, FIGURE_TAU),
    };
    if (Math.abs(t.x - this.plate.x) + Math.abs(t.y - this.plate.y) < 0.001) {
      this.plate = this.figure = t;
      this.stopDrift?.();
      this.stopDrift = null;
    }
    this.painted = true;
    this.plateEl().nativeElement.style.transform = translateOf(this.plate, PLATE_TRAVEL);
    this.figureEl().nativeElement.style.transform = translateOf(this.figure, FIGURE_TRAVEL);
  }

  private reset(): void {
    this.stopDrift?.();
    this.stopDrift = null;
    this.target = this.plate = this.figure = AT_REST;
    this.box = null;
    if (!this.painted) return;
    this.painted = false;
    this.plateEl().nativeElement.style.transform = '';
    this.figureEl().nativeElement.style.transform = '';
  }
}
