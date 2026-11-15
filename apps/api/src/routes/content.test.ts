import type { Artwork, Project, PublicationStatus } from '@portfolio/shared-types/project';
import { eq } from 'drizzle-orm';
import Fastify, { type FastifyInstance } from 'fastify';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { type OpenDatabase, openDatabase } from '../db/open-database.ts';
import { works } from '../db/schema.ts';
import { ARTWORKS, PROJECTS } from '../db/seed/content.ts';
import { seedContent } from '../db/seed/seed.ts';
import contentRoutes from './content.ts';

let directory: string;
let database: OpenDatabase;
let app: FastifyInstance;

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'portfolio-content-'));
  database = openDatabase(join(directory, 'content.sqlite'));
  seedContent(database.db, { projects: PROJECTS, artworks: ARTWORKS });
  app = Fastify();
  app.decorate('db', database.db);
  await app.register(contentRoutes);
});

afterEach(async () => {
  await app.close();
  database.close();
  rmSync(directory, { recursive: true, force: true });
});

const get = (url: string) => app.inject({ method: 'GET', url });
const slugsOf = (records: readonly (Project | Artwork)[]) => records.map((r) => r.slug.fr);

function setStatus(slugFr: string, status: PublicationStatus): void {
  database.db.update(works).set({ status }).where(eq(works.slugFr, slugFr)).run();
}

describe('GET /api/projects', () => {
  it('lists the projects newest first, work still going on before the rest', async () => {
    const response = await get('/api/projects');

    assert.equal(response.statusCode, 200);
    assert.deepEqual(slugsOf(response.json()), [
      'immobilier-ch',
      'web-atrio',
      'cir-scancir',
      'linxea',
      'ledger',
      'case-tes-potes-mobile',
      'case-tes-potes-landing-page',
    ]);
  });

  it('serves each project as written, and no piece', async () => {
    assert.deepEqual((await get('/api/projects')).json(), PROJECTS);
  });

  it('tells caches to ask again, so a build right after a publish reads it', async () => {
    assert.equal((await get('/api/projects')).headers['cache-control'], 'no-cache');
  });

  it('leaves drafts out', async () => {
    setStatus('linxea', 'draft');

    assert.ok(!slugsOf((await get('/api/projects')).json()).includes('linxea'));
  });

  it('fails rather than serve a stored record that no longer meets its schema', async () => {
    database.db
      .update(works)
      .set({ document: { ...PROJECTS[0], role: { fr: '', en: '' } } })
      .where(eq(works.slugFr, 'immobilier-ch'))
      .run();

    assert.equal((await get('/api/projects')).statusCode, 500);
  });
});

describe('GET /api/artworks', () => {
  // Most pieces are dated by their year only: those released the same day
  // keep the order they were created in, which is the mosaic's.
  it('lists the pieces newest first, in their seeded order within a day', async () => {
    const response = await get('/api/artworks');

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), ARTWORKS);
  });
});

describe('GET /api/:kind/:locale/:slug', () => {
  it('finds a record by its slug in either tree', async () => {
    const fr = await get('/api/artworks/fr/extraterrestre');
    const en = await get('/api/artworks/en/alien');

    assert.equal(fr.statusCode, 200);
    assert.equal(fr.headers['cache-control'], 'no-cache');
    assert.deepEqual(en.json(), fr.json());
    assert.equal(en.json<Artwork>().title.en, 'Alien');
  });

  it('serves a project by its slug', async () => {
    const response = await get('/api/projects/en/linxea');

    assert.equal(response.json<Project>().slug.fr, 'linxea');
  });

  it('answers 404 for a slug of the other tree, a piece asked as a project, or a draft', async () => {
    setStatus('linxea', 'draft');

    for (const url of [
      '/api/artworks/fr/alien',
      '/api/projects/fr/extraterrestre',
      '/api/projects/fr/linxea',
      '/api/projects/de/linxea',
    ]) {
      const response = await get(url);
      assert.equal(response.statusCode, 404, url);
      assert.deepEqual(response.json(), { error: 'not-found' });
    }
  });
});

describe('GET /api/tools', () => {
  it('serves both registries, each tool tagged with its world', async () => {
    const response = await get('/api/tools');
    const tools = response.json<{ world: string; slug: string; label: string }[]>();

    assert.equal(response.statusCode, 200);
    assert.deepEqual(
      tools.find((tool) => tool.slug === 'angular'),
      { world: 'dev', slug: 'angular', label: 'Angular', glyph: null, logo: null },
    );
    assert.equal(tools.find((tool) => tool.slug === 'zbrush')?.world, 'cgi');
  });
});
