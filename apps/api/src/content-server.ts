import Fastify from 'fastify';

import configPlugin from './plugins/config.ts';
import dbPlugin from './plugins/db.ts';
import contentRoutes from './routes/content.ts';

// The public read routes alone, for building the site where neither MinIO nor
// a mail server runs (`pnpm build:site`, CI). Production serves the same
// routes from server.ts.
const app = Fastify({ logger: { level: process.env['LOG_LEVEL'] ?? 'warn' } });
await app.register(configPlugin);
await app.register(dbPlugin);
await app.register(contentRoutes);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.close().then(() => process.exit(0));
  });
}

try {
  await app.listen({ host: app.config.HOST, port: app.config.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
