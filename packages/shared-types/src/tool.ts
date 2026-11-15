import { z } from 'zod';

import { localized } from '@portfolio/shared-types/localized';

/**
 * The key projects and pieces name a tool by. Unique across both worlds and
 * shorter than a page slug: « xd », « ios ».
 */
export const toolSlugSchema = z
  .string()
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'expected a kebab-case slug');

const toolFields = {
  id: z.uuid(),
  slug: toolSlugSchema,
  /** A proper name for most, the same in both languages; « Tests unitaires » / « Unit tests ». */
  label: localized(z.string().max(40)),
};

/** A tool as stored (spec 04 §2): its icon is a media asset, by id. Null shows the name alone. */
export const toolRecordSchema = z.object({ ...toolFields, icon: z.uuid().nullable() });
export type ToolRecord = z.infer<typeof toolRecordSchema>;

/** A monochrome mark shipped from the site's `public/`, drawn as a CSS mask in the world's ink. */
export const toolIconSchema = z.object({
  src: z.string().regex(/^\/logos\/[a-z0-9/-]+\.(?:svg|png)$/, 'expected a mark under /logos'),
  width: z.number().positive(),
  height: z.number().positive(),
});
export type ToolIcon = z.infer<typeof toolIconSchema>;

/** A tool as `GET /api/tools` serves it, its icon resolved. */
export const toolSchema = z.object({ ...toolFields, icon: toolIconSchema.nullable() });
export type Tool = z.infer<typeof toolSchema>;
