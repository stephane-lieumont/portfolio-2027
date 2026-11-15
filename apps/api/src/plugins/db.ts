import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { type Db, openDatabase } from '../db/open-database.ts';

declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
  }
}

async function dbPlugin(app: FastifyInstance): Promise<void> {
  const { db, close } = openDatabase(app.config.DATABASE_FILE);

  app.decorate('db', db);
  app.addHook('onClose', async () => {
    close();
  });
}

export default fp(dbPlugin, { name: 'db', dependencies: ['config'] });
