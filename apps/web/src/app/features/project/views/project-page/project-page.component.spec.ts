import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { MEDIA_BASE_URL } from '@core/config/media.config';
import { PROJECTS } from '@core/data/static-content';
import { ProjectPageComponent } from './project-page.component';

async function render(slug: string) {
  await TestBed.configureTestingModule({
    imports: [ProjectPageComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: MEDIA_BASE_URL, useValue: '/medias' },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ProjectPageComponent);
  fixture.componentRef.setInput('slug', slug);
  fixture.detectChanges();
  return fixture;
}

const squash = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ').trim();

function visibleToReaders(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (!(node instanceof Element)) return '';
  if (node.getAttribute('aria-hidden') === 'true') return '';
  return Array.from(node.childNodes, visibleToReaders).join('');
}

/** What a screen reader reads: the text without what is hidden from it. */
const spoken = (element: Element | null) => squash(element ? visibleToReaders(element) : '');

// Every project, not a sample: the copy is hand-written per entry, and a
// missing field would only ever show on the one page nobody opened.
describe.each(PROJECTS.map((p) => [p.slug.fr, p] as const))('project %s', (slug, project) => {
  it('is titled once, read as its plain title despite the letters split for the entrance', async () => {
    const host = (await render(slug)).nativeElement as HTMLElement;
    const h1s = host.querySelectorAll('h1');

    expect(h1s).toHaveLength(1);
    expect(spoken(h1s[0])).toBe(project.title.fr);
  });

  it('opens on the context and never repeats the summary, which is the meta description', async () => {
    const text = squash(((await render(slug)).nativeElement as HTMLElement).textContent);

    expect(text).toContain(project.context.fr);
    expect(text).not.toContain(project.summary.fr);
  });

  it('lists the mission and every step and tool, in order', async () => {
    const host = (await render(slug)).nativeElement as HTMLElement;

    expect(squash(host.querySelector('.mission__text')?.textContent)).toBe(project.mission.fr);
    expect(Array.from(host.querySelectorAll('.steps li'), (li) => squash(li.textContent))).toEqual(
      project.missionSteps.map((step) => step.fr),
    );
    expect(host.querySelectorAll('.tools li')).toHaveLength(project.technologies.length);
  });

  it('shows « Voir le site » exactly when the project has a site, root-relative for a demo', async () => {
    const host = (await render(slug)).nativeElement as HTMLElement;
    const site = Array.from(host.querySelectorAll<HTMLAnchorElement>('.ctas a')).find((a) =>
      a.textContent?.includes('Voir le site'),
    );

    if (project.websiteUrl) {
      expect(site?.getAttribute('href')).toBe(project.websiteUrl);
      expect(site?.getAttribute('target')).toBe('_blank');
      expect(site?.textContent).toContain('nouvel onglet');
    } else {
      expect(site).toBeUndefined();
    }
  });

  it('shows the video and its button exactly when the project has a video', async () => {
    const host = (await render(slug)).nativeElement as HTMLElement;
    const button = Array.from(host.querySelectorAll('.ctas a')).find((a) =>
      a.textContent?.includes('Voir la vidéo'),
    );

    expect(Boolean(button)).toBe(Boolean(project.videoUrl));
    expect(Boolean(host.querySelector('#video app-video-facade'))).toBe(Boolean(project.videoUrl));
    // Nothing from YouTube in the page before a click, whatever the project.
    expect(host.querySelector('iframe')).toBeNull();
  });

  it('opens on its presentation visual, through the media base, with real width candidates', async () => {
    const host = (await render(slug)).nativeElement as HTMLElement;
    const img = host.querySelector<HTMLImageElement>('.fig__img');

    expect(img?.getAttribute('src')).toBe(`/medias/${project.presentation.key}`);
    expect(img?.getAttribute('srcset')).toContain(
      `/medias/${project.presentation.key.replace(/\.jpg$/, '-640.webp')} 640w`,
    );
    expect(img?.getAttribute('fetchpriority')).toBe('high');
    expect(squash(host.querySelector('figcaption')?.textContent)).toBe(
      `Fig.${project.presentationCaption.fr}`,
    );
  });

  it('has no skipped heading level', async () => {
    const host = (await render(slug)).nativeElement as HTMLElement;
    const levels = Array.from(host.querySelectorAll('h1, h2, h3, h4'), (h) => Number(h.tagName[1]));

    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  it('has no detectable accessibility violation', async () => {
    const host = (await render(slug)).nativeElement as HTMLElement;
    document.body.appendChild(host);
    const results = await axe.run(host, { resultTypes: ['violations'] });
    host.remove();

    expect(results.violations).toEqual([]);
  });
});

describe('the closing band', () => {
  it('shows the whole series, the page itself marked and not a link', async () => {
    const host = (await render('case-tes-potes-landing-page')).nativeElement as HTMLElement;
    const band = host.querySelector('app-dev-work');

    expect(squash(band?.querySelector('h2')?.textContent)).toBe('Série · Case Tes Potes');
    expect(band?.querySelectorAll('.row')).toHaveLength(3);
    const current = band?.querySelector('[aria-current="page"]');
    expect(current?.tagName).toBe('DIV');
    expect(current?.textContent).toContain('Case Tes Potes — landing page');
    expect(current?.textContent).toContain('Cette fiche');
    const links = Array.from(band?.querySelectorAll('a') ?? [], (a) => a.getAttribute('href'));
    expect(links).toEqual([
      '/developpeur/case-tes-potes-mobile',
      '/developpeur/case-tes-potes-web-app',
    ]);
  });

  it('ends a project outside a series on other work, never on itself', async () => {
    const host = (await render('kasa-openclassrooms')).nativeElement as HTMLElement;
    const band = host.querySelector('app-dev-work');
    const links = Array.from(band?.querySelectorAll('a') ?? [], (a) => a.getAttribute('href'));

    expect(squash(band?.querySelector('h2')?.textContent)).toBe('Autres réalisations');
    expect(links).toHaveLength(3);
    expect(links).not.toContain('/developpeur/kasa-openclassrooms');
    expect(band?.querySelector('[aria-current]')).toBeNull();
  });

  it('counts what it lists, with its span of years', async () => {
    const host = (await render('case-tes-potes-mobile')).nativeElement as HTMLElement;

    expect(squash(host.querySelector('.work__count')?.textContent)).toBe(
      '03 projets · 2021 – 2022',
    );
  });
});

describe('the hero', () => {
  it('places the project among all of them', async () => {
    const host = (await render('kasa-openclassrooms')).nativeElement as HTMLElement;

    expect(squash(host.querySelector('.crumbs__pos')?.textContent)).toBe('Projet 04 / 06');
    expect(host.querySelector('.back')?.getAttribute('href')).toBe('/developpeur');
  });

  it('names the series and year, then the role', async () => {
    const host = (await render('case-tes-potes-web-app')).nativeElement as HTMLElement;
    const halves = Array.from(host.querySelectorAll('.eyebrow > span'), (s) =>
      squash(s.textContent),
    );

    expect(halves).toEqual(['Case Tes Potes · 2021', 'Conception et développement']);
  });

  it('gives a project without a series its year alone', async () => {
    const host = (await render('pixmodels')).nativeElement as HTMLElement;

    expect(squash(host.querySelector('.eyebrow > span')?.textContent)).toBe('2015');
  });

  it('rebuilds the page on a step to another project, so its entrance plays again', async () => {
    const fixture = await render('case-tes-potes-mobile');
    const host = fixture.nativeElement as HTMLElement;
    const before = host.querySelector('h1');

    fixture.componentRef.setInput('slug', 'case-tes-potes-web-app');
    fixture.detectChanges();

    expect(host.querySelector('h1')).not.toBe(before);
    expect(spoken(host.querySelector('h1'))).toBe('Case Tes Potes — web app');
  });
});
