import type { Artwork, Project, PublicationStatus } from '@portfolio/shared-types/project';
import type { StackEntry } from '@portfolio/shared-types/stack';
import type { Tool } from '@portfolio/shared-types/tool';
import { eq } from 'drizzle-orm';
import Fastify, { type FastifyInstance } from 'fastify';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { type OpenDatabase, openDatabase } from '../db/open-database.ts';
import { mediaAssets, works } from '../db/schema.ts';
import { ARTWORKS, PROJECTS } from '../db/seed/content.ts';
import { MEDIA, mediaId } from '../db/seed/media.ts';
import { seedContent } from '../db/seed/seed.ts';
import { STACK } from '../db/seed/stack.ts';
import { TOOLS, toolId } from '../db/seed/tools.ts';
import { resolveContent } from '../lib/resolve-content/resolve-content.ts';
import contentRoutes from './content.ts';

const CONTENT = {
  media: MEDIA,
  tools: TOOLS,
  stack: STACK,
  projects: PROJECTS,
  artworks: ARTWORKS,
};
const SERVED = resolveContent(CONTENT);

let directory: string;
let database: OpenDatabase;
let app: FastifyInstance;

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'portfolio-content-'));
  database = openDatabase(join(directory, 'content.sqlite'));
  seedContent(database.db, CONTENT);
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

  it('serves each project with its images and tools resolved, and no piece', async () => {
    assert.deepEqual((await get('/api/projects')).json(), SERVED.projects);
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

  it('fails rather than serve a project whose image is gone', async () => {
    database.db
      .update(works)
      .set({ document: { ...PROJECTS[0], logo: mediaId('cgi/beebop.jpg') } })
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
    assert.deepEqual(response.json(), SERVED.artworks);
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
  it('serves every tool with its icon resolved', async () => {
    const response = await get('/api/tools');
    const tools = response.json<Tool[]>();

    assert.equal(response.statusCode, 200);
    assert.equal(tools.length, TOOLS.length);
    assert.deepEqual(
      tools.find((tool) => tool.slug === 'zbrush'),
      {
        id: toolId('zbrush'),
        slug: 'zbrush',
        label: { fr: 'ZBrush', en: 'ZBrush' },
        icon: { src: '/logos/zbrush.png', width: 110, height: 97 },
      },
    );
  });

  it('fails rather than serve a tool whose icon is not a mark', async () => {
    database.db
      .update(mediaAssets)
      .set({ purpose: 'logo' })
      .where(eq(mediaAssets.key, '/logos/zbrush.png'))
      .run();

    assert.equal((await get('/api/tools')).statusCode, 500);
  });
});

describe('GET /api/stack', () => {
  const domainsAndTools = (entries: StackEntry[]) =>
    entries.map((entry) => `${entry.domain} ${entry.tool.slug}`);

  it('serves one domain in its order, each entry with its tool', async () => {
    const response = await get('/api/stack?domain=cgi');

    assert.equal(response.statusCode, 200);
    assert.deepEqual(domainsAndTools(response.json()), [
      'cgi 3dsmax',
      'cgi vray',
      'cgi zbrush',
      'cgi substance-painter',
      'cgi photoshop',
    ]);
    assert.deepEqual(response.json<StackEntry[]>()[0]?.points[0]?.strongLine, {
      fr: 'La modélisation polygonale.',
      en: 'Polygon modelling.',
    });
  });

  it('serves both domains, dev first, when none is asked', async () => {
    const entries = (await get('/api/stack')).json<StackEntry[]>();

    assert.equal(entries.length, STACK.length);
    assert.equal(domainsAndTools(entries)[0], 'dev angular');
    assert.equal(entries.at(-1)?.domain, 'cgi');
  });

  it('refuses a domain that is not a world', async () => {
    const response = await get('/api/stack?domain=music');

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), { error: 'invalid-domain' });
  });
});
