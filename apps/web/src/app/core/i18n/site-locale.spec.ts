import { describe, expect, it } from 'vitest';

import { ARTWORKS, PROJECTS } from '@core/data/static-content';
import {
  type PageRef,
  SITE_LOCALE,
  languageCookie,
  pageAt,
  pageHref,
  pagePath,
} from './site-locale';

const PAGES: PageRef[] = [
  { page: 'dev' },
  { page: 'cgi' },
  { page: 'contact' },
  ...PROJECTS.map((p) => ({ page: 'project' as const, id: p.id })),
  ...ARTWORKS.map((a) => ({ page: 'piece' as const, id: a.id })),
];

const projectId = (fr: string) => PROJECTS.find((p) => p.slug.fr === fr)?.id;
const pieceId = (fr: string) => ARTWORKS.find((a) => a.slug.fr === fr)?.id;

describe('site addresses', () => {
  it('builds in French by default, the source language', () => {
    expect(SITE_LOCALE).toBe('fr');
  });

  it('gives the English tree English section names under /en', () => {
    expect(pageHref({ page: 'dev' }, 'en')).toBe('/en/developer');
    expect(pageHref({ page: 'cgi' }, 'en')).toBe('/en/3d-art');
    expect(pageHref({ page: 'contact' }, 'en')).toBe('/en/contact');
    expect(pageHref({ page: 'project', id: projectId('kasa-openclassrooms') }, 'en')).toBe(
      '/en/developer/kasa-openclassrooms',
    );
    expect(pageHref({ page: 'piece', id: pieceId('gorgotte') }, 'en')).toBe('/en/3d-art/gorgotte');
  });

  it('gives a project or a piece its English slug in the English tree', () => {
    expect(pageHref({ page: 'project', id: projectId('portfolio-3d-2018') }, 'en')).toBe(
      '/en/developer/3d-portfolio-2018',
    );
    expect(pageHref({ page: 'piece', id: pieceId('salon-nuit') }, 'en')).toBe(
      '/en/3d-art/living-room-night',
    );
  });

  it('does not take one tree’s slug for a record in the other', () => {
    expect(pageAt('/developer/portfolio-3d-2018', 'en')).toEqual({ page: 'not-found' });
    expect(pageAt('/graphisme-3d/living-room-night', 'fr')).toEqual({ page: 'not-found' });
  });

  it('keeps every French address where it was', () => {
    expect(pageHref({ page: 'dev' }, 'fr')).toBe('/developpeur');
    expect(pageHref({ page: 'cgi' }, 'fr')).toBe('/graphisme-3d');
    expect(pageHref({ page: 'project', id: projectId('pixmodels') }, 'fr')).toBe(
      '/developpeur/pixmodels',
    );
  });

  // The switcher and hreflang go through the page key: reading a path back
  // must find the page it was built from, in both trees, for every record.
  it('reads back every page from its own path, in both trees', () => {
    for (const locale of ['fr', 'en'] as const) {
      for (const ref of PAGES) expect(pageAt(pagePath(ref, locale), locale)).toEqual(ref);
    }
  });

  it('does not read one tree’s sections in the other', () => {
    expect(pageAt('/developpeur', 'en')).toEqual({ page: 'not-found' });
    expect(pageAt('/3d-art', 'fr')).toEqual({ page: 'not-found' });
  });

  it('treats anything outside the sections as the 404, which opens the other tree on its first page', () => {
    expect(pageAt('/', 'fr')).toEqual({ page: 'not-found' });
    expect(pageAt('/contact/x', 'fr')).toEqual({ page: 'not-found' });
    expect(pageHref({ page: 'not-found' }, 'en')).toBe('/en/developer');
  });

  it('remembers the choice for a year, site-wide, and nothing else', () => {
    expect(languageCookie('en')).toBe('lang=en; Max-Age=31536000; Path=/; SameSite=Lax; Secure');
  });
});
