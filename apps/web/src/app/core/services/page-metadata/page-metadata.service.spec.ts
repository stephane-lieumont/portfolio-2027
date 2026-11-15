import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { API_BASE_URL } from '@core/config/api.config';
import { MEDIA_BASE_URL } from '@core/config/media-config/media.config';
import { PROJECTS } from '@core/data/static-content/static-content';
import { SITE_SETTINGS } from '@core/data/world-content/world-content';
import { pageRef } from '@core/i18n/site-locale/site-locale';
import { PageMetadataService, alternates, shareTags } from './page-metadata.service';

// The real route table is what this spec checks the titles against; it
// belongs to the app's root, which has no alias.
// eslint-disable-next-line no-restricted-imports
import { routes } from '../../../app.routes';

const PAGES = [
  '/developpeur',
  '/graphisme-3d',
  '/contact',
  ...PROJECTS.map((p) => `/developpeur/${p.slug.fr}`),
];

const description = () =>
  document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content;
const alternateLinks = () =>
  Array.from(
    document.head.querySelectorAll('link[rel="alternate"]'),
    (link) => `${link.getAttribute('hreflang')} ${link.getAttribute('href')}`,
  );
const robots = () => document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content;

describe('page metadata', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    document.head.querySelectorAll('meta[name]').forEach((m) => m.remove());
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes, withComponentInputBinding()),
        { provide: TitleStrategy, useClass: PageMetadataService },
        { provide: MEDIA_BASE_URL, useValue: '/medias' },
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('gives every indexable page its own title and a description', async () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();

    for (const url of PAGES) {
      await harness.navigateByUrl(url);
      titles.add(document.title);
      descriptions.add(description() ?? '');
      expect(robots(), url).toBeUndefined();
    }

    expect(titles.size).toBe(PAGES.length);
    expect(descriptions.size).toBe(PAGES.length);
    expect(descriptions.has('')).toBe(false);
  });

  it('lands the root address on the developer world', async () => {
    await harness.navigateByUrl('/');
    expect(TestBed.inject(Router).url).toBe('/developpeur');
  });

  it('names a project page after the project and describes it with its summary', async () => {
    const [project] = PROJECTS;
    await harness.navigateByUrl(`/developpeur/${project.slug.fr}`);

    expect(document.title).toBe(`${project.title.fr} — Stéphane Lieumont`);
    expect(description()).toBe(project.summary.fr);
  });

  it('names the same page in both trees, French as the default', async () => {
    await harness.navigateByUrl('/developpeur/ledger');

    expect(alternateLinks()).toEqual([
      'fr https://stephane-lieumont.fr/developpeur/ledger',
      'en https://stephane-lieumont.fr/en/developer/ledger',
      'x-default https://stephane-lieumont.fr/developpeur/ledger',
    ]);

    // A translated slug: each tree's address carries its own.
    // A piece opens the viewer, which jsdom cannot animate: read its links directly.
    expect(alternates(pageRef('piece', 'salon-nuit', 'fr'))).toEqual([
      { hreflang: 'fr', href: 'https://stephane-lieumont.fr/graphisme-3d/salon-nuit' },
      { hreflang: 'en', href: 'https://stephane-lieumont.fr/en/3d-art/living-room-night' },
      { hreflang: 'x-default', href: 'https://stephane-lieumont.fr/graphisme-3d/salon-nuit' },
    ]);

    await harness.navigateByUrl('/contact');
    expect(alternateLinks()).toEqual([
      'fr https://stephane-lieumont.fr/contact',
      'en https://stephane-lieumont.fr/en/contact',
      'x-default https://stephane-lieumont.fr/contact',
    ]);
  });

  it('keeps the 404 out of the index and says nothing about it', async () => {
    await harness.navigateByUrl('/developpeur/projet-qui-nexiste-pas');
    expect(alternateLinks()).toEqual([]);

    expect(document.title).toBe('Erreur 404 — Stéphane Lieumont');
    expect(robots()).toBe('noindex');
    expect(description()).toBeUndefined();
  });

  // A noindex left behind by the 404 would de-index the next page a crawler
  // reaches by client-side navigation.
  it('lifts the 404 directives on the next page', async () => {
    await harness.navigateByUrl('/nulle-part');
    await harness.navigateByUrl('/contact');

    expect(robots()).toBeUndefined();
    expect(description()).toBeTruthy();
  });

  it('names every indexable page by its own address, the one its hreflang gives this tree', async () => {
    for (const url of PAGES) {
      await harness.navigateByUrl(url);
      const own = `https://stephane-lieumont.fr${url}`;

      expect(canonicals(), url).toEqual([own]);
      expect(alternateLinks(), url).toContain(`fr ${own}`);
      expect(og('og:url'), url).toBe(own);
      expect(og('og:title'), url).toBe(document.title);
      expect(og('og:description'), url).toBe(description());
      expect(og('og:locale'), url).toBe('fr_FR');
      expect(og('og:locale:alternate'), url).toBe('en_GB');
      expect(twitterCard(), url).toBe('summary_large_image');
    }
  });

  it('shares each world’s card, a project its world’s', async () => {
    await harness.navigateByUrl('/graphisme-3d');
    expect(og('og:image')).toBe('https://stephane-lieumont.fr/og/cgi-fr.png');
    expect(og('og:type')).toBe('profile');

    await harness.navigateByUrl('/developpeur/ledger');
    expect(og('og:image')).toBe('https://stephane-lieumont.fr/og/dev-fr.png');
    expect(og('og:type')).toBe('website');
    expect(og('og:image:width')).toBe('1200');
    expect(og('og:image:height')).toBe('630');
    expect(og('og:image:alt')).toBe('Stéphane Lieumont, Lead Tech');

    const piece = shareTags(pageRef('piece', 'salon-nuit', 'fr'), 'x', 'x', null);
    expect(piece).toContainEqual({
      property: 'og:image',
      content: 'https://stephane-lieumont.fr/og/cgi-fr.png',
    });
    expect(piece).toContainEqual({
      property: 'og:image:alt',
      content: 'Stéphane Lieumont, graphiste 3D',
    });
  });

  it('describes the person on a world page from what the site already shows', async () => {
    await harness.navigateByUrl('/developpeur');
    const graph = jsonLd();
    const person = graph.find((node) => node['@type'] === 'Person');

    expect(person).toMatchObject({
      name: 'Stéphane Lieumont',
      jobTitle: 'Lead Tech & graphiste 3D',
      address: { addressLocality: 'Fontenilles', addressCountry: 'France' },
      sameAs: SITE_SETTINGS.socials.map((social) => social.url),
    });
    expect(graph.find((node) => node['@type'] === 'WebSite')).toMatchObject({
      inLanguage: 'fr',
      url: 'https://stephane-lieumont.fr/developpeur',
    });
  });

  it('places a project page in the site, without claiming who made the product', async () => {
    const [project] = PROJECTS;
    await harness.navigateByUrl(`/developpeur/${project.slug.fr}`);
    const graph = jsonLd();

    expect(graph.find((node) => node['@type'] === 'WebPage')).toMatchObject({
      url: `https://stephane-lieumont.fr/developpeur/${project.slug.fr}`,
      name: `${project.title.fr} — Stéphane Lieumont`,
      description: project.summary.fr,
      inLanguage: 'fr',
      isPartOf: { '@id': 'https://stephane-lieumont.fr/developpeur#website' },
    });
    expect(graph.some((node) => node['@type'] === 'Person')).toBe(false);
  });

  // Left behind, the previous page's canonical and og:url would name the 404
  // as that page.
  it('withdraws the canonical, the share tags and the JSON-LD on the 404', async () => {
    await harness.navigateByUrl('/contact');
    await harness.navigateByUrl('/nulle-part');

    expect(canonicals()).toEqual([]);
    expect(document.head.querySelector('meta[property]')).toBeNull();
    expect(twitterCard()).toBeUndefined();
    expect(document.head.querySelector('script[type="application/ld+json"]')).toBeNull();
  });
});

const canonicals = () =>
  Array.from(document.head.querySelectorAll('link[rel="canonical"]'), (link) =>
    link.getAttribute('href'),
  );
const og = (property: string) =>
  document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)?.content;
const twitterCard = () =>
  document.head.querySelector<HTMLMetaElement>('meta[name="twitter:card"]')?.content;

type JsonLdNode = Record<string, unknown>;

function jsonLd(): JsonLdNode[] {
  const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
  expect(scripts.length).toBe(1);
  const data: { '@context': string; '@graph': JsonLdNode[] } = JSON.parse(
    scripts[0].textContent ?? '',
  );
  expect(data['@context']).toBe('https://schema.org');
  return data['@graph'];
}
