import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

import type { ToolView } from '../../../../core/data/tool-marks';
import { ReducedMotionService } from '../../../../core/services/motion/reduced-motion.service';
import { SmoothScrollService } from '../../../../core/services/motion/smooth-scroll.service';
import { PlateImageDirective } from '../../../../common/directives/plate-image/plate-image.directive';
import {
  EASE_CUT,
  EASE_SETTLE,
  diagonalCut,
} from '../../../../common/directives/world-reveal/world-reveal.directive';

export interface ViewerPiece {
  readonly slug: string;
  readonly title: string;
  readonly year: string;
  readonly alt: string;
  readonly src: string;
  readonly srcset: string;
  /** The picture's mean colour, on its plate while it loads. */
  readonly tone: string | undefined;
  readonly width: number;
  readonly height: number;
  readonly tools: readonly ToolView[];
}

export const PLATE = 'lb-plate';

const pad = (n: number): string => String(n).padStart(2, '0');

/** Where a key takes the viewer from `index` among `count`, with the direction it travels. */
export function keyStep(key: string, index: number, count: number): [number, 1 | -1] | null {
  switch (key) {
    case 'ArrowLeft':
      return [index - 1, -1];
    case 'ArrowRight':
      return [index + 1, 1];
    case 'Home':
      return [0, -1];
    case 'End':
      return [count - 1, 1];
    default:
      return null;
  }
}

/**
 * The 3D viewer: a native modal dialog showing one render at a time on a 16:9
 * plate. The entering render cuts in along the sweep's diagonal while the
 * leaving one drifts and darkens (the mockup's values). Arrows, Home and End on
 * the plate, a swipe, the ticks and the two buttons all step; Escape closes.
 * The page under it does not scroll: Lenis is held and the root's overflow is
 * clipped (src/styles/_world-page.scss).
 *
 * The URL belongs to the mosaic: this component only says what the visitor
 * asked for (`moved`, `closing`), and shows what it is told to.
 */
