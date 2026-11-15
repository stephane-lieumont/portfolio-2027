import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';

import {
  type PageKey,
  type PageRef,
  SITE_LOCALE,
  SITE_LOCALES,
  SITE_ORIGIN,
  type SiteLocale,
  pageHref,
  pageRef,
} from './i18n/site-locale';

export const SITE_NAME = 'Stéphane Lieumont';
export const SITE_TITLE = `${SITE_NAME} — ${$localize`:@@site.role:Lead Tech & graphiste 3D`}`;

const PAGE_KEYS: readonly string[] = [
  'dev',
  'cgi',
  'contact',
  'project',
  'piece',
  'not-found',
] satisfies readonly PageKey[];

const isPageKey = (value: unknown): value is PageKey =>
  typeof value === 'string' && PAGE_KEYS.includes(value);

/**
 * The page's address in every tree, French as the default (ADR-0017). None
 * for the 404, which is not indexed.
 */
export function alternates(ref: PageRef): { hreflang: string; href: string }[] {
  if (ref.page === 'not-found') return [];
  const href = (locale: SiteLocale) => `${SITE_ORIGIN}${pageHref(ref, locale)}`;
  return [
    ...SITE_LOCALES.map((locale) => ({ hreflang: locale, href: href(locale) })),
    { hreflang: 'x-default', href: href('fr') },
  ];
}

/**
 * Writes each page's `<title>`, description and robots directive from its
 * route: `title` for the title, `data.description` and `data.noindex` for the
 * rest, `data.page` for the `hreflang` links. Running as the router's title strategy means it runs during
 * prerendering too, so the metadata is in the delivered HTML (ADR-0008).
 */
@Injectable({ providedIn: 'root' })
export class PageMetadata extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly head = inject(DOCUMENT).head;

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    this.title.setTitle(page ? `${page} — ${SITE_NAME}` : SITE_TITLE);

    const route = deepest(snapshot.root);
    const description: unknown = route.data['description'];
    if (typeof description === 'string') {
      this.meta.updateTag({ name: 'description', content: description });
    } else {
      this.meta.removeTag('name="description"');
    }

    if (route.data['noindex'] === true) {
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
    } else {
      this.meta.removeTag('name="robots"');
    }

    const key: unknown = route.data['page'];
    this.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => link.remove());
    if (!isPageKey(key)) return;
    const ref = pageRef(key, route.paramMap.get('slug'), SITE_LOCALE);
    for (const { hreflang, href } of alternates(ref)) {
      const link = this.head.ownerDocument.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', hreflang);
      link.setAttribute('href', href);
      this.head.appendChild(link);
    }
  }
}

function deepest(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return route.firstChild ? deepest(route.firstChild) : route;
}
