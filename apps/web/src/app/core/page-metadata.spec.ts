import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { routes } from '../app.routes';
import { API_BASE_URL } from './api.config';
import { MEDIA_BASE_URL } from './media.config';
import { PageMetadata } from './page-metadata';
import { PROJECTS } from './static-content';

const PAGES = [
  '/developpeur',
  '/graphisme-3d',
  '/contact',
  ...PROJECTS.map((p) => `/developpeur/${p.slug}`),
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
        { provide: TitleStrategy, useClass: PageMetadata },
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
    await harness.navigateByUrl(`/developpeur/${project.slug}`);

    expect(document.title).toBe(`${project.title} — Stéphane Lieumont`);
    expect(description()).toBe(project.summary);
  });

  it('names the same page in both trees, French as the default', async () => {
    await harness.navigateByUrl('/developpeur/pixmodels');

    expect(alternateLinks()).toEqual([
      'fr https://stephane-lieumont.fr/developpeur/pixmodels',
      'en https://stephane-lieumont.fr/en/developer/pixmodels',
      'x-default https://stephane-lieumont.fr/developpeur/pixmodels',
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