@Component({
  selector: 'app-art-viewer',
  imports: [PlateImageDirective],
  templateUrl: './art-viewer.component.html',
  styleUrl: './art-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArtViewerComponent {
  readonly pieces = input.required<readonly ViewerPiece[]>();
  /** The visitor stepped to another piece. */
  readonly moved = output<number>();
  /** The visitor asked to close: Escape, the button. */
  readonly closing = output<void>();

  protected readonly index = signal(0);
  protected readonly piece = computed(() => this.pieces()[this.index()]);
  protected readonly now = computed(() => pad(this.index() + 1));
  protected readonly total = computed(() => pad(this.pieces().length));
  protected readonly status = signal('');
  /**
   * The slides whose image is in the page: the one shown and its neighbours,
   * fetched as the viewer moves (three requests on opening), kept once fetched.
   */
  protected readonly warmed = signal<ReadonlySet<number>>(new Set());

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly caption = viewChild.required<ElementRef<HTMLElement>>('caption');
  private readonly counter = viewChild.required<ElementRef<HTMLElement>>('counter');
  private readonly injector = inject(Injector);
  private readonly view = inject(DOCUMENT).defaultView;
  private readonly motion = inject(ReducedMotionService);
  private readonly smooth = inject(SmoothScrollService);

  private busy = false;
  private hiding = false;
  private paused = false;
  private queued: number | null = null;
  private swipeX: number | null = null;

  get isOpen(): boolean {
    return this.dialog().nativeElement.open;
  }

  /** The piece on screen. */
  get current(): number {
    return this.index();
  }

  /**
   * Opens on piece `at`. The plate on screen carries the morph's name for as
   * long as the viewer is open, so whatever closes it — the button, Escape,
   * Back — morphs it back into its tile.
   */
  show(at: number): void {
    const dialog = this.dialog().nativeElement;
    this.jump(at);
    if (!dialog.open) {
      if (!this.paused) {
        this.paused = true;
        this.smooth.pause();
      }
      dialog.showModal();
      // Not `autofocus`: in a closed dialog it is processed at page load, and
      // the browser reports it blocked.
      this.stage().nativeElement.focus();
    }
  }

  /** Closes. Returns the index it was showing. */
  hide(): number {
    const dialog = this.dialog().nativeElement;
    if (dialog.open) {
      this.hiding = true;
      dialog.close();
      this.hiding = false;
    }
    this.release();
    return this.index();
  }

  /**
   * Any close this component did not ask for (a native close that skips
   * `cancel`): the page gets its scrolling back and the address follows.
   */
  protected onClose(): void {
    if (this.hiding) return;
    this.release();
    this.closing.emit();
  }

  private release(): void {
    for (const slide of this.slides()) slide.style.viewTransitionName = '';
    if (this.paused) {
      this.paused = false;
      this.smooth.resume();
    }
  }

  /** Shows piece `at` at once, with nothing in flight. */
  jump(at: number): void {
    for (const animation of this.stage().nativeElement.getAnimations({ subtree: true })) {
      animation.cancel();
    }
    this.busy = false;
    this.queued = null;
    this.slides().forEach((slide, k) => {
      slide.classList.toggle('is-current', k === at);
      slide.classList.remove('is-leaving');
      slide.style.zIndex = '';
      slide.style.viewTransitionName = '';
    });
    this.name(this.slides()[at]);
    this.select(at);
  }

  protected step(by: 1 | -1): void {
    this.go(this.index() + by, by);
  }

  protected goTo(to: number): void {
    this.go(to, to > this.index() ? 1 : -1);
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const move = keyStep(event.key, this.index(), this.pieces().length);
    if (!move) return;
    event.preventDefault();
    this.go(...move);
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.closing.emit();
  }

  protected onPointerDown(event: PointerEvent): void {
    this.swipeX = event.clientX;
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.swipeX === null) return;
    const dx = event.clientX - this.swipeX;
    this.swipeX = null;
    if (Math.abs(dx) < 40) return;
    const dir = dx < 0 ? 1 : -1;
    this.go(this.index() + dir, dir);
  }

  private name(slide: HTMLElement | undefined): void {
    if (slide && !this.motion.reduced()) slide.style.viewTransitionName = PLATE;
  }

  private slides(): HTMLElement[] {
    return Array.from(this.stage().nativeElement.querySelectorAll<HTMLElement>('.show__slide'));
  }

  protected tickLabel(index: number, title: string): string {
    return $localize`:@@viewer.tick:Rendu ${index + 1}:position: : ${title}:title:`;
  }

  private select(to: number): void {
    const piece = this.pieces()[to];
    const count = this.pieces().length;
    this.warmed.update((set) => new Set([...set, to, (to + 1) % count, (to - 1 + count) % count]));
    this.index.set(to);
    this.status.set(
      $localize`:@@viewer.status:${to + 1}:position: sur ${count}:count:. ${piece.title}:title:, ${piece.year}:year:`,
    );
    if (this.motion.reduced()) return;
    afterNextRender(
      () => {
        this.counter().nativeElement.animate([{ translate: '0 100%' }, { translate: '0 0' }], {
          duration: 500,
          easing: EASE_SETTLE,
        });
        Array.from(this.caption().nativeElement.children).forEach((part, k) =>
          part.animate(
            [
              { translate: '0 70%', opacity: 0 },
              { translate: '0 0', opacity: 1 },
            ],
            {
              duration: 650,
              delay: 260 + k * 60,
              easing: EASE_SETTLE,
              fill: 'backwards',
            },
          ),
        );
      },
      { injector: this.injector },
    );
  }

  private async go(target: number, dir: 1 | -1): Promise<void> {
    const count = this.pieces().length;
    const to = ((target % count) + count) % count;
    const from = this.index();
    if (to === from) return;
    if (this.busy) {
      this.queued = to;
      return;
    }
    this.busy = true;
    this.select(to);
    this.moved.emit(to);

    const slides = this.slides();
    const leaving = slides[from];
    const entering = slides[to];
    leaving.classList.replace('is-current', 'is-leaving');
    entering.classList.add('is-current');
    entering.style.zIndex = '2';
    leaving.style.zIndex = '1';
    leaving.style.viewTransitionName = '';
    this.name(entering);
    const inImg = entering.querySelector('img');
    const outImg = leaving.querySelector('img');

    if (this.motion.reduced() || !this.view) {
      await entering
        .animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 })
        .finished.catch(() => undefined);
    } else {
      const [cutFrom, cutTo] = diagonalCut(
        this.stage().nativeElement.clientHeight,
        this.view.innerWidth,
        this.view.innerHeight,
        dir,
      );
      inImg?.animate(
        [
          { scale: 1.1, translate: `${dir * 40}px 0` },
          { scale: 1, translate: '0 0' },
        ],
        {
          duration: 1700,
          easing: EASE_SETTLE,
        },
      );
      outImg?.animate(
        [
          { scale: 1, translate: '0 0', filter: 'brightness(1)' },
          { scale: 1.04, translate: `${-dir * 56}px 0`, filter: 'brightness(0.45)' },
        ],
        { duration: 1100, easing: EASE_CUT, fill: 'forwards' },
      );
      await entering
        .animate([{ clipPath: cutFrom }, { clipPath: cutTo }], { duration: 1100, easing: EASE_CUT })
        .finished.catch(() => undefined);
    }

    leaving.classList.remove('is-leaving');
    leaving.style.zIndex = '';
    entering.style.zIndex = '';
    outImg?.getAnimations().forEach((animation) => animation.cancel());
    this.busy = false;
    if (this.queued !== null) {
      const next = this.queued;
      this.queued = null;
      void this.go(next, next > this.index() ? 1 : -1);
    }
  }
}
