import { LOCALES } from '@portfolio/shared-types/localized';
import { type WorkKind, artworkSchema, projectSchema } from '@portfolio/shared-types/project';
import { SOFTWARE, TECHNOLOGIES } from '@portfolio/shared-types/registries';
import { toolSchema } from '@portfolio/shared-types/tool';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { works } from '../db/schema.ts';

const slugParamsSchema = z.object({ locale: z.enum(LOCALES), slug: z.string() });

const TOOLS = [
  ...TECHNOLOGIES.map((technology) => ({ world: 'dev' as const, ...technology })),
  ...SOFTWARE.map((software) => ({ world: 'cgi' as const, ...software })),
];

/**
 * The public, read-only routes the site is prerendered from (ADR-0008,
 * ADR-0021): published records only, each validated on the way out, so a
 * document that no longer meets its schema fails the build instead of
 * reaching a page.
 */
export default async function contentRoutes(app: FastifyInstance): Promise<void> {
  // A build reads these right after a publish: no cache may answer in the database's place.
  app.addHook('onSend', async (_request, reply) => {
    reply.header('cache-control', 'no-cache');
  });

  const published = (kind: WorkKind) => and(eq(works.kind, kind), eq(works.status, 'published'));

  function serveWorks(path: string, kind: WorkKind, schema: z.ZodType): void {
    // Newest first, work still going on before anything; records released the
    // same day keep the order they were created in.
    app.get(path, async () => {
      const rows = app.db
        .select({ document: works.document })
        .from(works)
        .where(published(kind))
        .orderBy(sql`${works.releasedAt} is null desc`, desc(works.releasedAt), sql`rowid`)
        .all();
      return z.array(schema).parse(rows.map((row) => row.document));
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
      return schema.parse(row.document);
    });
  }

  serveWorks('/api/projects', 'dev', projectSchema);
  serveWorks('/api/artworks', 'cgi', artworkSchema);

  app.get('/api/tools', async () => z.array(toolSchema).parse(TOOLS));
}
