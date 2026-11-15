import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  altTextSchema,
  confirmUploadInputSchema,
  localizedSlugSchema,
  localizedTextSchema,
  projectSchema,
} from '@portfolio/shared-types';
import { describe, expect, it } from 'vitest';

import { SITE_LOCALES } from '@core/i18n/site-locale/site-locale';
import { ARTWORKS, PROJECTS, type StaticImage } from './static-content';

const IMAGES: readonly (readonly [string, StaticImage])[] = [
  ...PROJECTS.flatMap((p) => (p.cover ? [[`project ${p.slug.fr}`, p.cover] as const] : [])),
  ...PROJECTS.flatMap((p) =>
    p.presentation ? [[`presentation ${p.slug.fr}`, p.presentation] as const] : [],
  ),
  ...ARTWORKS.map((a) => [`artwork ${a.slug.fr}`, a.image] as const),
];

const REFERENCES = PROJECTS.filter((p) => p.logo);
const CASE_STUDIES = PROJECTS.filter((p) => !p.logo);

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
      ...PROJECTS.flatMap((p) =>
        [p.cover, p.presentation, p.logo].flatMap((image) =>
          image ? [[p.title, image.alt] as const] : [],
        ),
      ),
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
    for (const project of CASE_STUDIES) {
      expect(project.presentation?.alt[locale]).not.toBe(project.presentationCaption?.[locale]);
    }
  });
});

describe('presentation visuals', () => {
  // One file for both trees, named after the French slug: the English slug
  // must not leak into the key, or the English page would show nothing.
  it('are keyed on their own French slug, so no page can show another project', () => {
    for (const project of CASE_STUDIES) {
      expect(project.presentation?.key).toBe(`projects/${project.slug.fr}-presentation.jpg`);
    }
  });
});

describe('client references', () => {
  // A reference shows its client's logo and nothing of the client's product
  // (Stéphane, 2026-11-15); a case study shows its own screens. Never half of each.
  it.each(PROJECTS.map((p) => [p.slug.fr, p] as const))(
    '%s shows a logo or its own visuals, never both, never neither',
    (_slug, project) => {
      const visuals = [project.cover, project.presentation, project.presentationCaption];
      if (project.logo) expect(visuals).toEqual([undefined, undefined, undefined]);
      else expect(visuals.every(Boolean)).toBe(true);
    },
  );

  // The file is the swap point: a logo dropped in under the slug replaces the
  // placeholder with no code change, so the path must follow the slug.
  it.each(REFERENCES.map((p) => [p.slug.fr, p] as const))(
    '%s draws its logo from public/logos/clients, keyed on its French slug',
    (_slug, project) => {
      expect(project.logo?.src).toMatch(
        new RegExp(`^/logos/clients/${project.slug.fr}\\.(svg|png)$`),
      );
    },
  );

  // A mask paints only what the file covers: a logo the app does not ship,
  // or an SVG carrying a script, would leave an empty plate or worse.
  it.each(REFERENCES.map((p) => [p.slug.fr, p] as const))(
    '%s ships its logo file, an inert image',
    (_slug, project) => {
      const file = join(process.cwd(), 'public', project.logo!.src);
      expect(existsSync(file), file).toBe(true);
      if (file.endsWith('.svg')) expect(readFileSync(file, 'utf8')).not.toMatch(/<script|on\w+=/i);
    },
  );

  it('are the Web-Atrio missions, and only they', () => {
    expect(REFERENCES.map((p) => p.series)).toEqual(REFERENCES.map(() => 'Web-Atrio'));
  });

  it('never name the Ledger product, in either language', () => {
    const ledger = JSON.stringify(PROJECTS.find((p) => p.slug.fr === 'ledger'));
    expect(ledger).not.toMatch(/recover/i);
  });
});

describe('periods', () => {
  // Work still going on reads « 2025 – aujourd’hui »: it must say where it began.
  it('give work still going on a start', () => {
    for (const project of PROJECTS.filter((p) => p.releasedAt === null)) {
      expect(project.startedAt, project.slug.fr).toBeDefined();
    }
  });

  it('never end before they start', () => {
    for (const { startedAt, releasedAt, slug } of PROJECTS) {
      if (startedAt && releasedAt) expect(startedAt <= releasedAt, slug.fr).toBe(true);
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
  googlePlayUrl: true,
  presentationCaption: true,
  startedAt: true,
  releasedAt: true,
});

describe.each(PROJECTS.map((p) => [p.slug.fr, p] as const))('project %s', (_slug, project) => {
  it('meets the Project contract, in both languages', () => {
    const result = projectContent.safeParse({
      ...project,
      missionSteps: [...project.missionSteps],
      mission: project.mission ?? null,
      series: project.series ?? null,
      websiteUrl: project.websiteUrl ?? null,
      videoUrl: project.videoUrl ?? null,
      googlePlayUrl: project.googlePlayUrl ?? null,
      presentationCaption: project.presentationCaption ?? null,
      startedAt: project.startedAt ?? null,
    });

    expect(result.error?.issues ?? []).toEqual([]);
  });

  it('describes its pictures in both languages', () => {
    for (const image of [project.cover, project.presentation, project.logo]) {
      if (image) expect(localizedTextSchema.safeParse(image.alt).success).toBe(true);
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

  it('takes an app’s own Google Play page only', () => {
    const store = (googlePlayUrl: string) =>
      projectContent.shape.googlePlayUrl.safeParse(googlePlayUrl).success;
    expect(store('https://play.google.com/store/apps/details?id=com.cir.scancir&hl=fr')).toBe(true);
    expect(store('http://play.google.com/store/apps/details?id=com.cir.scancir')).toBe(false);
    expect(store('https://play.google.com.evil.fr/store/apps/details?id=x')).toBe(false);
    expect(store('https://apps.apple.com/app/id1')).toBe(false);
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
      const accepts = (fr: string, en: string) =>
        projectContent.shape[field].safeParse({ fr, en }).success;

      it.each(['', '   '])('is refused blank (%j) in either language', (blank) => {
        expect(accepts('Un texte.', 'A text.')).toBe(true);
        expect(accepts(blank, 'A text.')).toBe(false);
        expect(accepts('Un texte.', blank)).toBe(false);
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
