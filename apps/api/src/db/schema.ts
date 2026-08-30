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

export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey(),
    kind: text('kind', { enum: ['dev', 'cgi'] }).notNull(),
    status: text('status', { enum: ['draft', 'published'] })
      .notNull()
      .default('draft'),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull().default(''),
    description: text('description').notNull().default(''),
    mission: text('mission'),
    missionSteps: text('mission_steps', { mode: 'json' }).$type<string[]>().notNull().default([]),
    technos: text('technos', { mode: 'json' }).$type<string[]>().notNull().default([]),
    tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
    demoUrl: text('demo_url'),
    sourceUrl: text('source_url'),
    coverAssetId: text('cover_asset_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
    releasedAt: text('released_at').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('projects_slug_unique').on(table.slug),
    index('projects_kind_status_idx').on(table.kind, table.status),
  ],
);

export const projectGallery = sqliteTable(
  'project_gallery',
  {
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    assetId: text('asset_id')
      .notNull()
      .references(() => mediaAssets.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
  },
  (table) => [
    uniqueIndex('project_gallery_pk').on(table.projectId, table.assetId),
    index('project_gallery_order_idx').on(table.projectId, table.position),
  ],
);
