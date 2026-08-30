import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import * as schema from '../db/schema.ts';

export type Db = ReturnType<typeof drizzle<typeof schema>>;

declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
  }
}

async function dbPlugin(app: FastifyInstance): Promise<void> {
  const file = resolve(app.config.DATABASE_FILE);
  mkdirSync(dirname(file), { recursive: true });

  const sqlite = new Database(file);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: resolve(import.meta.dirname, '../db/migrations') });

  app.decorate('db', db);
  app.addHook('onClose', async () => {
    sqlite.close();
  });
}

export default fp(dbPlugin, { name: 'db', dependencies: ['config'] });
