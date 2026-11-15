import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The app's own modules as the English build evaluates them. SITE_LOCALE is
 * read from `$localize.locale` once, at import, as the localize step inlines
 * it per tree; re-importing under `en` gives the English tree's paths, slugs
 * and copy. Angular itself is shared, so TestBed renders them as usual. The
 * interface strings stay in the source language: the test runtime carries no
 * translations, and the prerender check covers those.
 */
async function english() {
  vi.resetModules();
  const previous = $localize.locale;
  $localize.locale = 'en';
  try {
    const [content, media, devWork, mosaic, hero] = await Promise.all([
      import('@core/data/static-content'),
      import('@core/config/media.config'),
      import('@common/components/dev-work/dev-work.component'),
      import('@features/world/components/art-mosaic/art-mosaic.component'),
      import('@features/project/components/project-hero/project-hero.component'),
    ]);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: media.MEDIA_BASE_URL, useValue: '/medias' },
      ],
    });
    return { ...content, ...devWork, ...mosaic, ...hero };
  } finally {
    $localize.locale = previous;
  }
}

afterEach(() => vi.resetModules());

describe('the English tree', () => {
  it('leads every project card to its English slug, under its English title and alt', async () => {
    const { DevWorkComponent, PROJECTS } = await english();
    const fixture = TestBed.createComponent(DevWorkComponent);
    fixture.detectChanges();
    const cards = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.row__link'));

    expect(cards.map((a) => a.getAttribute('href'))).toEqual(
      PROJECTS.map((p) => `/developer/${p.slug.en}`),
    );
    expect(cards.map((a) => a.querySelector('.row__title')?.textContent)).toEqual(
      PROJECTS.map((p) => p.title.en),
    );
    expect(cards.map((a) => a.querySelector('img')?.getAttribute('alt'))).toEqual(
      PROJECTS.map((p) => p.cover.alt.en),
    );
  });

  it('leads every tile to the piece’s English slug, named by its English title', async () => {
    const { ArtMosaicComponent, ARTWORKS } = await english();
    const fixture = TestBed.createComponent(ArtMosaicComponent);
    fixture.detectChanges();
    const tiles = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.tile__btn'));

    expect(tiles.map((a) => a.getAttribute('href'))).toEqual(
      ARTWORKS.map((a) => `/3d-art/${a.slug.en}`),
    );
    tiles.forEach((tile, i) => {
      expect(tile.getAttribute('aria-label')).toContain(ARTWORKS[i].title.en);
    });
  });

  it('sends a project’s video link to its English page, under its English title and role', async () => {
    const { ProjectHeroComponent, PROJECTS } = await english();
    const project = PROJECTS.find((p) => p.slug.fr !== p.slug.en)!;
    const fixture = TestBed.createComponent(ProjectHeroComponent);
    fixture.componentRef.setInput('project', {
      ...project,
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
    fixture.componentRef.setInput('rank', '05');
    fixture.componentRef.setInput('total', '06');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('a[href*="#video"]')?.getAttribute('href')).toBe(
      `/developer/${project.slug.en}#video`,
    );
    expect(host.querySelector('h1 .visually-hidden')?.textContent).toBe(project.title.en);
    expect(host.querySelector('.eyebrow')?.textContent).toContain(project.role.en);
  });
});
