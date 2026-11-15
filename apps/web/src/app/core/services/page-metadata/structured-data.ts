import { CONTACT_PAGE, SITE_SETTINGS } from '@core/data/world-content/world-content';
import { inLocale } from '@core/i18n/in-locale.pipe';
import {
  type PageRef,
  SITE_LOCALE,
  SITE_ORIGIN,
  pageHref,
} from '@core/i18n/site-locale/site-locale';

export interface PageFacts {
  readonly ref: PageRef;
  readonly url: string;
  readonly title: string;
  readonly description: string | null;
  readonly name: string;
  readonly role: string;
}

const PERSON_ID = `${SITE_ORIGIN}/#person`;

/**
 * schema.org data for a page, from what the site already publishes: the name
 * and role of the header, the social links of the dock, the town under the
 * contact portrait. The person and the site are described on the world pages;
 * every other page points at them.
 */
export function structuredData(page: PageFacts): object {
  const home = `${SITE_ORIGIN}${pageHref({ page: 'dev' }, SITE_LOCALE)}`;
  const websiteId = `${home}#website`;
  const website = {
    '@type': 'WebSite',
    '@id': websiteId,
    name: page.name,
    url: home,
    inLanguage: SITE_LOCALE,
  };
  const webPage = {
    '@type': page.ref.page === 'contact' ? 'ContactPage' : 'WebPage',
    url: page.url,
    name: page.title,
    ...(page.description ? { description: page.description } : {}),
    inLanguage: SITE_LOCALE,
    isPartOf: { '@id': websiteId },
  };

  if (page.ref.page !== 'dev' && page.ref.page !== 'cgi') {
    return { '@context': 'https://schema.org', '@graph': [webPage, website] };
  }

  const [locality, country] = inLocale(CONTACT_PAGE.portraitCaption).split(', ');
  const person = {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: page.name,
    jobTitle: page.role,
    // The root, which opens each visitor's language (ADR-0017): the person is
    // the same in both trees.
    url: `${SITE_ORIGIN}/`,
    address: { '@type': 'PostalAddress', addressLocality: locality, addressCountry: country },
    sameAs: SITE_SETTINGS.socials.map((social) => social.url),
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { ...webPage, '@type': 'ProfilePage', mainEntity: { '@id': PERSON_ID } },
      { ...website, publisher: { '@id': PERSON_ID } },
      person,
    ],
  };
}
