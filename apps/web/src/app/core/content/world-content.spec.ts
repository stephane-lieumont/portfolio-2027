import {
  contactPageSchema,
  siteSettingsSchema,
  worldPageSchema,
  worldStackSchema,
} from '@portfolio/shared-types';
import { describe, expect, it } from 'vitest';

import {
  CONTACT_PAGE,
  SITE_SETTINGS,
  STATIC_ASSETS,
  STATIC_FILES,
  WORLD_PAGES,
  WORLD_STACKS,
} from './world-content';

// The static content stands in for the API. If it drifts from the schemas the
// API will validate against, the swap stops being a change of source and the
// back office rejects what the site happily rendered.
describe('static world content', () => {
  it.each(['dev', 'cgi'] as const)('the %s page satisfies its schema', (world) => {
    expect(worldPageSchema.parse(WORLD_PAGES[world])).toEqual(WORLD_PAGES[world]);
  });

  it.each(['dev', 'cgi'] as const)('the %s stack satisfies its schema', (world) => {
    expect(worldStackSchema.parse(WORLD_STACKS[world])).toEqual(WORLD_STACKS[world]);
  });

  it('keys each record by the world it declares', () => {
    for (const world of ['dev', 'cgi'] as const) {
      expect(WORLD_PAGES[world].world).toBe(world);
      expect(WORLD_STACKS[world].world).toBe(world);
    }
  });

  it('keeps the contact page and site settings valid', () => {
    expect(contactPageSchema.parse(CONTACT_PAGE)).toEqual(CONTACT_PAGE);
    expect(siteSettingsSchema.parse(SITE_SETTINGS)).toEqual(SITE_SETTINGS);
  });

  it('resolves every asset it references', () => {
    expect(STATIC_ASSETS[CONTACT_PAGE.portraitAssetId]).toBeDefined();
    expect(STATIC_FILES[SITE_SETTINGS.cvAssetId]).toBe('/cv-stephane-lieumont.pdf');
  });

  // /medias is proxied to the bucket: a public/ file under it would 404 in
  // production while working from the dev server's own static files.
  it.each(Object.entries(STATIC_ASSETS))('serves asset %s from public/, root-relative', (_, a) => {
    expect(a.src).toMatch(/^\/[a-z0-9/-]+\.(png|jpe?g|webp|avif)$/);
    expect(a.src.startsWith('/medias/')).toBe(false);
    expect(a.alt.trim()).not.toBe('');
  });

  // Stéphane's address is never published in the HTML, so harvesters cannot
  // collect it; the contact form is the way in.
  it('publishes no email address', () => {
    const everything = JSON.stringify([WORLD_PAGES, WORLD_STACKS, CONTACT_PAGE, SITE_SETTINGS]);
    expect(everything).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });
});

describe('world content schemas', () => {
  it('rejects a tool from the other world', () => {
    const crossed = {
      ...WORLD_STACKS.cgi,
      entries: [{ ...WORLD_STACKS.cgi.entries[0], tool: 'angular' }],
    };
    expect(worldStackSchema.safeParse(crossed).success).toBe(false);
  });

  it('rejects a tool listed twice', () => {
    const [first] = WORLD_STACKS.dev.entries;
    const doubled = {
      ...WORLD_STACKS.dev,
      entries: [first, first, ...WORLD_STACKS.dev.entries.slice(1)],
    };
    expect(worldStackSchema.safeParse(doubled).success).toBe(false);
  });

  it('takes a role word in capitals, accents included, and nothing else', () => {
    const role = (roleWord: string) =>
      worldPageSchema.safeParse({ ...WORLD_PAGES.dev, roleWord }).success;
    expect(role('ŒUVRE ÉCRITE')).toBe(true);
    expect(role('Lead tech')).toBe(false);
    expect(role('   ')).toBe(false);
    expect(role('LEAD  TECH')).toBe(false);
    expect(role('×××')).toBe(false);
    expect(role('DÉVELOPPEUR FULLSTACK')).toBe(false);
  });

  it('rejects an eyebrow tool listed twice', () => {
    const page = { ...WORLD_PAGES.dev, eyebrowTools: ['angular', 'angular'] };
    expect(worldPageSchema.safeParse(page).success).toBe(false);
  });

  // The icon and its accessible name come from `kind`: a LinkedIn icon must not
  // lead anywhere else.
  it('rejects a social link that does not go to its network', () => {
    const linkedin = (url: string) =>
      siteSettingsSchema.safeParse({ ...SITE_SETTINGS, socials: [{ kind: 'linkedin', url }] })
        .success;
    expect(linkedin('https://www.linkedin.com/in/stephane-lieumont/')).toBe(true);
    expect(linkedin('https://evil.example/stephane')).toBe(false);
    expect(linkedin('https:www.linkedin.com')).toBe(false);
  });

  it('rejects markup smuggled into a social link', () => {
    const settings = {
      ...SITE_SETTINGS,
      socials: [{ kind: 'github', url: 'javascript:alert(1)' }],
    };
    expect(siteSettingsSchema.safeParse(settings).success).toBe(false);
  });
});
