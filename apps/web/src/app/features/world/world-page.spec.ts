import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WORLD_PAGES } from '../../core/content/world-content';
import { MEDIA_BASE_URL } from '../../core/media.config';
import { ARTWORKS, PROJECTS } from '../../core/static-content';
import { WorldPage } from './world-page';

function render(world: 'dev' | 'cgi'): HTMLElement {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: MEDIA_BASE_URL, useValue: '/medias' },
    ],
  });
  const fixture = TestBed.createComponent(WorldPage);
  fixture.componentRef.setInput('world', world);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('WorldPage', () => {
  beforeEach(() => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null));
  afterEach(() => vi.restoreAllMocks());

  it('lists the world’s facts as label and value pairs, in their order', () => {
    const rows = Array.from(render('dev').querySelectorAll('.facts > div'));
    expect(
      rows.map((r) => [r.querySelector('dt')?.textContent, r.querySelector('dd')?.textContent]),
    ).toEqual(WORLD_PAGES.dev.facts.map((f) => [f.label, f.value]));
  });

  it('sets the lede’s lead in bold before the rest of the line', () => {
    const lede = render('cgi').querySelector('.lede')!;
    expect(lede.querySelector('strong')?.textContent).toBe(WORLD_PAGES.cgi.lede.lead);
    expect(lede.textContent).toContain(WORLD_PAGES.cgi.lede.text);
  });

  it('offers contact and the CV, the CV as a root-relative file opening in a new tab', () => {
    const ctas = Array.from(render('dev').querySelectorAll<HTMLAnchorElement>('.ctas a'));
    expect(ctas.map((a) => a.getAttribute('href'))).toEqual([
      '/contact',
      '/cv-stephane-lieumont.pdf',
    ]);
    expect(ctas[1].getAttribute('target')).toBe('_blank');
    expect(ctas[1].textContent).toContain('nouvel onglet');
  });

  it('counts the work it shows, with the span of years, in each world', () => {
    const years = (iso: readonly string[]) => iso.map((d) => Number(d.slice(0, 4)));
    const dev = render('dev').querySelector('.work__count')!.textContent?.trim();
    const devYears = years(PROJECTS.map((p) => p.releasedAt));
    expect(dev).toBe(
      `${String(PROJECTS.length).padStart(2, '0')} projets · ${Math.min(...devYears)} – ${Math.max(...devYears)}`,
    );
    TestBed.resetTestingModule();
    const cgi = render('cgi').querySelector('.work__count')!.textContent;
    expect(cgi).toContain(`${ARTWORKS.length} projets · 2014 – 2016`);
  });

  it('shows every project as a card leading to its page', () => {
    const links = Array.from(render('dev').querySelectorAll('.row__link'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual(
      PROJECTS.map((p) => `/developpeur/${p.slug}`),
    );
  });

  it('gives every 3D piece a tile linking to its own address', () => {
    const tiles = Array.from(render('cgi').querySelectorAll('.tile__btn'));
    expect(tiles.map((a) => a.getAttribute('href'))).toEqual(
      ARTWORKS.map((a) => `/graphisme-3d/${a.slug}`),
    );
    expect(tiles[0].getAttribute('aria-label')).toBe(`${ARTWORKS[0].title} (2016), agrandir`);
  });

  it('plays the full intro on the page the site was loaded on', () => {
    const host = render('dev');
    expect(host.classList.contains('entrance--intro')).toBe(true);
    expect(host.style.getPropertyValue('--entrance-base')).toBe('1088ms');
  });
});
