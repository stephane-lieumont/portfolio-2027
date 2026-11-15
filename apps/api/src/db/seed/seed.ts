import {
  type Artwork,
  type Project,
  type WorkKind,
  artworkSchema,
  projectSchema,
} from '@portfolio/shared-types/project';
import { sql } from 'drizzle-orm';
import type { z } from 'zod';

import type { Db } from '../open-database.ts';
import { works } from '../schema.ts';

export interface SeedContent {
  readonly projects: readonly Project[];
  readonly artworks: readonly Artwork[];
}

export interface SeedReport {
  readonly written: number;
  readonly unchanged: number;
}

interface WorkRow {
  readonly id: string;
  readonly kind: WorkKind;
  readonly slugFr: string;
  readonly slugEn: string;
  readonly releasedAt: string | null;
  readonly document: Project | Artwork;
}

function validated<T extends Project | Artwork>(
  kind: WorkKind,
  schema: z.ZodType<T>,
  record: T,
): WorkRow {
  const parsed = schema.safeParse(record);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`${kind} ${record.slug.fr} is invalid:\n  ${issues.join('\n  ')}`);
  }
  const document = parsed.data;
  return {
    id: document.id,
    kind,
    slugFr: document.slug.fr,
    slugEn: document.slug.en,
    releasedAt: document.releasedAt,
    document,
  };
}

/**
 * Writes the content into `works`, published. Every record is validated
 * before anything is written, so one invalid record leaves the database as it
 * was. Running it twice changes nothing: a record is matched on its id, and
 * one whose document has not changed keeps its `updatedAt`, which is what the
 * back office compares with the last build (spec 03).
 */
export function seedContent(db: Db, content: SeedContent, now = new Date()): SeedReport {
  const rows = [
    ...content.projects.map((project) => validated('dev', projectSchema, project)),
    ...content.artworks.map((artwork) => validated('cgi', artworkSchema, artwork)),
  ];
  const stamp = now.toISOString();

  let written = 0;
  db.transaction((tx) => {
    for (const { id, ...fields } of rows) {
      const result = tx
        .insert(works)
        .values({
          id,
          ...fields,
          status: 'published',
          publishedAt: stamp,
          createdAt: stamp,
          updatedAt: stamp,
        })
        .onConflictDoUpdate({
          target: works.id,
          set: {
            ...fields,
            status: 'published',
            publishedAt: sql`coalesce(${works.publishedAt}, ${stamp})`,
            updatedAt: stamp,
          },
          setWhere: sql`${works.document} is not excluded.document`,
        })
        .run();
      written += result.changes;
    }
  });

  return { written, unchanged: rows.length - written };
}
