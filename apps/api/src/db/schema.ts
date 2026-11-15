import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Every image the content uses (ADR-0022). The file stays where it is, in the
 * bucket or in the site's `public/`; the row holds what a page needs to
 * render it, and records name it by `id`.
 */
export const mediaAssets = sqliteTable('media_assets', {
  id: text('id').primaryKey(),
  purpose: text('purpose', {
    enum: ['render', 'cover', 'presentation', 'logo', 'mark'],
  }).notNull(),
  storage: text('storage', { enum: ['bucket', 'site'] }).notNull(),
  key: text('key').notNull().unique(),
  contentType: text('content_type', {
    enum: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  }).notNull(),
  width: real('width').notNull(),
  height: real('height').notNull(),
  alt: text('alt', { mode: 'json' }).$type<{ fr: string; en: string }>().notNull(),
  averageColor: text('average_color'),
  variants: text('variants', { mode: 'json' }).$type<number[]>(),
  /** Known once the API receives the file itself (V1.1 upload, #55). */
  byteSize: integer('byte_size'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/** The tools works are credited with (spec 04 §2). Works name them by id inside their document. */
export const tools = sqliteTable('tools', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  label: text('label', { mode: 'json' }).$type<{ fr: string; en: string }>().notNull(),
  icon: text('icon_id').references(() => mediaAssets.id, { onDelete: 'restrict' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

/**
 * A world page's Stack section: one row per tool shown, its « Maîtrise »
 * points an ordered JSON array validated by `stackEntryRecordSchema`.
 */
export const stack = sqliteTable(
  'stack',
  {
    id: text('id').primaryKey(),
    tool: text('tool_id')
      .notNull()
      .references(() => tools.id, { onDelete: 'restrict' }),
    domain: text('domain', { enum: ['dev', 'cgi'] }).notNull(),
    position: integer('position').notNull(),
    points: text('points', { mode: 'json' }).$type<unknown>().notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [uniqueIndex('stack_tool_domain_unique').on(table.tool, table.domain)],
);

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
