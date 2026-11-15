import { z } from 'zod';

import { localized } from '@portfolio/shared-types/localized';
import { toolSchema } from '@portfolio/shared-types/tool';
import { worldKeySchema } from '@portfolio/shared-types/world';

/** One numbered point of the « Maîtrise » panel: a bold first line, then the rest. */
export const expertisePointSchema = z.object({
  strongLine: localized(z.string().max(60)),
  secondLine: localized(z.string().max(220)),
});
export type ExpertisePoint = z.infer<typeof expertisePointSchema>;

const stackEntryFields = {
  id: z.uuid(),
  /** The world whose Stack section shows it. A tool may sit in both. */
  domain: worldKeySchema,
  /** Its place in that section, ascending: the order is the editorial argument (Angular first). */
  position: z.int().nonnegative(),
  points: z.array(expertisePointSchema).min(2).max(6),
};

/** A Stack entry as stored (spec 04 §2): its tool by id. */
export const stackEntryRecordSchema = z.object({ ...stackEntryFields, tool: z.uuid() });
export type StackEntryRecord = z.infer<typeof stackEntryRecordSchema>;

/** A Stack entry as `GET /api/stack` serves it, its tool resolved. */
export const stackEntrySchema = z.object({ ...stackEntryFields, tool: toolSchema });
export type StackEntry = z.infer<typeof stackEntrySchema>;
