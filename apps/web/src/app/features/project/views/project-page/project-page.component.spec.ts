import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { MEDIA_BASE_URL } from '@core/config/media-config/media.config';
import { PROJECTS } from '@core/data/static-content/static-content';
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
    // A one-sentence reference's summary is its context: nothing else to show.
    if (project.summary.fr !== project.context.fr) expect(text).not.toContain(project.summary.fr);
  });

  it('lists the mission and every step and tool, in order, and no empty block', async () => {
    const host = (await render(slug)).nativeElement as HTMLElement;

    // The role is the eyebrow's; the Mission block never says it again.
    expect(squash(host.querySelector('#mission-title')?.parentElement?.textContent)).not.toContain(
      project.role.fr,
    );
    expect(Boolean(host.querySelector('#mission-title'))).toBe(
      Boolean(project.mission || project.missionSteps.length),
    );
    expect(host.querySelector('.mission__text')?.textContent?.trim()).toBe(project.mission?.fr);
    expect(Boolean(host.querySelector('.steps'))).toBe(project.missionSteps.length > 0);
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

  it('links the video exactly when the project has one, and embeds nothing', async () => {
    const host = (await render(slug)).nativeElement as HTMLElement;
    const button = Array.from(host.querySelectorAll('.ctas a')).find((a) =>
      a.textContent?.includes('Voir la vidéo'),
    );

    expect(button?.getAttribute('href')).toBe(project.videoUrl);
    // A link out, never an embed: nothing from YouTube is on the page.
    expect(host.querySelector('iframe, #video')).toBeNull();
  });

  it('opens on its presentation visual or, for a client, on its named logo and no screenshot', async () => {
    const host = (await render(slug)).nativeElement as HTMLElement;
    const img = host.querySelector<HTMLImageElement>('.fig__img');
    const logo = host.querySelector('.fig app-client-logo');

    if (project.logo) {
      expect(img).toBeNull();
      expect(host.querySelector('figcaption')).toBeNull();
      const mark = logo?.querySelector('img');
      expect(mark?.getAttribute('src')).toBe(project.logo.src);
      expect(mark?.getAttribute('alt')).toBe(project.logo.alt.fr);
      return;
    }
    const presentation = project.presentation!;
    expect(logo).toBeNull();
    expect(img?.getAttribute('src')).toBe(`/medias/${presentation.key}`);
    expect(img?.getAttribute('srcset')).toContain(
      `/medias/${presentation.key.replace(/\.jpg$/, '-640.webp')} 640w`,
    );
    expect(img?.getAttribute('fetchpriority')).toBe('high');
    expect(squash(host.querySelector('figcaption')?.textContent)).toBe(
      `Fig.${project.presentationCaption?.fr}`,
    );
  });

  it('shows « Voir sur Google Play » exactly when the app is on the store, in a new tab', async () => {
    const host = (await render(slug)).nativeElement as HTMLElement;
    const store = Array.from(host.querySelectorAll<HTMLAnchorElement>('.ctas a')).find((a) =>
      a.textContent?.includes('Voir sur Google Play'),
    );

    expect(store?.getAttribute('href')).toBe(project.googlePlayUrl);
    if (store) expect(store.getAttribute('target')).toBe('_blank');
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

    expect(squash(band?.querySelector('h2')?.textContent)).toBe('Chez Case Tes Potes');
    expect(band?.querySelectorAll('.row')).toHaveLength(2);
    const current = band?.querySelector('[aria-current="page"]');
    expect(current?.tagName).toBe('DIV');
    expect(current?.textContent).toContain('Case Tes Potes — landing page');
    expect(current?.textContent).toContain('Cette fiche');
    const links = Array.from(band?.querySelectorAll('a') ?? [], (a) => a.getAttribute('href'));
    expect(links).toEqual(['/developpeur/case-tes-potes-mobile']);
  });

  it('ends a client mission on the other Web-Atrio missions, read as an employer would', async () => {
    const host = (await render('ledger')).nativeElement as HTMLElement;
    const band = host.querySelector('app-dev-work');
    const links = Array.from(band?.querySelectorAll('a') ?? [], (a) => a.getAttribute('href'));

    expect(squash(band?.querySelector('h2')?.textContent)).toBe('Chez Web-Atrio');
    expect(links).toEqual([
      '/developpeur/immobilier-ch',
      '/developpeur/web-atrio',
      '/developpeur/cir-scancir',
      '/developpeur/linxea',
    ]);
    expect(squash(host.querySelector('.work__count')?.textContent)).toBe(
      '05 projets · 2022 – aujourd’hui',
    );
  });

  it('shows each client card’s logo as decoration beside its title, never a screenshot', async () => {
    const band = ((await render('ledger')).nativeElement as HTMLElement).querySelector(
      'app-dev-work',
    );

    const logos = Array.from(band?.querySelectorAll('img') ?? []);
    expect(logos).toHaveLength(5);
    for (const logo of logos) {
      expect(logo.closest('app-client-logo')).not.toBeNull();
      expect(logo.getAttribute('src')).toMatch(/^\/logos\/clients\//);
      expect(logo.getAttribute('alt')).toBe('');
    }
  });
});

describe('the hero', () => {
  it('places the project among all of them', async () => {
    const host = (await render('linxea')).nativeElement as HTMLElement;

    expect(squash(host.querySelector('.crumbs__pos')?.textContent)).toBe('Projet 04 / 07');
    expect(host.querySelector('.back')?.getAttribute('href')).toBe('/developpeur');
  });

  it('names the series and the period, then the role', async () => {
    const host = (await render('linxea')).nativeElement as HTMLElement;
    const halves = Array.from(host.querySelectorAll('.eyebrow > span'), (s) =>
      squash(s.textContent),
    );

    expect(halves).toEqual(['Web-Atrio · 2023 – 2024', 'Référent technique de la squad — React']);
  });

  it('runs a mission still going on to today', async () => {
    const host = (await render('immobilier-ch')).nativeElement as HTMLElement;

    expect(squash(host.querySelector('.eyebrow > span')?.textContent)).toBe(
      'Web-Atrio · 2025 – aujourd’hui',
    );
  });

  it('rebuilds the page on a step to another project, so its entrance plays again', async () => {
    const fixture = await render('case-tes-potes-mobile');
    const host = fixture.nativeElement as HTMLElement;
    const before = host.querySelector('h1');

    fixture.componentRef.setInput('slug', 'case-tes-potes-landing-page');
    fixture.detectChanges();

    expect(host.querySelector('h1')).not.toBe(before);
    expect(spoken(host.querySelector('h1'))).toBe('Case Tes Potes — landing page');
  });
});
