import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ARTWORKS, PROJECTS } from '@core/data/content/content.generated';
import { MEDIA_BASE_URL, mediaSrcset } from './media.config';

describe('mediaSrcset', () => {
  let srcset: ReturnType<typeof mediaSrcset>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MEDIA_BASE_URL, useValue: '/medias/' }],
    });
    srcset = TestBed.runInInjectionContext(() => mediaSrcset());
  });

  it('lists the WebP widths up to the original’s beside the key, under the media base', () => {
    expect(srcset('cgi/escart-wild.jpg', 1280)).toBe(
      '/medias/cgi/escart-wild-640.webp 640w, /medias/cgi/escart-wild-960.webp 960w, /medias/cgi/escart-wild-1280.webp 1280w',
    );
  });

  it('names and declares every derivative at its real width, never above the original', () => {
    expect(srcset('cgi/legos-minions.jpg', 1200)).toMatch(
      /legos-minions-960\.webp 960w, \/medias\/cgi\/legos-minions-1200\.webp 1200w$/,
    );
    expect(srcset('projects/case-tes-potes-mobile.jpg', 400)).toBe(
      '/medias/projects/case-tes-potes-mobile-400.webp 400w',
    );
    expect(srcset('cgi/large.jpg', 4000)).toMatch(/large-2560\.webp 2560w$/);
  });

  it('never lists a candidate whose name and width disagree', () => {
    for (const width of [400, 640, 900, 1080, 1100, 1280, 1920, 2400, 2560, 5000]) {
      for (const candidate of srcset('cgi/x.jpg', width).split(', ')) {
        const [url, descriptor] = candidate.split(' ');
        expect(url.match(/-(\d+)\.webp$/)?.[1] + 'w').toBe(descriptor);
        expect(parseInt(descriptor, 10)).toBeLessThanOrEqual(width);
      }
    }
  });
});

describe('the images in the content', () => {
  const images = [
    ...PROJECTS.flatMap((p) => (p.cover ? [p.cover] : [])),
    ...ARTWORKS.map((a) => a.image),
  ];

  it('are bucket keys, never URLs, and each carries its plate tone', () => {
    for (const image of images) {
      expect(image.key).toMatch(/^(projects|cgi)\/[a-z0-9-]+\.jpg$/);
      expect(image.averageColor, image.key).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
