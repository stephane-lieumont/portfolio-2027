import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { STACK, TOOLS } from '@core/data/content/content.generated';
import { WORLD_PAGES } from '@core/data/world-content/world-content';
import { stackOf, toolBySlug, toolView } from './tool-marks';

const PUBLIC = join(process.cwd(), 'public');

describe('toolView', () => {
  const all = TOOLS.map((tool) => toolView(tool));

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
      ...STACK.map((entry) => entry.tool),
      ...WORLD_PAGES.dev.eyebrowTools.map(toolBySlug),
      ...WORLD_PAGES.cgi.eyebrowTools.map(toolBySlug),
    ];
    for (const tool of shown) expect(toolView(tool).mask, tool.slug).not.toBeNull();
  });

  it('uses the mockup’s grouped names in the stack only', () => {
    expect(toolView(toolBySlug('dotnet'), 'stack').label).toBe('.NET / C#');
    expect(toolView(toolBySlug('dotnet')).label).toBe('.NET');
  });

  it('reads a translated label in this build’s language', () => {
    expect(toolView(toolBySlug('unit-tests')).label).toBe('Tests unitaires');
  });

  it('shows a tool without a mark by its name alone', () => {
    expect(toolView(toolBySlug('csharp')).mask).toBeNull();
  });
});

describe('toolBySlug', () => {
  it('fails loudly on a tool the API does not serve', () => {
    expect(() => toolBySlug('cobol')).toThrow(/no tool cobol/);
  });
});

describe('stackOf', () => {
  it('lists a world’s entries in their order, Angular first', () => {
    const dev = stackOf('dev');
    expect(dev[0]?.tool.slug).toBe('angular');
    expect(dev.map((entry) => entry.position)).toEqual(dev.map((_, i) => i));
    expect(stackOf('cgi').every((entry) => entry.domain === 'cgi')).toBe(true);
  });
});
