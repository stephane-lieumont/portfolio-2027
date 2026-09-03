import { describe, expect, it } from 'vitest';

import { ARTWORKS, PROJECTS, type StaticImage } from './static-content';

const IMAGES: readonly [string, StaticImage][] = [
  ...PROJECTS.map((p) => [`project ${p.slug}`, p.cover] as [string, StaticImage]),
  ...ARTWORKS.map((a) => [`artwork ${a.slug}`, a.image] as [string, StaticImage]),
];

// The images live in MinIO, so nothing here can prove an object exists — that
// is what `pnpm --filter @portfolio/api media:seed` reports, and it exits
// non-zero on a missing source. What is checkable here is the shape of the key:
// a bucket key that is accidentally a URL, or carries a leading slash, joins
// into a broken address and still typechecks.
describe.each(IMAGES)('%s image', (_name, image) => {
  it('is a bucket key, not a URL', () => {
    expect(image.key).toMatch(/^(cgi|projects)\/[a-z0-9-]+\.jpg$/);
  });

  it('declares an intrinsic size', () => {
    expect(image.width).toBeGreaterThan(0);
    expect(image.height).toBeGreaterThan(0);
  });
});

describe('alt text', () => {
  // The 2022 data used the title as its own alt text, typos included, which
  // makes a screen reader say the same words twice and describes nothing.
  it('never repeats the title it sits beside', () => {
    const repeats = [
      ...PROJECTS.map((p) => [p.title, p.cover.alt] as const),
      ...ARTWORKS.map((a) => [a.title, a.image.alt] as const),
    ].filter(([title, alt]) => alt.toLowerCase() === title.toLowerCase());

    expect(repeats).toEqual([]);
  });

  it('is never empty', () => {
    for (const [, image] of IMAGES) {
      expect(image.alt.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('ordering', () => {
  // Spec 03 settles on releasedAt descending with no manual sort field: two
  // sources of truth for order always drift.
  it('lists projects newest first', () => {
    const dates = PROJECTS.map((p) => p.releasedAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it('lists artworks newest first', () => {
    const dates = ARTWORKS.map((a) => a.releasedAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});

describe('slugs', () => {
  it('are unique and kebab-case', () => {
    const slugs = [...PROJECTS.map((p) => p.slug), ...ARTWORKS.map((a) => a.slug)];

    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });
});
