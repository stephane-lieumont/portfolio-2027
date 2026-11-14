import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NAV } from '../../shell/nav-items';

/**
 * Interim 404, in the mockup's vocabulary: a mono eyebrow, a heading, one way
 * back. A designed page comes later. Prerendered once at /404 and served by
 * nginx with a real 404 status (ADR-0005).
 */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <article class="not-found">
      <p class="not-found__eyebrow">Erreur 404</p>
      <h1 class="t-h1">Page introuvable</h1>
      <a class="not-found__back" [routerLink]="back">Retour à l’accueil</a>
    </article>
  `,
  styles: `
    .not-found {
      display: grid;
      gap: var(--space-4);
      justify-items: start;
      max-inline-size: 82.5rem;
      margin-inline: auto;
      padding: clamp(2rem, 8vw, 7.5rem) max(1rem, env(safe-area-inset-left, 0px));
    }

    .not-found__eyebrow {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--world-muted);
    }

    .not-found__back {
      display: inline-flex;
      align-items: center;
      min-block-size: 2.75rem;
      color: var(--world-ink);
      text-underline-offset: 4px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {
  protected readonly back = NAV.dev.path;
}
