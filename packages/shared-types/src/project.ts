import { z } from 'zod';
import { SOFTWARE, TECHNOLOGIES } from './registries.js';
import type { SoftwareSlug, TechnologySlug } from './registries.js';

import { localized } from './localized.js';
import { mediaAssetSchema } from './media.js';
import { youtubeVideoId } from './video.js';

export const projectKindSchema = z.enum(['dev', 'cgi']);
export type ProjectKind = z.infer<typeof projectKindSchema>;

export const projectStatusSchema = z.enum(['draft', 'published']);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

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

/** A YouTube video, embedded on the page after a click (ADR-0016). */
export const videoUrlSchema = z
  .string()
  .trim()
  .refine((value) => youtubeVideoId(value) !== null, 'expected an https YouTube video address');

const copy = (max: number) => z.string().trim().min(1).max(max);

export const projectSchema = z.object({
  id: z.uuid(),
  kind: projectKindSchema,
  status: projectStatusSchema,
  slug: localizedSlugSchema,
  title: localized(z.string().trim().max(160)),
  /** For cards and the meta description. The project page does not show it. */
  summary: localized(z.string().trim().max(320)),
  /** What the product was: the page's introduction, coloured word by word. */
  context: localized(copy(400)),
  /** In what capacity Stéphane worked, set large beside the mission. */
  role: localized(copy(80)),
  /** What he did. */
  mission: localized(copy(600)),
  /** The concrete deliverables, in order. */
  missionSteps: z
    .array(localized(copy(240)))
    .min(1)
    .max(10),
  technos: z.array(z.string()),
  tags: z.array(z.string()),
  /**
   * Groups related projects: their pages end on the series rather than on
   * other work. A proper name, the same in both languages, and the grouping key.
   */
  series: copy(60).nullable(),
  websiteUrl: websiteUrlSchema.nullable(),
  videoUrl: videoUrlSchema.nullable(),
  sourceUrl: z.url().nullable(),
  coverAsset: mediaAssetSchema.nullable(),
  /** The wide visual the project page opens on, the product staged on white. */
  presentationAsset: mediaAssetSchema,
  presentationCaption: localized(copy(160)),
  gallery: z.array(mediaAssetSchema),
  releasedAt: z.iso.date(),
  sortOrder: z.int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Project = z.infer<typeof projectSchema>;

export const projectSummarySchema = projectSchema.pick({
  id: true,
  kind: true,
  slug: true,
  title: true,
  summary: true,
  tags: true,
  coverAsset: true,
  releasedAt: true,
});
export type ProjectSummary = z.infer<typeof projectSummarySchema>;

export const createProjectInputSchema = projectSchema
  .omit({
    id: true,
    coverAsset: true,
    presentationAsset: true,
    gallery: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    coverAssetId: z.uuid().nullable().default(null),
    presentationAssetId: z.uuid(),
    galleryAssetIds: z.array(z.uuid()).default([]),
  });
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const updateProjectInputSchema = createProjectInputSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

export const listProjectsQuerySchema = z.object({
  kind: projectKindSchema.optional(),
  status: projectStatusSchema.optional(),
  tag: z.string().optional(),
});
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

// Validating against the registries means a typo fails at the API boundary
// rather than rendering a missing glyph nobody notices. These live here rather
// than in registries.ts so the browser can read the registries without pulling
// Zod into its bundle.
const technologySlugs = TECHNOLOGIES.map((t) => t.slug) as [TechnologySlug, ...TechnologySlug[]];
const softwareSlugs = SOFTWARE.map((s) => s.slug) as [SoftwareSlug, ...SoftwareSlug[]];

export const technologySlugSchema = z.enum(technologySlugs);
export const softwareSlugSchema = z.enum(softwareSlugs);
