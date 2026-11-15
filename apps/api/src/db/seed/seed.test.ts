import { projectRecordSchema } from '@portfolio/shared-types/project';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { type OpenDatabase, openDatabase } from '../open-database.ts';
import { mediaAssets, stack, tools, works } from '../schema.ts';
import { ARTWORKS, PROJECTS } from './content.ts';
import { MEDIA } from './media.ts';
import { seedContent } from './seed.ts';
import { STACK } from './stack.ts';
import { TOOLS, toolId } from './tools.ts';

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

const content = {
  media: MEDIA,
  tools: TOOLS,
  stack: STACK,
  projects: PROJECTS,
  artworks: ARTWORKS,
};
const total = MEDIA.length + TOOLS.length + STACK.length + PROJECTS.length + ARTWORKS.length;
const rows = () => database.db.select().from(works).all();

describe('seedContent', () => {
  it('publishes every project and piece, each with its slugs and release date beside it', () => {
    const report = seedContent(database.db, content, new Date('2026-11-15T10:00:00Z'));

    assert.deepEqual(report, { written: total, unchanged: 0 });
    const linxea = rows().find((row) => row.slugFr === 'linxea');
    assert.equal(linxea?.kind, 'dev');
    assert.equal(linxea?.status, 'published');
    assert.equal(linxea?.releasedAt, '2024-06-01');
    assert.equal(linxea?.publishedAt, '2026-11-15T10:00:00.000Z');
    assert.equal(rows().find((row) => row.slugEn === 'alien')?.kind, 'cgi');
  });

  it('writes the media, the tools and the Stack beside the works', () => {
    seedContent(database.db, content);

    assert.equal(database.db.select().from(mediaAssets).all().length, MEDIA.length);
    const angular = database.db
      .select()
      .from(tools)
      .all()
      .find((t) => t.slug === 'angular');
    assert.equal(angular?.id, toolId('angular'));
    assert.equal(
      MEDIA.find((asset) => asset.id === angular?.icon)?.key,
      '/logos/simple-icons/angular.svg',
    );
    const devStack = database.db
      .select()
      .from(stack)
      .all()
      .filter((e) => e.domain === 'dev');
    assert.equal(devStack.find((entry) => entry.position === 0)?.tool, toolId('angular'));
  });

  it('changes nothing when run again on the same content', () => {
    seedContent(database.db, content, new Date('2026-11-15T10:00:00Z'));
    const report = seedContent(database.db, content, new Date('2026-11-16T10:00:00Z'));

    assert.deepEqual(report, { written: 0, unchanged: total });
    assert.ok(rows().every((row) => row.updatedAt === '2026-11-15T10:00:00.000Z'));
    assert.ok(
      database.db
        .select()
        .from(tools)
        .all()
        .every((row) => row.updatedAt === '2026-11-15T10:00:00.000Z'),
    );
  });

  it('rewrites a record whose content changed, and keeps its first publication date', () => {
    seedContent(database.db, content, new Date('2026-11-15T10:00:00Z'));
    const [first, ...others] = PROJECTS;
    const retitled = { ...first, title: { fr: 'Nouveau titre', en: 'New title' } };
    const [angular, ...otherTools] = TOOLS;
    const renamed = { ...angular, label: { fr: 'Angular 22', en: 'Angular 22' } };
    const report = seedContent(
      database.db,
      { ...content, projects: [retitled, ...others], tools: [renamed, ...otherTools] },
      new Date('2026-11-16T10:00:00Z'),
    );

    assert.deepEqual(report, { written: 2, unchanged: total - 2 });
    const row = rows().find((r) => r.id === first.id);
    assert.deepEqual(projectRecordSchema.parse(row?.document).title, retitled.title);
    assert.equal(row?.updatedAt, '2026-11-16T10:00:00.000Z');
    assert.equal(row?.publishedAt, '2026-11-15T10:00:00.000Z');
  });

  it('writes nothing when one record breaks its schema, and names it', () => {
    const [first] = ARTWORKS;

    assert.throws(
      () => seedContent(database.db, { ...content, artworks: [{ ...first, software: [] }] }),
      /cgi legos-minions is invalid:\n {2}software:/,
    );
    assert.deepEqual(rows(), []);
  });

  it('writes nothing when a record points at a tool that does not exist', () => {
    const [first, ...others] = PROJECTS;
    const ghost = { ...first, technologies: ['00000000-0000-4000-8000-000000000000'] };

    assert.throws(
      () => seedContent(database.db, { ...content, projects: [ghost, ...others] }),
      /no tool 00000000-0000-4000-8000-000000000000/,
    );
    assert.deepEqual(database.db.select().from(tools).all(), []);
  });
});
