import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { routes } from '../app.routes';
import { MEDIA_BASE_URL } from './media.config';
import { PageMetadata, SITE_TITLE } from './page-metadata';
import { PROJECTS } from './static-content';

const PAGES = [
  '/',
  '/developpeur',
  '/graphisme-3d',
  '/contact',
  ...PROJECTS.map((p) => `/developpeur/${p.slug}`),
];

const description = () =>
  document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content;
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

  it('keeps the site title on the home page', async () => {
    await harness.navigateByUrl('/');
    expect(document.title).toBe(SITE_TITLE);
  });

  it('names a project page after the project and describes it with its summary', async () => {
    const [project] = PROJECTS;
    await harness.navigateByUrl(`/developpeur/${project.slug}`);

    expect(document.title).toBe(`${project.title} — Stéphane Lieumont`);
    expect(description()).toBe(project.summary);
  });

  it('keeps the 404 out of the index and says nothing about it', async () => {
    await harness.navigateByUrl('/developpeur/projet-qui-nexiste-pas');

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
