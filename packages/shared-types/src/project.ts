import { z } from 'zod';

import { localized } from '@portfolio/shared-types/localized';
import { SOFTWARE, TECHNOLOGIES } from '@portfolio/shared-types/registries';
import type { SoftwareSlug, TechnologySlug } from '@portfolio/shared-types/registries';
import { youtubeVideoId } from '@portfolio/shared-types/video';

// Validating against the registries means a typo fails at the API boundary
// rather than rendering a missing glyph nobody notices. These live here rather
// than in registries.ts so the browser can read the registries without pulling
// Zod into its bundle.
const technologySlugs = TECHNOLOGIES.map((t) => t.slug) as [TechnologySlug, ...TechnologySlug[]];
const softwareSlugs = SOFTWARE.map((s) => s.slug) as [SoftwareSlug, ...SoftwareSlug[]];

export const technologySlugSchema = z.enum(technologySlugs);
export const softwareSlugSchema = z.enum(softwareSlugs);

/** Which world a record belongs to: a dev `Project` or a 3D `Artwork` (spec 03). */
export const workKindSchema = z.enum(['dev', 'cgi']);
export type WorkKind = z.infer<typeof workKindSchema>;

export const publicationStatusSchema = z.enum(['draft', 'published']);
export type PublicationStatus = z.infer<typeof publicationStatusSchema>;

export const slugSchema = z
  .string()
  .min(3)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'expected a kebab-case slug');

/**
 * The public address in each tree: English pages read as English
 * (ADR-0017), so a descriptive slug is translated and a proper name kept.
 */
export const localizedSlugSchema = localized(slugSchema);
export type LocalizedSlug = z.infer<typeof localizedSlugSchema>;

/**
 * Where « Voir le site » leads: a path on this host, which nginx proxies to a
 * separately hosted demo (ADR-0005, verify the route exists before
 * publishing), or a live site elsewhere over https.
 */
export const websiteUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => /^\/(?!\/)\S*$/.test(value) || /^https:\/\/[^\s/]+(\/\S*)?$/.test(value),
    'expected a root-relative path or an https URL',
  );

/** A YouTube video, « Voir la vidéo », opened on YouTube in a new tab (ADR-0016's note). */
export const videoUrlSchema = z
  .string()
  .trim()
  .refine((value) => youtubeVideoId(value) !== null, 'expected an https YouTube video address');

/** « Voir sur Google Play »: an app's own page on the store, over https. */
export const googlePlayUrlSchema = z
  .string()
  .trim()
  .regex(
    /^https:\/\/play\.google\.com\/store\/apps\/details\?id=[\w.]+(&\S*)?$/,
    'expected a Google Play app address',
  );

const copy = (max: number) => z.string().trim().min(1).max(max);

/** `#rrggbb`, nothing else: it is written into a style. */
export const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i, 'expected a #rrggbb colour');

/** A rendered image with its intrinsic size, so nothing reflows once it loads. */
export const contentImageSchema = z.object({
  /**
   * Object key inside the MinIO bucket, never a URL: the origin serving it
   * differs between development and production, so the base is joined at
   * render time (MEDIA_BASE_URL). One file for both languages, named after the
   * French slug.
   */
  key: z.string().regex(/^[a-z0-9-]+(?:\/[a-z0-9-]+)*\.(?:jpg|png|webp)$/, 'expected a bucket key'),
  /**
   * Describes the picture for someone who cannot see it, never a repeat of the
   * title already read out beside it.
   */
  alt: localized(z.string().max(200)),
  width: z.int().positive(),
  height: z.int().positive(),
  /**
   * The picture's mean colour, painted on its frame while it loads, so a wall
   * of images arrives as a wall of their own tones rather than of grey boxes.
   */
  averageColor: hexColorSchema.optional(),
});
export type ContentImage = z.infer<typeof contentImageSchema>;

/**
 * A client's logo: an SVG or a transparent PNG in the site's
 * `public/logos/clients/`, named after the project's French slug, shown in its
 * own colours on a light plate (Stéphane, 2026-11-15). Replacing the file swaps
 * the logo with no content change.
 */
export const clientLogoSchema = z.object({
  src: z.string().regex(/^\/logos\/clients\/[a-z0-9-]+\.(?:svg|png)$/, 'expected a client logo'),
  /** The file's intrinsic proportions (its viewBox or pixels): they set its optical size. */
  width: z.number().positive(),
  height: z.number().positive(),
  /** A raster logo's WebP widths (`<name>-<width>.webp`, apps/api `media:public`); an SVG has none. */
  variants: z.array(z.int().positive()).optional(),
  /** Names the logo on the project page; the card leaves it to the title beside it. */
  alt: localized(z.string().max(200)),
});
export type ClientLogo = z.infer<typeof clientLogoSchema>;

