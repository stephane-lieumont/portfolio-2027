import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { MEDIA_BASE_URL } from '../../core/media.config';
import { ARTWORKS } from '../../core/static-content';
import { Gallery } from './gallery';

async function render(): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [Gallery],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: MEDIA_BASE_URL, useValue: '/medias' },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(Gallery);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('Gallery', () => {
  it('shows every piece', async () => {
    const host = await render();
    expect(host.querySelectorAll('.tile')).toHaveLength(ARTWORKS.length);
  });

  it('names the piece and its tools at rest, on every device', async () => {
    const host = await render();
    const first = host.querySelector('.tile');

    // The current site puts the title and the year in a `:hover` with no
    // `@media (hover: hover)`, so on a phone the gallery is sixteen anonymous
    // tiles. This is the defect that must never come back: the text is in the
    // markup, not in a hover state.
    expect(first?.querySelector('h3')?.textContent?.trim()).toBe(ARTWORKS[0].title);
    const meta = first?.querySelector('.tile__meta')?.textContent ?? '';
    expect(meta).toContain(ARTWORKS[0].releasedAt.slice(0, 4));
    expect(meta).toContain('3ds Max');
  });

  it('resolves every image through the injected media base', async () => {
    const host = await render();
    const images = Array.from(host.querySelectorAll<HTMLImageElement>('.tile__image'));

    expect(images).toHaveLength(ARTWORKS.length);
    images.forEach((img, i) => {
      expect(img.getAttribute('src')).toBe(`/medias/${ARTWORKS[i].image.key}`);
      expect(img.getAttribute('alt')).toBe(ARTWORKS[i].image.alt);
      expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
      expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
    });
  });

  it('loads the first screenful eagerly and the rest lazily', async () => {
    const host = await render();
    const loading = Array.from(host.querySelectorAll<HTMLImageElement>('.tile__image')).map((img) =>
      img.getAttribute('loading'),
    );

    expect(loading.slice(0, 4).every((l) => l === 'eager')).toBe(true);
    expect(loading.slice(4).every((l) => l === 'lazy')).toBe(true);
  });

  it('marks the featured pieces, and not all of them', async () => {
    const host = await render();
    const featured = host.querySelectorAll('.tile--featured');
    const expected = ARTWORKS.filter((a) => a.featured).length;

    expect(featured).toHaveLength(expected);
    expect(expected).toBeGreaterThan(0);
    expect(expected).toBeLessThan(ARTWORKS.length);
  });
});
