import {
  altTextSchema,
  confirmUploadInputSchema,
  localizedSlugSchema,
  localizedTextSchema,
  projectSchema,
} from '@portfolio/shared-types';
import { describe, expect, it } from 'vitest';

import { SITE_LOCALES } from '@core/i18n/site-locale';
import { ARTWORKS, PROJECTS, type StaticImage } from './static-content';

const IMAGES: readonly [string, StaticImage][] = [
  ...PROJECTS.map((p) => [`project ${p.slug.fr}`, p.cover] as [string, StaticImage]),
  ...PROJECTS.map((p) => [`presentation ${p.slug.fr}`, p.presentation] as [string, StaticImage]),
  ...ARTWORKS.map((a) => [`artwork ${a.slug.fr}`, a.image] as [string, StaticImage]),
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

describe.each(SITE_LOCALES)('alt text in %s', (locale) => {
  // The 2022 data used the title as its own alt text, typos included, which
  // makes a screen reader say the same words twice and describes nothing.
  it('never repeats the title it sits beside', () => {
    const repeats = [
      ...PROJECTS.map((p) => [p.title, p.cover.alt] as const),
      ...PROJECTS.map((p) => [p.title, p.presentation.alt] as const),
      ...ARTWORKS.map((a) => [a.title, a.image.alt] as const),
    ].filter(([title, alt]) => alt[locale].toLowerCase() === title[locale].toLowerCase());

    expect(repeats).toEqual([]);
  });

  it('is never empty', () => {
    for (const [, image] of IMAGES) {
      expect(image.alt[locale].trim().length).toBeGreaterThan(0);
    }
  });

  it('never repeats the caption beside a presentation visual', () => {
    for (const project of PROJECTS) {
      expect(project.presentation.alt[locale]).not.toBe(project.presentationCaption[locale]);
    }
  });
});

describe('presentation visuals', () => {
  // One file for both trees, named after the French slug: the English slug
  // must not leak into the key, or the English page would show nothing.
  it('are keyed on their own French slug, so no page can show another project', () => {
    for (const project of PROJECTS) {
      expect(project.presentation.key).toBe(`projects/${project.slug.fr}-presentation.jpg`);
    }
  });
});

// The fields the API will validate (spec 03): the static content is held to
// the same contract, so the swap to the API changes the source and not the
// copy. A video must be an https YouTube address the page can embed.
const projectContent = projectSchema.pick({
  id: true,
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

describe.each(PROJECTS.map((p) => [p.slug.fr, p] as const))('project %s', (_slug, project) => {
  it('meets the Project contract, in both languages', () => {
    const result = projectContent.safeParse({
      ...project,
      missionSteps: [...project.missionSteps],
      series: project.series ?? null,
      websiteUrl: project.websiteUrl ?? null,
      videoUrl: project.videoUrl ?? null,
    });

    expect(result.error?.issues ?? []).toEqual([]);
  });

  it('describes its pictures in both languages', () => {
    for (const image of [project.cover, project.presentation]) {
      expect(localizedTextSchema.safeParse(image.alt).success).toBe(true);
    }
  });

  it('links its demo root-relative, so it moves with the site (ADR-0005)', () => {
    if (project.websiteUrl?.startsWith('/')) {
      expect(project.websiteUrl).toMatch(/^\/demo\/[a-z0-9-]+$/);
    }
  });
});

describe.each(ARTWORKS.map((a) => [a.slug.fr, a] as const))('artwork %s', (_slug, artwork) => {
  it('has a slug, a title and an alt text in both languages', () => {
    expect(localizedSlugSchema.safeParse(artwork.slug).success).toBe(true);
    expect(localizedTextSchema.safeParse(artwork.title).success).toBe(true);
    expect(localizedTextSchema.safeParse(artwork.image.alt).success).toBe(true);
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

  // A record ships in both trees or in neither (ADR-0017): an English page
  // must never fall back to the French copy.
  it('refuses a project whose English is missing', () => {
    const [project] = PROJECTS;
    expect(projectContent.shape.title.safeParse(project.title).success).toBe(true);
    expect(projectContent.shape.title.safeParse({ fr: project.title.fr }).success).toBe(false);
  });

  // Each field, each language, empty and whitespace only: a blank side would
  // render an empty heading or line in that tree.
  describe.each(['title', 'summary', 'context', 'role', 'mission', 'presentationCaption'] as const)(
    '%s',
    (field) => {
      const [project] = PROJECTS;
      const accepts = (fr: string, en: string) =>
        projectContent.shape[field].safeParse({ fr, en }).success;

      it.each(['', '   '])('is refused blank (%j) in either language', (blank) => {
        expect(accepts(project[field].fr, project[field].en)).toBe(true);
        expect(accepts(blank, project[field].en)).toBe(false);
        expect(accepts(project[field].fr, blank)).toBe(false);
      });
    },
  );

  it('refuses a blank mission step in either language', () => {
    const step = projectContent.shape.missionSteps;
    expect(step.safeParse([{ fr: 'Un pas.', en: 'A step.' }]).success).toBe(true);
    expect(step.safeParse([{ fr: 'Un pas.', en: '  ' }]).success).toBe(false);
    expect(step.safeParse([{ fr: '', en: 'A step.' }]).success).toBe(false);
  });
});

describe('an alt text', () => {
  const alt = (fr: string, en: string) => altTextSchema.safeParse({ fr, en }).success;

  it('is written in both languages, or blank in both for a decorative image', () => {
    expect(alt('Tomates photoréalistes', 'Photorealistic tomatoes')).toBe(true);
    expect(alt('', '')).toBe(true);
    expect(alt('   ', '  ')).toBe(true);
  });

  it.each(['', '   '])('is refused blank (%j) in one language only', (blank) => {
    expect(alt('Tomates photoréalistes', blank)).toBe(false);
    expect(alt(blank, 'Photorealistic tomatoes')).toBe(false);
  });

  it('is decorative by default on upload, and held to the same rule when given', () => {
    const upload = (shape: Record<string, unknown>) =>
      confirmUploadInputSchema.safeParse({
        assetId: '6b7c2a0e-1f3d-4c5a-9e8b-2d4f6a8c0e11',
        ...shape,
      });
    expect(upload({}).data?.alt).toEqual({ fr: '', en: '' });
    expect(upload({ alt: { fr: 'Tomates', en: 'Tomatoes' } }).success).toBe(true);
    expect(upload({ alt: { fr: 'Tomates', en: '' } }).success).toBe(false);
    expect(upload({ alt: { fr: '   ', en: 'Tomatoes' } }).success).toBe(false);
  });

  it('is what every static image carries', () => {
    for (const [, image] of IMAGES) expect(altTextSchema.safeParse(image.alt).success).toBe(true);
  });

  it('holds each language to the slug rule', () => {
    expect(
      localizedSlugSchema.safeParse({ fr: 'salon-nuit', en: 'living-room-night' }).success,
    ).toBe(true);
    expect(localizedSlugSchema.safeParse({ fr: 'salon-nuit', en: 'Living room' }).success).toBe(
      false,
    );
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

describe('addresses', () => {
  // The switcher and the hreflang links go from one tree to the other through
  // the record's id.
  it('give every record its own id', () => {
    const ids = [...PROJECTS.map((p) => p.id), ...ARTWORKS.map((a) => a.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(SITE_LOCALES)('are unique and kebab-case within the %s tree', (locale) => {
    for (const records of [PROJECTS, ARTWORKS]) {
      const slugs = records.map((r) => r.slug[locale]);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });
});