/**
 * A development case study or client reference, as the site shows it. These
 * are the fields without the rules across them: what `.shape` and `.pick()`
 * build on, since Zod refuses `.pick()` on a refined object.
 */
export const projectFieldsSchema = z.object({
  /** Names the record across both trees: the language switch goes through it. */
  id: z.uuid(),
  slug: localizedSlugSchema,
  title: localized(z.string().max(160)),
  /** For cards and the meta description. The project page does not show it. */
  summary: localized(z.string().max(320)),
  /** What the product was: the page's introduction, coloured word by word. */
  context: localized(copy(400)),
  /** In what capacity Stéphane worked, set large beside the mission. */
  role: localized(copy(80)),
  /** What he did. Absent when the context already says it all, as for a client reference. */
  mission: localized(copy(600)).optional(),
  /**
   * The concrete deliverables, in order, as plain sentences, never markup.
   * Never invented: empty when none are sourced.
   */
  missionSteps: z.array(localized(copy(240))).max(10),
  technologies: z.array(technologySlugSchema),
  /**
   * Groups related projects: their pages end on the series rather than on
   * other work. A proper name, the same in both languages, and the grouping key.
   */
  series: copy(60).optional(),
  websiteUrl: websiteUrlSchema.optional(),
  videoUrl: videoUrlSchema.optional(),
  googlePlayUrl: googlePlayUrlSchema.optional(),
  /** The 4:3 card image. A client reference has none: it shows its logo. */
  cover: contentImageSchema.optional(),
  /**
   * The wide visual the project page opens on, the product staged on white.
   * A client reference has none: no screenshot of a client's product is shown.
   */
  presentation: contentImageSchema.optional(),
  presentationCaption: localized(copy(160)).optional(),
  /** A client's logo, in place of the cover and the presentation visual. */
  logo: clientLogoSchema.optional(),
  /** The brand colour tinting the logo plate's point field; absent keeps the ink. */
  logoTint: hexColorSchema.optional(),
  /**
   * A dark plate, for a logo whose light colours vanish on the sand. A trial
   * (Stéphane, 2026-11-15) until he keeps it.
   */
  logoPlate: z.literal('dark').optional(),
  /** Where a period starts, when the work spans more than its release year. */
  startedAt: z.iso.date().optional(),
  /** Drives display order. Null while the work is still going on (« aujourd'hui »), listed first. */
  releasedAt: z.iso.date().nullable(),
});

export interface ProjectVisuals {
  readonly logo?: unknown;
  readonly cover?: unknown;
  readonly presentation?: unknown;
  readonly presentationCaption?: unknown;
}

/**
 * A project shows either a client's logo or its own visuals, a cover with a
 * presentation, never neither (an empty opening plate), never both; a caption
 * only ever sits under a presentation visual.
 */
export function visualIssues({
  logo,
  cover,
  presentation,
  presentationCaption,
}: ProjectVisuals): string[] {
  const issues: string[] = [];
  if (!logo === !presentation) issues.push('expected either a logo or a presentation visual');
  if (!cover !== !presentation) issues.push('a cover goes with a presentation visual');
  if (presentationCaption && !presentation) issues.push('a caption needs a presentation visual');
  return issues;
}

export const projectSchema = projectFieldsSchema.superRefine((project, context) => {
  for (const message of visualIssues(project)) context.addIssue({ code: 'custom', message });
});
export type Project = z.infer<typeof projectSchema>;

/** Where the mosaic crops a render around, each axis in [0, 1] (spec 03, ADR-0015). */
export const focalPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

/** A 3D piece, as the site shows it. */
export const artworkSchema = z.object({
  /** Names the piece across both trees: the language switch goes through it. */
  id: z.uuid(),
  slug: localizedSlugSchema,
  title: localized(z.string().max(160)),
  image: contentImageSchema,
  software: z.array(softwareSlugSchema).min(1),
  releasedAt: z.iso.date(),
  /** Doubles the tile in the mosaic. */
  featured: z.boolean(),
  /** The centre when absent. The viewer always shows the whole render. */
  focal: focalPointSchema.optional(),
});
export type Artwork = z.infer<typeof artworkSchema>;
