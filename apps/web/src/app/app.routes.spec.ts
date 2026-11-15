import { ActivatedRouteSnapshot, convertToParamMap } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { ARTWORKS, PROJECTS } from '@core/data/static-content/static-content';
import { artworkSlugExists, projectSlugExists, routes } from './app.routes';

function segmentsOf(path: string): { readonly path: string }[] {
  return path.split('/').map((p) => ({ path: p }));
}

describe('routes', () => {
  it('resolves every section a visitor can reach from the navigation', () => {
    for (const path of ['developpeur', 'graphisme-3d', 'contact']) {
      expect(routes.some((r) => r.path === path)).toBe(true);
    }
  });

  it('opens the site on the developer world, as the mockup does', () => {
    const root = routes.find((r) => r.path === '');
    expect(root?.redirectTo).toBe('developpeur');
    expect(root?.pathMatch).toBe('full');
  });

  // Calling each loader is the only way to find out that a lazy import points
  // at a component that still exists and still exports the name the route
  // expects. A renamed class typechecks here and fails at runtime, on the one
  // route nobody clicked before shipping.
  it('loads a real component for every route', async () => {
    for (const route of routes.filter((r) => r.redirectTo === undefined)) {
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
      expect(match(`developpeur/${project.slug.fr}`)).toBe(true);
    }
  });

  it('lets an unknown slug fall through to the 404', () => {
    // Not a redirect and not an empty detail page: the route simply does not
    // match, so the wildcard below it renders the 404.
    expect(match('developpeur/projet-qui-nexiste-pas')).toBe(false);
    expect(match('developpeur/')).toBe(false);
  });

  it('does not match a slug that merely contains a real one', () => {
    const real = PROJECTS[0].slug.fr;

    expect(match(`developpeur/${real}-copie`)).toBe(false);
    expect(match(`developpeur/prefixe-${real}`)).toBe(false);
  });

  it('survives a request with no slug segment at all', () => {
    expect(match('developpeur')).toBe(false);
  });
});

describe('a 3D piece’s address', () => {
  const gallery = routes.find((r) => r.path === 'graphisme-3d')!;
  const piece = gallery.children!.find((r) => r.path === ':slug')!;

  it('matches every published piece, and only those, so an unknown one reaches the 404', () => {
    for (const artwork of ARTWORKS)
      expect(artworkSlugExists([{ path: artwork.slug.fr }])).toBe(true);
    expect(artworkSlugExists([{ path: 'nope' }])).toBe(false);
    expect(artworkSlugExists([])).toBe(false);
  });

  it('titles the page after the piece and describes it by its alt text', () => {
    const snapshot = {
      paramMap: convertToParamMap({ slug: ARTWORKS[2].slug.fr }),
    } as ActivatedRouteSnapshot;
    const title = piece.title as (route: ActivatedRouteSnapshot) => string;
    const description = piece.resolve!['description'] as (route: ActivatedRouteSnapshot) => string;
    expect(title(snapshot)).toBe(ARTWORKS[2].title.fr);
    expect(description(snapshot)).toBe(ARTWORKS[2].image.alt.fr);
  });
});
