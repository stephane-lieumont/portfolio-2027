import { z } from 'zod';

import { softwareSlugSchema, technologySlugSchema } from '@portfolio/shared-types/project';

const entry = {
  label: z.string().min(1),
  glyph: z.string().nullable(),
  logo: z.string().nullable(),
};

/**
 * A registry entry tagged with its world, as `GET /api/tools` serves it. The
 * two vocabularies never mix (spec 03): a dev tool is a technology, a 3D one a
 * piece of software.
 */
export const toolSchema = z.discriminatedUnion('world', [
  z.object({ world: z.literal('dev'), slug: technologySlugSchema, ...entry }),
  z.object({ world: z.literal('cgi'), slug: softwareSlugSchema, ...entry }),
]);
export type Tool = z.infer<typeof toolSchema>;
