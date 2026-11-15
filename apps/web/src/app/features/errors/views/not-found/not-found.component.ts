import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { NAV } from '@core/data/nav-items';
import { ReducedMotionService } from '@core/services/motion/reduced-motion/reduced-motion.service';
import { ButtonComponent } from '@shared/components/kit-ui/button/button.component';

/**
 * The 2022 site's 404, kept at Stéphane's request: Travolta lost, and the
 * intercom line. Prerendered once at /404 and served by nginx with a real 404
 * status (ADR-0005).
 */
@Component({
  selector: 'app-not-found',
  imports: [ButtonComponent, RouterLink],
  template: `
    <article class="not-found">
      <div class="not-found__text">
        <p class="not-found__eyebrow" i18n="@@notFound.eyebrow">Erreur 404 · page introuvable</p>
        <h1 class="not-found__title" i18n="@@notFound.title">Mais où est l’interphone&nbsp;?</h1>
        <p class="not-found__lede" i18n="@@notFound.lede">
          Cette page n’existe pas, ou plus. Le reste du site, lui, est bien là.
        </p>
        <a appButton class="btn" [routerLink]="back" i18n="@@notFound.back"
          >Retour aux réalisations</a
        >
      </div>
      <figure class="not-found__clip">
        <video
          #clip
          [muted]="true"
          loop
          playsinline
          preload="metadata"
          width="490"
          height="476"
          poster="/images/travolta-confused.webp"
          aria-label="John Travolta, perdu, regarde autour de lui."
          i18n-aria-label="@@notFound.clip"
          (play)="playing.set(true)"
          (pause)="playing.set(false)"
        >
          <!-- HEVC first: Safari reads its alpha, and only Safari claims QuickTime. -->
          <source src="/images/travolta-confused.mov" type='video/quicktime; codecs="hvc1"' />
          <source src="/images/travolta-confused.webm" type="video/webm" />
        </video>
        <!-- WCAG 2.2.2: the loop outlasts five seconds. The name says what a
             press does, so it carries no aria-pressed as well: a toggle whose
             name changes with its state reads as a double negative. -->
        <button
          class="not-found__toggle"
          type="button"
          [attr.aria-label]="toggleLabel()"
          (click)="toggle()"
        >
          @if (playing()) {
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>
          } @else {
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
          }
        </button>
      </figure>
    </article>
  `,
  styles: `
    // The clip's legs are cut by its own frame: it stands on the bottom edge
    // of the screen, so the cut reads as the page's edge. The header takes
    // two rows (about 100px) on the narrowest phones, one (75px) above.
    .not-found {
      display: grid;
      gap: clamp(32px, 5vw, 64px);
      align-content: space-between;
      min-block-size: calc(100svh - 100px);
      max-inline-size: 82.5rem;
      margin-inline: auto;
      padding: clamp(6rem, 12vw, 9rem) max(1rem, env(safe-area-inset-left, 0px)) 0;
    }

    @media (min-width: 410px) {
      .not-found {
        min-block-size: calc(100svh - 75px);
      }
    }

    .not-found__text {
      display: grid;
      gap: 20px;
      justify-items: start;
    }

    .not-found__eyebrow {
      font-family: var(--font-mono);
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--world-muted);
    }

    .not-found__title {
      font-weight: 500;
      font-size: max(2rem, min(5.8vw, 6.8svh, 80px));
      line-height: 0.95;
      letter-spacing: -0.035em;
      text-wrap: balance;
    }

    .not-found__lede {
      max-inline-size: 36ch;
      color: var(--world-muted);
    }

    .btn {
      margin-top: 8px;
    }

    .not-found__clip {
      position: relative;
      justify-self: center;
      margin: 0;
    }

    // At the clip's top left: Travolta stands on the page's bottom edge, and
    // the dock, fixed at the bottom right, never reaches this side of the clip.
    .not-found__toggle {
      position: absolute;
      inset-block-start: 0;
      inset-inline-start: 0;
      display: grid;
      place-items: center;
      inline-size: 44px;
      block-size: 44px;
      padding: 0;
      border: 1px solid var(--world-rule);
      border-radius: 999px;
      background: color-mix(in srgb, var(--world-ground) 72%, transparent);
      color: var(--world-ink);
      cursor: pointer;
    }

    .not-found__toggle:focus-visible {
      outline: 2px solid var(--world-ink);
      outline-offset: 2px;
    }

    .not-found__toggle svg {
      inline-size: 18px;
      block-size: 18px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linejoin: round;
    }

    .not-found__clip video {
      display: block;
      inline-size: min(100%, 490px);
      block-size: auto;
    }

    @media (min-width: 900px) {
      .not-found {
        grid-template-columns: 1fr auto;
        grid-template-rows: 1fr;
        align-content: stretch;
        align-items: end;
      }

      .not-found__text {
        align-self: center;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  protected readonly back = NAV.dev.path;
  protected readonly playing = signal(false);
  protected readonly toggleLabel = computed(() =>
    this.playing()
      ? $localize`:@@notFound.pause:Mettre en pause`
      : $localize`:@@notFound.play:Lire l’animation`,
  );
  private readonly clip = viewChild.required<ElementRef<HTMLVideoElement>>('clip');

  protected toggle(): void {
    const clip = this.clip().nativeElement;
    if (clip.paused) void clip.play()?.catch(() => undefined);
    else clip.pause();
  }

  constructor() {
    const motion = inject(ReducedMotionService);
    afterNextRender(() => {
      // Autoplay may be refused (data saver, a browser policy): the poster stays.
      if (!motion.reduced())
        void this.clip()
          .nativeElement.play()
          ?.catch(() => undefined);
    });
  }
}
