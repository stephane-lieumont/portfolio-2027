import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ReducedMotionService } from '../../../../core/services/motion/reduced-motion.service';
import { NAV } from '../../../../core/data/nav-items';

/**
 * The 2022 site's 404, kept at Stéphane's request: Travolta lost, and the
 * intercom line. Prerendered once at /404 and served by nginx with a real 404
 * status (ADR-0005).
 */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <article class="not-found">
      <div class="not-found__text">
        <p class="not-found__eyebrow" i18n="@@notFound.eyebrow">Erreur 404 · page introuvable</p>
        <h1 class="not-found__title" i18n="@@notFound.title">Mais où est l’interphone&nbsp;?</h1>
        <p class="not-found__lede" i18n="@@notFound.lede">
          Cette page n’existe pas, ou plus. Le reste du site, lui, est bien là.
        </p>
        <a class="btn" [routerLink]="back" i18n="@@notFound.back">Retour aux réalisations</a>
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
        >
          <!-- HEVC first: Safari reads its alpha, and only Safari claims QuickTime. -->
          <source src="/images/travolta-confused.mov" type='video/quicktime; codecs="hvc1"' />
          <source src="/images/travolta-confused.webm" type="video/webm" />
        </video>
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

    // The world pages' call to action: a link that looks like a button,
    // because it goes somewhere.
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
      padding: 13px 20px;
      border-radius: 999px;
      font: 500 14px/1 var(--font-sans);
      text-decoration: none;
      color: var(--world-ground);
      background: var(--world-ink);
      transition: scale 200ms var(--ease-world);
    }

    .btn::after {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    @media (hover: hover) {
      .btn:hover {
        scale: 1.04;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .btn {
        transition: none;
      }
    }

    .not-found__clip {
      justify-self: center;
      margin: 0;
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
  private readonly clip = viewChild.required<ElementRef<HTMLVideoElement>>('clip');

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
