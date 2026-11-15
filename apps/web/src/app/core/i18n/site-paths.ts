// No imports and no `$localize`: the prerender check reads this file under Node.

/**
 * Each section's segment in each tree. One table for both languages rather
 * than a `$localize` per path: a build carries only its own translations, and
 * the switcher has to know the other tree's address.
 */
export const SECTIONS = {
  dev: { fr: 'developpeur', en: 'developer' },
  cgi: { fr: 'graphisme-3d', en: '3d-art' },
  contact: { fr: 'contact', en: 'contact' },
} as const;

/** Where alternate addresses point: ADR-0008 serves the site without `www`. */
export const SITE_ORIGIN = 'https://stephane-lieumont.fr';

/**
 * The share cards, one per world and language, drawn by scripts/og-images.mjs
 * into public/og/. A project or a piece shares its world's card.
 */
export const OG_IMAGE = {
  width: 1200,
  height: 630,
  file: (world: 'dev' | 'cgi', locale: 'fr' | 'en') => `/og/${world}-${locale}.png`,
} as const;
