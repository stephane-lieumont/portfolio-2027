import { loadConfig } from '../config.ts';
import { openDatabase } from '../db/open-database.ts';
import { ARTWORKS, PROJECTS } from '../db/seed/content.ts';
import { MEDIA } from '../db/seed/media.ts';
import { seedContent } from '../db/seed/seed.ts';
import { STACK } from '../db/seed/stack.ts';
import { TOOLS } from '../db/seed/tools.ts';

const { DATABASE_FILE } = loadConfig();
const database = openDatabase(DATABASE_FILE);

try {
  const { written, unchanged } = seedContent(database.db, {
    media: MEDIA,
    tools: TOOLS,
    stack: STACK,
    projects: PROJECTS,
    artworks: ARTWORKS,
  });
  console.log(
    `${DATABASE_FILE}: ${MEDIA.length} media, ${TOOLS.length} tools, ${STACK.length} Stack entries, ` +
      `${PROJECTS.length} projects and ${ARTWORKS.length} pieces; ${written} rows written, ${unchanged} unchanged.`,
  );
} finally {
  database.close();
}
