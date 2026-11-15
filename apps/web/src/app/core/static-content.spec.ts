import { projectSchema } from '@portfolio/shared-types';
import { describe, expect, it } from 'vitest';

import { ARTWORKS, PROJECTS, type StaticImage } from './static-content';

const IMAGES: readonly [string, StaticImage][] = [
  ...PROJECTS.map((p) => [`project ${p.slug}`, p.cover] as [string, StaticImage]),
  ...PROJECTS.map((p) => [`presentation ${p.slug}`, p.presentation] as [string, StaticImage]),
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
      ...PROJECTS.map((p) => [p.title, p.presentation.alt] as const),
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

describe('presentation visuals', () => {
  it('sit beside a caption they never repeat', () => {
    for (const project of PROJECTS) {
      expect(project.presentation.alt).not.toBe(project.presentationCaption);
    }
  });

  it('are keyed on their own slug, so no page can show another project', () => {
    for (const project of PROJECTS) {
      expect(project.presentation.key).toBe(`projects/${project.slug}-presentation.jpg`);
    }
  });
});

// The fields the API will validate (spec 03): the static content is held to
// the same contract, so the swap to the API changes the source and not the
// copy. A video must be an https YouTube address the page can embed.
const projectContent = projectSchema.pick({
  slug: true,
  title: true,
  summary: true,
  context: true,
  role: true,
  mission: true,
  missionSteps: true,
  series: true,
  websiteUrl: true,
  videoUrl: true,
  presentationCaption: true,
  releasedAt: true,
});

describe.each(PROJECTS.map((p) => [p.slug, p] as const))('project %s', (_slug, project) => {
  it('meets the Project contract', () => {
    const result = projectContent.safeParse({
      ...project,
      missionSteps: [...project.missionSteps],
      series: project.series ?? null,
      websiteUrl: project.websiteUrl ?? null,
      videoUrl: project.videoUrl ?? null,
    });

    expect(result.error?.issues ?? []).toEqual([]);
  });

  it('links its demo root-relative, so it moves with the site (ADR-0005)', () => {
    if (project.websiteUrl?.startsWith('/')) {
      expect(project.websiteUrl).toMatch(/^\/demo\/[a-z0-9-]+$/);
    }
  });
});

describe('the Project contract', () => {
  const field = (shape: Record<string, unknown>) =>
    projectContent.pick({ websiteUrl: true, videoUrl: true }).safeParse(shape).success;

  it('takes a demo path or an https site', () => {
    expect(field({ websiteUrl: '/demo/x', videoUrl: null })).toBe(true);
    expect(field({ websiteUrl: 'https://example.fr/', videoUrl: null })).toBe(true);
  });

  it('refuses a site over http, protocol-relative, or a script', () => {
    for (const websiteUrl of ['http://example.fr', '//example.fr', 'javascript:alert(1)']) {
      expect(field({ websiteUrl, videoUrl: null })).toBe(false);
    }
  });

  it('takes a YouTube video only', () => {
    expect(field({ websiteUrl: null, videoUrl: 'https://youtu.be/dQw4w9WgXcQ' })).toBe(true);
    expect(field({ websiteUrl: null, videoUrl: 'https://vimeo.com/1' })).toBe(false);
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
