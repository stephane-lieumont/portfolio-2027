import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';

import authPlugin from './plugins/auth.ts';
import captchaPlugin from './plugins/captcha.ts';
import configPlugin from './plugins/config.ts';
import dbPlugin from './plugins/db.ts';
import mailerPlugin from './plugins/mailer.ts';
import storagePlugin from './plugins/storage.ts';
import contactRoutes from './routes/contact.ts';
import contentRoutes from './routes/content.ts';
import healthRoutes from './routes/health.ts';

// Visitors' addresses are kept only in the reverse proxy's access logs, which
// are deleted after twelve months as the legal notice promises. The API logs
// what was asked, never who asked.
export const loggerOptions = {
  level: process.env['LOG_LEVEL'] ?? 'info',
  serializers: {
    req: (request: { method: string; url: string }) => ({
      method: request.method,
      url: request.url,
    }),
  },
};

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: loggerOptions, trustProxy: true });

  await app.register(configPlugin);
  await app.register(helmet);
  await app.register(cors, { origin: app.config.WEB_ORIGIN, credentials: true });
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

  await app.register(dbPlugin);
  await app.register(storagePlugin);
  await app.register(authPlugin);
  await app.register(mailerPlugin);
  await app.register(captchaPlugin);

  await app.register(healthRoutes);
  await app.register(contactRoutes);
  await app.register(contentRoutes);

  return app;
}
