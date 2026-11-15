import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ICONS, type Icon } from '@common/constants/icons';
import { NETWORK_NAMES } from '@common/constants/network-names';
import { SITE_SETTINGS, STATIC_FILES } from '@core/data/world-content/world-content';
import { PATHS } from '@core/i18n/site-locale/site-locale';

export interface DockLink {
  readonly key: string;
  readonly href: string;
  readonly label: string;
  readonly icon: Icon;
}

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
    <nav class="dock glass" aria-label="Réseaux et contact" i18n-aria-label="@@dock.label">
      <ul class="dock__list" role="list">
        <li>
          <a
            class="dock__link"
            [routerLink]="contactPath"
            aria-label="Me contacter"
            i18n-aria-label="@@dock.contact"
          >
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
            <a
              class="dock__link"
              [href]="cv"
              download
              aria-label="Télécharger mon CV (PDF)"
              i18n-aria-label="@@cv.download"
            >
              <svg class="dock__icon dock__icon--stroke" viewBox="0 0 24 24" aria-hidden="true">
                <path [attr.d]="cvIcon.d" />
              </svg>
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
  styleUrl: './social-dock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialDockComponent {
  protected readonly contactPath = PATHS.contact;
  protected readonly contactIcon = ICONS.contact;
  protected readonly cvIcon = ICONS.cv;
  protected readonly cv: string | undefined = STATIC_FILES[SITE_SETTINGS.cvAssetId];

  protected readonly networks: readonly DockLink[] = SITE_SETTINGS.socials.map((social) => ({
    key: social.kind,
    href: social.url,
    label: $localize`:@@dock.network:Profil ${NETWORK_NAMES[social.kind]}:network: de Stéphane Lieumont (nouvel onglet)`,
    icon: ICONS[social.kind],
  }));
}
