import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { MEDIA_BASE_URL, mediaSrcset } from './media.config';
import { ARTWORKS, PROJECTS } from '../data/static-content';

describe('mediaSrcset', () => {
  let srcset: ReturnType<typeof mediaSrcset>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MEDIA_BASE_URL, useValue: '/medias/' }],
    });
    srcset = TestBed.runInInjectionContext(() => mediaSrcset());
  });

  it('lists the three WebP widths beside the key, under the media base', () => {
    expect(srcset('cgi/escart-wild.jpg', 1280)).toBe(
      '/medias/cgi/escart-wild-640.webp 640w, /medias/cgi/escart-wild-960.webp 960w, /medias/cgi/escart-wild-1280.webp 1280w',
    );
  });

  it('declares a derivative at its real width, never wider than the original', () => {
    expect(srcset('cgi/legos-minions.jpg', 1200)).toMatch(/legos-minions-1280\.webp 1200w$/);
    expect(srcset('projects/pixmodels.jpg', 400)).toBe('/medias/projects/pixmodels-640.webp 400w');
  });
});

describe('the images in the static content', () => {
  const images = [...PROJECTS.map((p) => p.cover), ...ARTWORKS.map((a) => a.image)];

  it('are bucket keys, never URLs, and each carries its plate tone', () => {
    for (const image of images) {
      expect(image.key).toMatch(/^(projects|cgi)\/[a-z0-9-]+\.jpg$/);
      expect(image.averageColor, image.key).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
