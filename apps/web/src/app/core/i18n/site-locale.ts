import { ARTWORKS, PROJECTS } from '../data/static-content';
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

/**
 * A project or a piece is named by its record's id, not by a slug: each tree
 * has its own slug for it (ADR-0017), and the id is what both share.
 */
export interface PageRef {
  readonly page: PageKey;
  readonly id?: string;
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
export function pagePath({ page, id }: PageRef, locale: SiteLocale): string {
  switch (page) {
    case 'project':
      return `/${SECTIONS.dev[locale]}/${PROJECTS.find((p) => p.id === id)?.slug[locale] ?? ''}`;
    case 'piece':
      return `/${SECTIONS.cgi[locale]}/${ARTWORKS.find((a) => a.id === id)?.slug[locale] ?? ''}`;
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
  if (first === SECTIONS.dev[locale])
    return slug ? pageRef('project', slug, locale) : { page: 'dev' };
  if (first === SECTIONS.cgi[locale])
    return slug ? pageRef('piece', slug, locale) : { page: 'cgi' };
  if (first === SECTIONS.contact[locale] && !slug) return { page: 'contact' };
  return { page: 'not-found' };
}

/**
 * A route's page, its slug read in the tree's language: a project or a piece
 * becomes its record's id. An unknown slug is served the 404, so it is the 404
 * here too.
 */
export function pageRef(page: PageKey, slug: string | null, locale: SiteLocale): PageRef {
  const records = page === 'project' ? PROJECTS : page === 'piece' ? ARTWORKS : null;
  if (!records) return { page };
  const record = records.find((r) => r.slug[locale] === slug);
  return record ? { page, id: record.id } : { page: 'not-found' };
}

export function otherLocale(locale: SiteLocale): SiteLocale {
  return locale === 'fr' ? 'en' : 'fr';
}

/** The cookie the switcher leaves for nginx's `/` redirect (ADR-0017). */
export function languageCookie(locale: SiteLocale): string {
  return `lang=${locale}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`;
}
