import { loadConfig } from '../config.ts';
import { openDatabase } from '../db/open-database.ts';
import { ARTWORKS, PROJECTS } from '../db/seed/content.ts';
import { seedContent } from '../db/seed/seed.ts';

const { DATABASE_FILE } = loadConfig();
const database = openDatabase(DATABASE_FILE);

try {
  const { written, unchanged } = seedContent(database.db, {
    projects: PROJECTS,
    artworks: ARTWORKS,
  });
  console.log(
    `${DATABASE_FILE}: ${PROJECTS.length} projects and ${ARTWORKS.length} pieces, ` +
      `${written} written, ${unchanged} unchanged.`,
  );
} finally {
  database.close();
}
