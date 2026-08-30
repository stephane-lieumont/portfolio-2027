import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { type AppConfig, loadConfig } from '../config.ts';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
  }
}

async function configPlugin(app: FastifyInstance): Promise<void> {
  app.decorate('config', loadConfig());
}

export default fp(configPlugin, { name: 'config' });
