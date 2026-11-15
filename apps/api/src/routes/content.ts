import { LOCALES } from '@portfolio/shared-types/localized';
import type { MediaAsset } from '@portfolio/shared-types/media';
import {
  type WorkKind,
  artworkRecordSchema,
  projectRecordSchema,
} from '@portfolio/shared-types/project';
import { stackEntryRecordSchema } from '@portfolio/shared-types/stack';
import { worldKeySchema } from '@portfolio/shared-types/world';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type { Db } from '../db/open-database.ts';
import { mediaAssets, stack, tools, works } from '../db/schema.ts';
import {
  type References,
  referencesOf,
  resolveArtwork,
  resolveProject,
  resolveStackEntry,
  resolveTool,
} from '../lib/resolve-content/resolve-content.ts';

const slugParamsSchema = z.object({ locale: z.enum(LOCALES), slug: z.string() });
const stackQuerySchema = z.object({ domain: worldKeySchema.optional() });

/** Every asset and tool, which records point at by id: a few dozen rows, read whole. */
function loadReferences(db: Db): References {
  const media = db
    .select({
      id: mediaAssets.id,
      purpose: mediaAssets.purpose,
      storage: mediaAssets.storage,
      key: mediaAssets.key,
      contentType: mediaAssets.contentType,
      width: mediaAssets.width,
      height: mediaAssets.height,
      alt: mediaAssets.alt,
      averageColor: mediaAssets.averageColor,
      variants: mediaAssets.variants,
    })
    .from(mediaAssets)
    .all()
    .map(({ averageColor, variants, ...asset }): MediaAsset => ({
      ...asset,
      ...(averageColor ? { averageColor } : {}),
      ...(variants ? { variants } : {}),
    }));
  const toolRecords = db
    .select({ id: tools.id, slug: tools.slug, label: tools.label, icon: tools.icon })
    .from(tools)
    .orderBy(sql`rowid`)
    .all();
  return referencesOf(media, toolRecords);
}

/**
 * The public, read-only routes the site is prerendered from (ADR-0008,
 * ADR-0021): published works only, every reference resolved and every
 * response validated on the way out, so a record that no longer meets its
 * schema, or points at nothing, fails the build instead of reaching a page.
 */
export default async function contentRoutes(app: FastifyInstance): Promise<void> {
  // A build reads these right after a publish: no cache may answer in the database's place.
  app.addHook('onSend', async (_request, reply) => {
    reply.header('cache-control', 'no-cache');
  });

  const published = (kind: WorkKind) => and(eq(works.kind, kind), eq(works.status, 'published'));

  function serveWorks<T>(
    path: string,
    kind: WorkKind,
    resolve: (references: References, document: unknown) => T,
  ): void {
    // Newest first, work still going on before anything; records released the
    // same day keep the order they were created in.
    app.get(path, async () => {
      const rows = app.db
        .select({ document: works.document })
        .from(works)
        .where(published(kind))
        .orderBy(sql`${works.releasedAt} is null desc`, desc(works.releasedAt), sql`rowid`)
        .all();
      const references = loadReferences(app.db);
      return rows.map((row) => resolve(references, row.document));
    });

    app.get(`${path}/:locale/:slug`, async (request, reply) => {
      const params = slugParamsSchema.safeParse(request.params);
      const slugColumn = params.data?.locale === 'en' ? works.slugEn : works.slugFr;
      const row =
        params.success &&
        app.db
          .select({ document: works.document })
          .from(works)
          .where(and(published(kind), eq(slugColumn, params.data.slug)))
          .get();
      if (!row) return reply.code(404).send({ error: 'not-found' });
      return resolve(loadReferences(app.db), row.document);
    });
  }

  serveWorks('/api/projects', 'dev', (references, document) =>
    resolveProject(references, projectRecordSchema.parse(document)),
  );
  serveWorks('/api/artworks', 'cgi', (references, document) =>
    resolveArtwork(references, artworkRecordSchema.parse(document)),
  );

  app.get('/api/tools', async () => {
    const references = loadReferences(app.db);
    return [...references.tools.values()].map((tool) => resolveTool(references, tool));
  });

  // In each domain's order; both domains, dev first, when none is asked.
  app.get('/api/stack', async (request, reply) => {
    const query = stackQuerySchema.safeParse(request.query);
    if (!query.success) return reply.code(400).send({ error: 'invalid-domain' });
    const { domain } = query.data;
    const rows = app.db
      .select({
        id: stack.id,
        tool: stack.tool,
        domain: stack.domain,
        position: stack.position,
        points: stack.points,
      })
      .from(stack)
      .where(domain ? eq(stack.domain, domain) : undefined)
      .orderBy(desc(stack.domain), asc(stack.position))
      .all();
    const references = loadReferences(app.db);
    return rows.map((row) => resolveStackEntry(references, stackEntryRecordSchema.parse(row)));
  });
}
