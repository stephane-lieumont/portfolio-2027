import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import * as schema from './schema.ts';

export type Db = ReturnType<typeof drizzle<typeof schema>>;

export interface OpenDatabase {
  db: Db;
  close: () => void;
}

/** Opens the SQLite file, creating it if needed, and brings it to the latest migration. */
export function openDatabase(file: string): OpenDatabase {
  const path = resolve(file);
  mkdirSync(dirname(path), { recursive: true });

  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: resolve(import.meta.dirname, 'migrations') });

  return { db, close: () => sqlite.close() };
}
