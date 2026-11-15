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

/**
 * The fields of a project, without the rules across them: what `.pick()` and
 * `.omit()` build on, since Zod refuses both on a refined object.
 */
export const projectFieldsSchema = z.object({
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
  /** What he did. Absent when the context already says it all, as for a client reference. */
  mission: localized(copy(600)).nullable(),
  /** The concrete deliverables, in order. Never invented: empty when none are sourced. */
  missionSteps: z.array(localized(copy(240))).max(10),
  technos: z.array(z.string()),
  tags: z.array(z.string()),
  /**
   * Groups related projects: their pages end on the series rather than on
   * other work. A proper name, the same in both languages, and the grouping key.
   */
  series: copy(60).nullable(),
  websiteUrl: websiteUrlSchema.nullable(),
  videoUrl: videoUrlSchema.nullable(),
  googlePlayUrl: googlePlayUrlSchema.nullable(),
  sourceUrl: z.url().nullable(),
  coverAsset: mediaAssetSchema.nullable(),
  /**
   * The wide visual the project page opens on, the product staged on white.
   * A client reference has none: no screenshot of a client's product is shown.
   */
  presentationAsset: mediaAssetSchema.nullable(),
  presentationCaption: localized(copy(160)).nullable(),
  /**
   * A client's logo, in its own colours on a light plate (SVG or transparent
   * PNG): what a client reference shows instead of a cover and a
   * presentation visual.
   */
  logo: mediaAssetSchema.nullable(),
  /** The brand colour tinting the logo plate's point field; null keeps the ink. */
  logoTint: hexColorSchema.nullable(),
  gallery: z.array(mediaAssetSchema),
  /** Where a period starts, when the work spans more than its release year. */
  startedAt: z.iso.date().nullable(),
  /** Drives display order. Null while the work is still going on (« aujourd'hui »), listed first. */
  releasedAt: z.iso.date().nullable(),
  sortOrder: z.int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export interface ProjectVisuals {
  readonly logo?: unknown;
  readonly presentation?: unknown;
  readonly presentationCaption?: unknown;
}

/**
 * A project shows either a client's logo or its own presentation visual,
 * never neither (an empty opening plate), never both; a caption only ever
 * sits under a presentation visual.
 */
export function visualIssues({
  logo,
  presentation,
  presentationCaption,
}: ProjectVisuals): string[] {
  const issues: string[] = [];
  if (!logo === !presentation) issues.push('expected either a logo or a presentation visual');
  if (presentationCaption && !presentation) issues.push('a caption needs a presentation visual');
  return issues;
}

export const projectSchema = projectFieldsSchema.superRefine((project, context) => {
  const visuals = {
    logo: project.logo,
    presentation: project.presentationAsset,
    presentationCaption: project.presentationCaption,
  };
  for (const message of visualIssues(visuals)) context.addIssue({ code: 'custom', message });
});
export type Project = z.infer<typeof projectSchema>;

export const projectSummarySchema = projectFieldsSchema.pick({
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

const createProjectFieldsSchema = projectFieldsSchema
  .omit({
    id: true,
    coverAsset: true,
    presentationAsset: true,
    logo: true,
    gallery: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    coverAssetId: z.uuid().nullable().default(null),
    presentationAssetId: z.uuid().nullable().default(null),
    logoAssetId: z.uuid().nullable().default(null),
    galleryAssetIds: z.array(z.uuid()).default([]),
  });

export const createProjectInputSchema = createProjectFieldsSchema.superRefine((input, context) => {
  const visuals = {
    logo: input.logoAssetId,
    presentation: input.presentationAssetId,
    presentationCaption: input.presentationCaption,
  };
  for (const message of visualIssues(visuals)) context.addIssue({ code: 'custom', message });
});
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

// A partial update is checked against the stored record, not on its own.
export const updateProjectInputSchema = createProjectFieldsSchema.partial();
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
