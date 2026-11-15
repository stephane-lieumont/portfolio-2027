import { ARTWORKS, PROJECTS } from '../static-content';
import { SECTIONS } from './site-paths';

export { SECTIONS, SITE_ORIGIN } from './site-paths';

export type SiteLocale = 'fr' | 'en';

export const SITE_LOCALES: readonly SiteLocale[] = ['fr', 'en'];

/**
 * The language of this build. Each tree is compiled on its own (ADR-0017):
 * the localize step replaces `$localize.locale` with the tree's code, and the
 * development build, not localized, runs in the source language.
 */
export const SITE_LOCALE: SiteLocale = $localize.locale === 'en' ? 'en' : 'fr';

/**
 * A page as the same thing in both trees: the switcher and the `hreflang`
 * links go from one to the other through it.
 */
export type PageKey = 'dev' | 'cgi' | 'contact' | 'project' | 'piece' | 'not-found';

export interface PageRef {
  readonly page: PageKey;
  readonly slug?: string;
}

/** The sections' paths in this build's tree, as the router sees them. */
export const PATHS = {
  dev: `/${SECTIONS.dev[SITE_LOCALE]}`,
  cgi: `/${SECTIONS.cgi[SITE_LOCALE]}`,
  contact: `/${SECTIONS.contact[SITE_LOCALE]}`,
} as const;

/** The tree's prefix from the site root: nothing for French, `/en` for English. */
export function treePrefix(locale: SiteLocale): string {
  return locale === 'fr' ? '' : `/${locale}`;
}

/**
 * A page's path inside a tree, base excluded. The 404 has no counterpart of
 * its own: from it, the other tree opens on its first page.
 */
export function pagePath({ page, slug }: PageRef, locale: SiteLocale): string {
  switch (page) {
    case 'project':
      return `/${SECTIONS.dev[locale]}/${slug ?? ''}`;
    case 'piece':
      return `/${SECTIONS.cgi[locale]}/${slug ?? ''}`;
    case 'cgi':
      return `/${SECTIONS.cgi[locale]}`;
    case 'contact':
      return `/${SECTIONS.contact[locale]}`;
    default:
      return `/${SECTIONS.dev[locale]}`;
  }
}

/** A page's address from the site root, in the given tree. */
export function pageHref(ref: PageRef, locale: SiteLocale): string {
  return `${treePrefix(locale)}${pagePath(ref, locale)}`;
}

/**
 * Which page a router path is, in a tree. Read from the path rather than the
 * route's data so the first render, before the router has finished, already
 * names the right page (the prerendered HTML must agree with it).
 */
export function pageAt(path: string, locale: SiteLocale): PageRef {
  const [first, slug] = path.split('/').filter(Boolean);
  // An unknown slug is served the 404, so it is the 404 here too.
  if (first === SECTIONS.dev[locale]) {
    if (!slug) return { page: 'dev' };
    return PROJECTS.some((p) => p.slug === slug)
      ? { page: 'project', slug }
      : { page: 'not-found' };
  }
  if (first === SECTIONS.cgi[locale]) {
    if (!slug) return { page: 'cgi' };
    return ARTWORKS.some((a) => a.slug === slug) ? { page: 'piece', slug } : { page: 'not-found' };
  }
  if (first === SECTIONS.contact[locale] && !slug) return { page: 'contact' };
  return { page: 'not-found' };
}

export function otherLocale(locale: SiteLocale): SiteLocale {
  return locale === 'fr' ? 'en' : 'fr';
}

/** The cookie the switcher leaves for nginx's `/` redirect (ADR-0017). */
export function languageCookie(locale: SiteLocale): string {
  return `lang=${locale}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`;
}
