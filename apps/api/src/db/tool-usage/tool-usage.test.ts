import { eq } from 'drizzle-orm';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { type OpenDatabase, openDatabase } from '../open-database.ts';
import { tools } from '../schema.ts';
import { ARTWORKS, PROJECTS } from '../seed/content.ts';
import { MEDIA } from '../seed/media.ts';
import { seedContent } from '../seed/seed.ts';
import { STACK } from '../seed/stack.ts';
import { TOOLS, toolId } from '../seed/tools.ts';
import { deleteTool, toolUsage } from './tool-usage.ts';

let directory: string;
let database: OpenDatabase;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'portfolio-tools-'));
  database = openDatabase(join(directory, 'tools.sqlite'));
  seedContent(database.db, {
    media: MEDIA,
    tools: TOOLS,
    stack: STACK,
    projects: PROJECTS,
    artworks: ARTWORKS,
  });
});

afterEach(() => {
  database.close();
  rmSync(directory, { recursive: true, force: true });
});

const slugs = () =>
  database.db
    .select({ slug: tools.slug })
    .from(tools)
    .all()
    .map((t) => t.slug);

describe('toolUsage', () => {
  it('names the works crediting a tool and the Stack entries showing it', () => {
    const usage = toolUsage(database.db, toolId('docker'));

    assert.deepEqual(usage.works, [
      { id: PROJECTS.at(-1)?.id, kind: 'dev', slug: 'case-tes-potes-landing-page' },
    ]);
    assert.deepEqual(
      usage.stack.map((entry) => entry.domain),
      ['dev'],
    );
  });

  it('finds a 3D tool in the pieces', () => {
    const usage = toolUsage(database.db, toolId('illustrator'));

    assert.deepEqual(
      usage.works.map((work) => work.slug),
      ['legos-minions'],
    );
    assert.deepEqual(usage.stack, []);
  });
});

describe('deleteTool', () => {
  it('refuses a tool a work credits, and says where', () => {
    const result = deleteTool(database.db, toolId('illustrator'));

    assert.equal(result.outcome, 'in-use');
    assert.ok(slugs().includes('illustrator'));
  });

  it('refuses a tool the Stack shows', () => {
    assert.equal(deleteTool(database.db, toolId('rxjs')).outcome, 'in-use');
  });

  it('deletes a tool nothing uses', () => {
    assert.deepEqual(deleteTool(database.db, toolId('symfony')), { outcome: 'deleted' });
    assert.ok(!slugs().includes('symfony'));
    assert.deepEqual(deleteTool(database.db, toolId('symfony')), { outcome: 'not-found' });
  });

  it('is backed by the database for the Stack: its foreign key restricts the delete', () => {
    assert.throws(() =>
      database.db
        .delete(tools)
        .where(eq(tools.id, toolId('rxjs')))
        .run(),
    );
  });
});
