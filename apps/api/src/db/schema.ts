import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const mediaAssets = sqliteTable('media_assets', {
  id: text('id').primaryKey(),
  kind: text('kind', { enum: ['image', 'video'] }).notNull(),
  objectKey: text('object_key').notNull().unique(),
  alt: text('alt').notNull().default(''),
  width: integer('width'),
  height: integer('height'),
  byteSize: integer('byte_size').notNull(),
  contentType: text('content_type').notNull(),
  uploadedAt: text('uploaded_at'),
  createdAt: text('created_at').notNull(),
});

/**
 * Dev projects and 3D pieces, one row each (ADR-0022). The record itself is
 * `document`, validated by its kind's schema from `@portfolio/shared-types`
 * on the way in and on the way out; the columns beside it are copies of what
 * the API filters and sorts on, written in the same statement as the document.
 */
export const works = sqliteTable(
  'works',
  {
    id: text('id').primaryKey(),
    kind: text('kind', { enum: ['dev', 'cgi'] }).notNull(),
    status: text('status', { enum: ['draft', 'published'] })
      .notNull()
      .default('draft'),
    slugFr: text('slug_fr').notNull(),
    slugEn: text('slug_en').notNull(),
    releasedAt: text('released_at'),
    document: text('document', { mode: 'json' }).$type<unknown>().notNull(),
    publishedAt: text('published_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('works_kind_slug_fr_unique').on(table.kind, table.slugFr),
    uniqueIndex('works_kind_slug_en_unique').on(table.kind, table.slugEn),
    index('works_kind_status_released_idx').on(table.kind, table.status, table.releasedAt),
  ],
);
