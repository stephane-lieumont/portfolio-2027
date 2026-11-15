import { type Artwork, type Project, projectSchema } from '@portfolio/shared-types/project';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { type OpenDatabase, openDatabase } from '../open-database.ts';
import { works } from '../schema.ts';
import { ARTWORKS, PROJECTS } from './content.ts';
import { seedContent } from './seed.ts';

let directory: string;
let database: OpenDatabase;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'portfolio-seed-'));
  database = openDatabase(join(directory, 'seed.sqlite'));
});

afterEach(() => {
  database.close();
  rmSync(directory, { recursive: true, force: true });
});

const content = { projects: PROJECTS, artworks: ARTWORKS };
const rows = () => database.db.select().from(works).all();

describe('seedContent', () => {
  it('publishes every project and piece, each with its slugs and release date beside it', () => {
    const report = seedContent(database.db, content, new Date('2026-11-15T10:00:00Z'));

    assert.deepEqual(report, { written: 23, unchanged: 0 });
    const linxea = rows().find((row) => row.slugFr === 'linxea');
    assert.equal(linxea?.kind, 'dev');
    assert.equal(linxea?.status, 'published');
    assert.equal(linxea?.releasedAt, '2024-06-01');
    assert.equal(linxea?.publishedAt, '2026-11-15T10:00:00.000Z');
    assert.equal(rows().find((row) => row.slugEn === 'alien')?.kind, 'cgi');
  });

  it('changes nothing when run again on the same content', () => {
    seedContent(database.db, content, new Date('2026-11-15T10:00:00Z'));
    const report = seedContent(database.db, content, new Date('2026-11-16T10:00:00Z'));

    assert.deepEqual(report, { written: 0, unchanged: 23 });
    assert.ok(rows().every((row) => row.updatedAt === '2026-11-15T10:00:00.000Z'));
  });

  it('rewrites a record whose content changed, and keeps its first publication date', () => {
    seedContent(database.db, content, new Date('2026-11-15T10:00:00Z'));
    const [first, ...others] = PROJECTS;
    const retitled: Project = { ...first, title: { fr: 'Nouveau titre', en: 'New title' } };
    const report = seedContent(
      database.db,
      { projects: [retitled, ...others], artworks: ARTWORKS },
      new Date('2026-11-16T10:00:00Z'),
    );

    assert.deepEqual(report, { written: 1, unchanged: 22 });
    const row = rows().find((r) => r.id === first.id);
    assert.deepEqual(projectSchema.parse(row?.document).title, retitled.title);
    assert.equal(row?.updatedAt, '2026-11-16T10:00:00.000Z');
    assert.equal(row?.publishedAt, '2026-11-15T10:00:00.000Z');
  });

  it('writes nothing when one record breaks its schema, and names it', () => {
    const [first] = ARTWORKS;
    const broken = { ...first, software: [] } satisfies Artwork;

    assert.throws(
      () => seedContent(database.db, { projects: PROJECTS, artworks: [broken] }),
      /cgi legos-minions is invalid:\n {2}software:/,
    );
    assert.deepEqual(rows(), []);
  });
});
