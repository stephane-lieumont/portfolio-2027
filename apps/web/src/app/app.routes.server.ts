import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';

import { ARTWORKS, PROJECTS } from '@core/data/static-content';
import { SECTIONS, SITE_LOCALE } from '@core/i18n/site-locale';

/**
 * Every route is prerendered at build time and nothing is rendered on demand:
 * nginx serves the files and no Node process runs in production (ADR-0008).
 */
export const serverRoutes: ServerRoute[] = [
  {
    // From the static content for now. ADR-0008 enumerates them from the API
    // once it serves projects, which makes the API a build dependency.
    path: `${SECTIONS.dev[SITE_LOCALE]}/:slug`,
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      PROJECTS.map((project) => ({ slug: project.slug[SITE_LOCALE] })),
    // An unknown slug is nginx's 404, not a page rendered on the fly.
    fallback: PrerenderFallback.None,
  },
  {
    path: `${SECTIONS.cgi[SITE_LOCALE]}/:slug`,
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      ARTWORKS.map((artwork) => ({ slug: artwork.slug[SITE_LOCALE] })),
    fallback: PrerenderFallback.None,
  },
  {
    // The wildcard is rendered once, at /404, so nginx has a real file to
    // serve with a real 404 status: `error_page 404 /404/index.html`.
    path: '**',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [{ '**': '404' }],
  },
];
