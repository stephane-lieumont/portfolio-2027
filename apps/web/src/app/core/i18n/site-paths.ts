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
