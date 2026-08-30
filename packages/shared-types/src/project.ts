import { z } from 'zod';

import { mediaAssetSchema } from './media.js';

export const projectKindSchema = z.enum(['dev', 'cgi']);
export type ProjectKind = z.infer<typeof projectKindSchema>;

export const projectStatusSchema = z.enum(['draft', 'published']);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const slugSchema = z
  .string()
  .min(3)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug kebab-case attendu');

export const projectSchema = z.object({
  id: z.uuid(),
  kind: projectKindSchema,
  status: projectStatusSchema,
  slug: slugSchema,
  title: z.string().min(1).max(160),
  summary: z.string().max(320),
  description: z.string(),
  mission: z.string().nullable(),
  missionSteps: z.array(z.string()),
  technos: z.array(z.string()),
  tags: z.array(z.string()),
  /** Lien de démo, servi par le reverse proxy nginx (voir docs/adr/0005). */
  demoUrl: z.url().nullable(),
  sourceUrl: z.url().nullable(),
  coverAsset: mediaAssetSchema.nullable(),
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
  .omit({ id: true, coverAsset: true, gallery: true, createdAt: true, updatedAt: true })
  .extend({
    coverAssetId: z.uuid().nullable().default(null),
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
