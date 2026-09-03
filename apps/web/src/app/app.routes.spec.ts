import { describe, expect, it } from 'vitest';

import { PROJECTS } from './core/static-content';
import { projectSlugExists, routes } from './app.routes';

function segmentsOf(path: string): { readonly path: string }[] {
  return path.split('/').map((p) => ({ path: p }));
}

describe('routes', () => {
  it('resolves every section a visitor can reach from the navigation', () => {
    for (const path of ['', 'developpeur', 'graphisme-3d', 'contact']) {
      expect(routes.some((r) => r.path === path)).toBe(true);
    }
  });

  // Calling each loader is the only way to find out that a lazy import points
  // at a component that still exists and still exports the name the route
  // expects. A renamed class typechecks here and fails at runtime, on the one
  // route nobody clicked before shipping.
  it('loads a real component for every route', async () => {
    for (const route of routes) {
      expect(route.loadComponent, `route "${route.path}" has no loader`).toBeDefined();
      const loaded = await route.loadComponent!();
      expect(loaded, `route "${route.path}" resolved nothing`).toBeTruthy();
    }
  });

  it('reports dead links instead of hiding them', () => {
    const fallback = routes.at(-1);

    // A catch-all redirect home is what the current site does: every wrong
    // address silently becomes the home page, so nobody ever learns a link
    // rotted. The wildcard must render a page, not redirect.
    expect(fallback?.path).toBe('**');
    expect(fallback?.redirectTo).toBeUndefined();
    expect(fallback?.loadComponent).toBeDefined();
  });
});

describe('the project detail guard', () => {
  const match = (path: string) => projectSlugExists(segmentsOf(path));

  it('is the guard the route actually uses', () => {
    const route = routes.find((r) => r.path === 'developpeur/:slug');
    expect(route?.canMatch).toHaveLength(1);
  });

  it('matches every real project', () => {
    for (const project of PROJECTS) {
      expect(match(`developpeur/${project.slug}`)).toBe(true);
    }
  });

  it('lets an unknown slug fall through to the 404', () => {
    // Not a redirect and not an empty detail page: the route simply does not
    // match, so the wildcard below it renders the 404.
    expect(match('developpeur/projet-qui-nexiste-pas')).toBe(false);
    expect(match('developpeur/')).toBe(false);
  });

  it('does not match a slug that merely contains a real one', () => {
    const real = PROJECTS[0].slug;

    expect(match(`developpeur/${real}-copie`)).toBe(false);
    expect(match(`developpeur/prefixe-${real}`)).toBe(false);
  });

  it('survives a request with no slug segment at all', () => {
    expect(match('developpeur')).toBe(false);
  });
});
