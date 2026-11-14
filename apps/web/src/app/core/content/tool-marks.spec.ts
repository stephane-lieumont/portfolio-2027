import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { SOFTWARE, TECHNOLOGIES } from '@portfolio/shared-types/registries';
import { describe, expect, it } from 'vitest';

import { WORLD_PAGES, WORLD_STACKS } from './world-content';
import { toolView } from './tool-marks';

const PUBLIC = join(process.cwd(), 'public');

describe('toolView', () => {
  const all = [...TECHNOLOGIES, ...SOFTWARE].map((entry) => toolView(entry.slug));

  it('points every mark at a root-relative file the app actually ships', () => {
    for (const { mask } of all) {
      if (!mask) continue;
      const path = /^url\('(\/[^']+)'\)$/.exec(mask)?.[1];
      expect(path, mask).toBeDefined();
      expect(existsSync(join(PUBLIC, path!)), path).toBe(true);
    }
  });

  it('has a mark for every tool of both stacks and both eyebrows', () => {
    const shown = [
      ...WORLD_STACKS.dev.entries.map((e) => e.tool),
      ...WORLD_STACKS.cgi.entries.map((e) => e.tool),
      ...WORLD_PAGES.dev.eyebrowTools,
      ...WORLD_PAGES.cgi.eyebrowTools,
    ];
    for (const slug of shown) expect(toolView(slug).mask, slug).not.toBeNull();
  });

  it('uses the mockup’s grouped names in the stack only', () => {
    expect(toolView('dotnet', 'stack').label).toBe('.NET / C#');
    expect(toolView('dotnet').label).toBe('.NET');
  });
});
