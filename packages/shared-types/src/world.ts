import { z } from 'zod';

import { LOCALES, localized } from './localized.js';
import { softwareSlugSchema, technologySlugSchema } from './project.js';

/**
 * Editorial content of the two worlds and the contact page — see spec 03,
 * « World content ». Everything here is administrable; anything that is
 * presentation (the name, the switch labels, the cloud glyph, colours, section
 * headings, form labels) stays in the app and out of these schemas.
 *
 * Every text field is plain text, never markup, written in each of the site's
 * languages (ADR-0017) and held to the same rule in each. Order is array
 * order: facts, tools and points have no date to sort on, and their order is
 * the argument.
 */

export const worldKeySchema = z.enum(['dev', 'cgi']);
export type WorldKey = z.infer<typeof worldKeySchema>;

const text = (min: number, max: number) => z.string().trim().min(min).max(max);

const uniqueBy =
  <T>(key: (item: T) => string) =>
  (items: readonly T[]) =>
    new Set(items.map(key)).size === items.length;

/** Unique in every language: two facts may not share a label in either tree. */
const uniqueInEachLocale =
  <T>(key: (item: T) => { readonly fr: string; readonly en: string }) =>
  (items: readonly T[]) =>
    LOCALES.every((locale) => uniqueBy((item: T) => key(item)[locale])(items));

export const factSchema = z.object({
  label: localized(text(1, 24)),
  value: localized(text(1, 80)),
});
export type Fact = z.infer<typeof factSchema>;

export const ledeSchema = z.object({
  /** Set in bold before the rest of the line. */
  lead: localized(text(1, 80)),
  text: localized(text(1, 200)),
});
export type Lede = z.infer<typeof ledeSchema>;

const worldPageFields = {
  /**
   * The word that flips under the name, set in capitals — « LEAD TECH »,
   * « GRAPHISTE 3D ». Short, because it is set at display size on one line.
   */
  roleWord: localized(
    z
      .string()
      .trim()
      .min(2)
      .max(16)
      .regex(
        /^[A-ZÀ-ÖØ-ÝŒŸ0-9]+( [A-ZÀ-ÖØ-ÝŒŸ0-9]+)*$/,
        'expected capitals or digits, single spaces between words',
      ),
  ),
  lede: ledeSchema,
  /** The large sentence coloured word by word on scroll. */
  scrub: localized(text(20, 220).refine((s) => s.split(/\s+/).length <= 35, 'at most 35 words')),
  facts: z
    .array(factSchema)
    .min(3)
    .max(6)
    .refine(
      uniqueInEachLocale((f: Fact) => f.label),
      'fact labels must be unique',
    ),
  updatedAt: z.iso.datetime(),
};

/**
 * One record per world. Discriminated on `world` so each world can only name
 * tools from its own registry — a 3D page cannot list Angular in its eyebrow.
 */
export const worldPageSchema = z.discriminatedUnion('world', [
  z.object({
    world: z.literal('dev'),
    eyebrowTools: z
      .array(technologySlugSchema)
      .min(1)
      .max(4)
      .refine(uniqueBy(String), 'each tool appears once'),
    ...worldPageFields,
  }),
  z.object({
    world: z.literal('cgi'),
    eyebrowTools: z
      .array(softwareSlugSchema)
      .min(1)
      .max(4)
      .refine(uniqueBy(String), 'each tool appears once'),
    ...worldPageFields,
  }),
]);
export type WorldPage = z.infer<typeof worldPageSchema>;

export const masteryPointSchema = z.object({
  lead: localized(text(1, 60)),
  text: localized(text(1, 220)),
});
export type MasteryPoint = z.infer<typeof masteryPointSchema>;

const masteryPoints = z.array(masteryPointSchema).min(2).max(6);
const oneEntryPerTool = uniqueBy((e: { tool: string }) => e.tool);

/** The marks row and its « Maîtrise » panel, one record per world. */
export const worldStackSchema = z.discriminatedUnion('world', [
  z.object({
    world: z.literal('dev'),
    entries: z
      .array(z.object({ tool: technologySlugSchema, points: masteryPoints }))
      .min(3)
      .max(10)
      .refine(oneEntryPerTool, 'each tool appears once'),
    updatedAt: z.iso.datetime(),
  }),
  z.object({
    world: z.literal('cgi'),
    entries: z
      .array(z.object({ tool: softwareSlugSchema, points: masteryPoints }))
      .min(3)
      .max(10)
      .refine(oneEntryPerTool, 'each tool appears once'),
    updatedAt: z.iso.datetime(),
  }),
]);
export type WorldStack = z.infer<typeof worldStackSchema>;

export const contactPageSchema = z.object({
  title: localized(text(1, 120)),
  lede: localized(text(1, 280)),
  /** A cut-out with a transparent background: it stands on the diagonal plate. */
  portraitAssetId: z.uuid(),
  portraitCaption: localized(text(1, 60)),
  updatedAt: z.iso.datetime(),
});
export type ContactPage = z.infer<typeof contactPageSchema>;

/**
 * No `email` kind on purpose: the address is never published in the HTML, so
 * harvesters cannot collect it. Visitors write through the contact form, which
 * the API relays (ADR-0007).
 */
export const socialKindSchema = z.enum(['linkedin', 'github', 'artstation']);
export type SocialKind = z.infer<typeof socialKindSchema>;

/** The accessible name is derived from `kind`, so the link must really go there. */
const SOCIAL_HOSTS: Readonly<Record<SocialKind, readonly string[]>> = {
  linkedin: ['www.linkedin.com', 'linkedin.com'],
  github: ['github.com'],
  artstation: ['www.artstation.com', 'artstation.com'],
};

// A regex rather than `new URL()`: this package compiles without DOM or Node
// types. It also rejects `https:host` without slashes, which z.url accepts.
const hostOf = (url: string): string | undefined =>
  /^https:\/\/([^/?#:]+)/i.exec(url)?.[1]?.toLowerCase();

export const socialLinkSchema = z
  .object({
    kind: socialKindSchema,
    url: z.url({ protocol: /^https$/ }),
  })
  .refine((s) => SOCIAL_HOSTS[s.kind].includes(hostOf(s.url) ?? ''), {
    message: 'the url does not belong to that network',
    path: ['url'],
  });
export type SocialLink = z.infer<typeof socialLinkSchema>;

export const siteSettingsSchema = z.object({
  socials: z
    .array(socialLinkSchema)
    .max(socialKindSchema.options.length)
    .refine(
      uniqueBy((s: { kind: string }) => s.kind),
      'each network appears once',
    ),
  /** The CV is a file, not a network. */
  cvAssetId: z.uuid(),
  updatedAt: z.iso.datetime(),
});
export type SiteSettings = z.infer<typeof siteSettingsSchema>;
