import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';

import {
  OG_IMAGE,
  type PageKey,
  type PageRef,
  SITE_LOCALE,
  SITE_LOCALES,
  SITE_ORIGIN,
  type SiteLocale,
  otherLocale,
  pageHref,
  pageRef,
} from '@core/i18n/site-locale/site-locale';
import { structuredData } from './structured-data';

export const SITE_NAME = 'Stéphane Lieumont';
export const SITE_ROLE = $localize`:@@site.role:Lead Tech & graphiste 3D`;
export const SITE_TITLE = `${SITE_NAME} — ${SITE_ROLE}`;

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

const NOT_FOUND: PageRef = { page: 'not-found' };

const OG_LOCALES: Readonly<Record<SiteLocale, string>> = { fr: 'fr_FR', en: 'en_GB' };

const SHARE_CARD_ALT = {
  dev: $localize`:@@og.image.dev.alt:Stéphane Lieumont, Lead Tech`,
  cgi: $localize`:@@og.image.cgi.alt:Stéphane Lieumont, graphiste 3D`,
};

/** What the head says about a page, beyond its title and description. */
const PAGE_HEAD =
  'link[rel="alternate"][hreflang], link[rel="canonical"], meta[property], meta[name^="twitter:"], script[type="application/ld+json"]';

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
 * Open Graph and Twitter tags for an indexable page. A project or a piece
 * shares its world's card; contact shares the developer's, where the site
 * opens.
 */
export function shareTags(
  ref: PageRef,
  url: string,
  title: string,
  description: string | null,
): MetaDefinition[] {
  const world = ref.page === 'cgi' || ref.page === 'piece' ? 'cgi' : 'dev';
  const profile = ref.page === 'dev' || ref.page === 'cgi';
  return [
    { property: 'og:type', content: profile ? 'profile' : 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:title', content: title },
    ...(description ? [{ property: 'og:description', content: description }] : []),
    { property: 'og:url', content: url },
    { property: 'og:locale', content: OG_LOCALES[SITE_LOCALE] },
    { property: 'og:locale:alternate', content: OG_LOCALES[otherLocale(SITE_LOCALE)] },
    { property: 'og:image', content: `${SITE_ORIGIN}${OG_IMAGE.file(world, SITE_LOCALE)}` },
    { property: 'og:image:type', content: 'image/png' },
    { property: 'og:image:width', content: `${OG_IMAGE.width}` },
    { property: 'og:image:height', content: `${OG_IMAGE.height}` },
    { property: 'og:image:alt', content: SHARE_CARD_ALT[world] },
    ...(profile
      ? [
          { property: 'profile:first_name', content: 'Stéphane' },
          { property: 'profile:last_name', content: 'Lieumont' },
        ]
      : []),
    { name: 'twitter:card', content: 'summary_large_image' },
  ];
}

/**
 * Writes each page's head from its route: `<title>`, description, robots,
 * the `hreflang` links, the canonical, Open Graph and schema.org data —
 * `title` for the title, `data.description` and `data.noindex` for the text
 * and the directive, `data.page` for the rest. Running as the router's title
 * strategy means it runs during prerendering too, so all of it is in the
 * delivered HTML (ADR-0008).
 */
@Injectable({ providedIn: 'root' })
export class PageMetadataService extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly head = inject(DOCUMENT).head;

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    const title = page ? `${page} — ${SITE_NAME}` : SITE_TITLE;
    this.title.setTitle(title);

    const route = deepest(snapshot.root);
    const resolved: unknown = route.data['description'];
    const description = typeof resolved === 'string' ? resolved : null;
    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
    } else {
      this.meta.removeTag('name="description"');
    }

    if (route.data['noindex'] === true) {
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
    } else {
      this.meta.removeTag('name="robots"');
    }

    this.head.querySelectorAll(PAGE_HEAD).forEach((element) => element.remove());

    const key: unknown = route.data['page'];
    const ref = isPageKey(key) ? pageRef(key, route.paramMap.get('slug'), SITE_LOCALE) : NOT_FOUND;
    if (ref.page === 'not-found') return;

    for (const { hreflang, href } of alternates(ref)) {
      this.link({ rel: 'alternate', hreflang, href });
    }
    const url = `${SITE_ORIGIN}${pageHref(ref, SITE_LOCALE)}`;
    this.link({ rel: 'canonical', href: url });
    this.meta.addTags(shareTags(ref, url, title, description));

    const script = this.head.ownerDocument.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    // Escaped so no text in the data can close the script element.
    script.textContent = JSON.stringify(
      structuredData({ ref, url, title, description, name: SITE_NAME, role: SITE_ROLE }),
    ).replace(/</g, '\\u003c');
    this.head.appendChild(script);
  }

  private link(attributes: Record<string, string>): void {
    const link = this.head.ownerDocument.createElement('link');
    for (const [name, value] of Object.entries(attributes)) link.setAttribute(name, value);
    this.head.appendChild(link);
  }
}

function deepest(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return route.firstChild ? deepest(route.firstChild) : route;
}
