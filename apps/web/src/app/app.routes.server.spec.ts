import { PrerenderFallback, RenderMode } from '@angular/ssr';
import { describe, expect, it } from 'vitest';

import { PROJECTS } from '@core/data/static-content/static-content';
import { serverRoutes } from './app.routes.server';

function prerenderedWithParams(path: string) {
  const route = serverRoutes.find((r) => r.path === path);
  if (!route || !('getPrerenderParams' in route))
    throw new Error(`${path} has no prerender params`);
  return route;
}

describe('server routes', () => {
  // Anything other than Prerender needs a Node process in production, which
  // ADR-0008 rules out: nginx serves files and nothing else.
  it('prerenders everything and renders nothing on demand', () => {
    for (const route of serverRoutes) {
      expect(route.renderMode, route.path).toBe(RenderMode.Prerender);
    }
  });

  it('prerenders a page for every project', async () => {
    const route = prerenderedWithParams('developpeur/:slug');

    expect(await route.getPrerenderParams()).toEqual(PROJECTS.map((p) => ({ slug: p.slug.fr })));
    expect(route.fallback).toBe(PrerenderFallback.None);
  });

  it('emits the 404 as a file nginx can serve', async () => {
    expect(await prerenderedWithParams('**').getPrerenderParams()).toEqual([{ '**': '404' }]);
  });
});
