import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

export default async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/health/ready', async (_request, reply) => {
    const checks = { database: false, storage: false };

    try {
      app.db.get(sql`select 1`);
      checks.database = true;
    } catch (error) {
      app.log.error({ error }, 'health: database indisponible');
    }

    try {
      await app.storage.client.bucketExists(app.storage.bucket);
      checks.storage = true;
    } catch (error) {
      app.log.error({ error }, 'health: stockage objet indisponible');
    }

    const healthy = Object.values(checks).every(Boolean);
    return reply.code(healthy ? 200 : 503).send({ status: healthy ? 'ok' : 'degraded', checks });
  });
}
