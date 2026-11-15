import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { API_BASE_URL } from '@core/config/api.config';
import { MEDIA_BASE_URL } from '@core/config/media-config/media.config';
import { PROJECTS } from '@core/data/static-content/static-content';
import { pageRef } from '@core/i18n/site-locale/site-locale';
import { PageMetadataService, alternates } from './page-metadata.service';

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
});
