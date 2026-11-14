import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { SocialKind } from '@portfolio/shared-types';

import { SITE_SETTINGS, STATIC_FILES } from '../core/content/world-content';
import { ICONS, type Icon } from './icons';

export interface DockLink {
  readonly key: string;
  readonly href: string;
  readonly label: string;
  readonly icon: Icon;
}

const NETWORK_NAMES: Readonly<Record<SocialKind, string>> = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  artstation: 'ArtStation',
};

/**
 * The social pill fixed at the bottom of every page. Its contact icon goes to
 * the contact page: the address is never published (ADR-0007), so there is no
 * mailto here or anywhere else.
 *
 * Always on screen, as on the approved mockup; content scrolls under it.
 * `scroll-padding-block-end` keeps a focused element clear of it.
 */
@Component({
  selector: 'app-social-dock',
  imports: [RouterLink],
  template: `
    <nav class="dock glass" aria-label="Réseaux et contact">
      <ul class="dock__list" role="list">
        <li>
          <a class="dock__link" routerLink="/contact" aria-label="Me contacter">
            <svg class="dock__icon dock__icon--stroke" viewBox="0 0 24 24" aria-hidden="true">
              <path [attr.d]="contactIcon.d" />
            </svg>
          </a>
        </li>
        @for (link of networks; track link.key) {
          <li>
            <a
              class="dock__link"
              [href]="link.href"
              target="_blank"
              rel="noopener"
              [attr.aria-label]="link.label"
            >
              <svg class="dock__icon" viewBox="0 0 24 24" aria-hidden="true">
                <path [attr.d]="link.icon.d" />
              </svg>
            </a>
          </li>
        }
        @if (cv; as cv) {
          <li>
            <a class="dock__link" [href]="cv" download aria-label="Télécharger mon CV (PDF)">
              <svg class="dock__icon dock__icon--stroke" viewBox="0 0 24 24" aria-hidden="true">
                <path [attr.d]="cvIcon.d" />
              </svg>
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
  styleUrl: './social-dock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialDock {
  protected readonly contactIcon = ICONS.contact;
  protected readonly cvIcon = ICONS.cv;
  protected readonly cv: string | undefined = STATIC_FILES[SITE_SETTINGS.cvAssetId];

  protected readonly networks: readonly DockLink[] = SITE_SETTINGS.socials.map((social) => ({
    key: social.kind,
    href: social.url,
    label: `Profil ${NETWORK_NAMES[social.kind]} de Stéphane Lieumont (nouvel onglet)`,
    icon: ICONS[social.kind],
  }));
}
