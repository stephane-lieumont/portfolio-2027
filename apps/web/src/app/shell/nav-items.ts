import { PATHS } from '../core/i18n/site-locale';

export interface NavItem {
  readonly path: string;
  readonly label: string;
}

/** The header's entries, as on the approved « Bascule » mockup. */
export const NAV = {
  dev: { path: PATHS.dev, label: $localize`:@@nav.dev:Développement` },
  cgi: { path: PATHS.cgi, label: $localize`:@@nav.cgi:Graphisme 3D` },
  contact: { path: PATHS.contact, label: $localize`:@@nav.contact:Contact` },
} as const satisfies Record<string, NavItem>;
