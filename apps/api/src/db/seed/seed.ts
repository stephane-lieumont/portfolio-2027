import { sql } from 'drizzle-orm';

import { type ContentRecords, resolveContent } from '../../lib/resolve-content/resolve-content.ts';
import type { Db } from '../open-database.ts';
import { mediaAssets, stack, tools, works } from '../schema.ts';

export interface SeedReport {
  readonly written: number;
  readonly unchanged: number;
}

/** Rewrites a row only when one of these columns differs, so its `updated_at` means something. */
const differs = (columns: readonly string[]) =>
  sql.raw(columns.map((column) => `${column} is not excluded.${column}`).join(' or '));

/**
 * Writes the media, the tools, the Stack and the works, the works published.
 * Everything is validated and every reference followed first (resolveContent),
 * so one broken record leaves the database as it was. Running it twice changes
 * nothing: rows are matched on their id, and an unchanged one keeps its
 * `updated_at`, which is what the back office compares with the last build
 * (spec 03). It never deletes (ADR-0022).
 */
export function seedContent(db: Db, content: ContentRecords, now = new Date()): SeedReport {
  resolveContent(content);
  const stamp = now.toISOString();
  const created = { createdAt: stamp, updatedAt: stamp };
  let written = 0;
  let total = 0;

  db.transaction((tx) => {
    for (const { id, ...asset } of content.media) {
      const fields = {
        ...asset,
        averageColor: asset.averageColor ?? null,
        variants: asset.variants ?? null,
      };
      total += 1;
      written += tx
        .insert(mediaAssets)
        .values({ id, ...fields, ...created })
        .onConflictDoUpdate({
          target: mediaAssets.id,
          set: { ...fields, updatedAt: stamp },
          setWhere: differs([
            'purpose',
            'storage',
            'key',
            'content_type',
            'width',
            'height',
            'alt',
            'average_color',
            'variants',
          ]),
        })
        .run().changes;
    }

    for (const { id, ...fields } of content.tools) {
      total += 1;
      written += tx
        .insert(tools)
        .values({ id, ...fields, ...created })
        .onConflictDoUpdate({
          target: tools.id,
          set: { ...fields, updatedAt: stamp },
          setWhere: differs(['slug', 'label', 'icon_id']),
        })
        .run().changes;
    }

    for (const { id, ...fields } of content.stack) {
      total += 1;
      written += tx
        .insert(stack)
        .values({ id, ...fields, ...created })
        .onConflictDoUpdate({
          target: stack.id,
          set: { ...fields, updatedAt: stamp },
          setWhere: differs(['tool_id', 'domain', 'position', 'points']),
        })
        .run().changes;
    }

    const records = [
      ...content.projects.map((document) => ({ kind: 'dev' as const, document })),
      ...content.artworks.map((document) => ({ kind: 'cgi' as const, document })),
    ];
    for (const { kind, document } of records) {
      const fields = {
        kind,
        slugFr: document.slug.fr,
        slugEn: document.slug.en,
        releasedAt: document.releasedAt,
        document,
      };
      total += 1;
      written += tx
        .insert(works)
        .values({
          id: document.id,
          ...fields,
          status: 'published',
          publishedAt: stamp,
          ...created,
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
        .run().changes;
    }
  });

  return { written, unchanged: total - written };
}
