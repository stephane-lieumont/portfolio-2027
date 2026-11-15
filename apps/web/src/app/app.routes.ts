import { ActivatedRouteSnapshot, Routes } from '@angular/router';
import type { LocalizedText } from '@portfolio/shared-types';

import { ARTWORKS, PROJECTS } from '@core/data/static-content/static-content';
import { inLocale } from '@core/i18n/in-locale.pipe';
import { SECTIONS, SITE_LOCALE } from '@core/i18n/site-locale/site-locale';

const DEV = SECTIONS.dev[SITE_LOCALE];
const CGI = SECTIONS.cgi[SITE_LOCALE];
const CONTACT = SECTIONS.contact[SITE_LOCALE];

/**
 * Whether the second URL segment names a project we actually have.
 *
 * Named and exported rather than inlined into `canMatch` so it can be tested
 * for what it decides — an unknown slug reaching the 404 instead of rendering
 * an empty detail page — without reconstructing Angular's guard signature.
 */
export function projectSlugExists(segments: readonly { readonly path: string }[]): boolean {
  const slug = segments[1]?.path;
  return slug !== undefined && PROJECTS.some((p) => p.slug[SITE_LOCALE] === slug);
}

/** Whether the first URL segment, under the 3D world, names a piece we have. */
export function artworkSlugExists(segments: readonly { readonly path: string }[]): boolean {
  const slug = segments[0]?.path;
  return slug !== undefined && ARTWORKS.some((a) => a.slug[SITE_LOCALE] === slug);
}

function artworkOf(route: ActivatedRouteSnapshot) {
  return ARTWORKS.find((a) => a.slug[SITE_LOCALE] === route.paramMap.get('slug'));
}

// The route only matches known slugs, so the lookup cannot miss here; the
// empty text keeps the resolvers total rather than asserting.
const EMPTY: LocalizedText = { fr: '', en: '' };

function projectOf(route: ActivatedRouteSnapshot) {
  return PROJECTS.find((p) => p.slug[SITE_LOCALE] === route.paramMap.get('slug'));
}

// Descriptions reuse each page's own lead rather than separate marketing copy.
// `data.page` names the page across both trees, for the switcher and hreflang.
export const routes: Routes = [
  // The mockup opens on the developer world; there is no home page of its own.
  { path: '', pathMatch: 'full', redirectTo: DEV },
  {
    path: DEV,
    title: $localize`:@@page.dev.title:Lead Tech, Angular et .NET`,
    data: {
      page: 'dev',
      world: 'dev',
      description: $localize`:@@page.dev.description:J’arbitre les choix techniques, j’encadre, et j’écris du code tous les jours. Quatorze ans dans l’aéronautique avant de basculer vers le développement : c’est de là que vient ma façon de travailler.`,
    },
    loadComponent: () =>
      import('@features/world/views/world-page/world-page.component').then(
        (m) => m.WorldPageComponent,
      ),
  },
  // Only known slugs match. An unknown one falls through to the 404 below
  // rather than rendering an empty project page, which keeps the dead-link
  // reporting honest and lets the component treat its project as always
  // present. The summary is the description: the page itself opens on the
  // context instead.
  {
    path: `${DEV}/:slug`,
    data: { page: 'project' },
    canMatch: [
      (_route: unknown, segments: readonly { path: string }[]) => projectSlugExists(segments),
    ],
    title: (route: ActivatedRouteSnapshot) => inLocale(projectOf(route)?.title ?? EMPTY),
    resolve: {
      description: (route: ActivatedRouteSnapshot) => inLocale(projectOf(route)?.summary ?? EMPTY),
    },
    loadComponent: () =>
      import('@features/project/views/project-page/project-page.component').then(
        (m) => m.ProjectPageComponent,
      ),
  },
  {
    path: CGI,
    title: $localize`:@@page.cgi.title:Graphisme 3D`,
    data: {
      page: 'cgi',
      world: 'cgi',
      description: $localize`:@@page.cgi.description:J’ai commencé la 3D bien avant le développement. C’est là que j’ai appris à apprendre seul — et à regarder une image jusqu’à voir ce qui ne va pas.`,
    },
    loadComponent: () =>
      import('@features/world/views/world-page/world-page.component').then(
        (m) => m.WorldPageComponent,
      ),
    // Each piece has its own address (spec 01), which opens the viewer over the
    // wall. Children without a component: the page stays the same instance
    // while the viewer opens, steps and closes.
    children: [
      { path: '', children: [] },
      {
        path: ':slug',
        data: { page: 'piece' },
        canMatch: [
          (_route: unknown, segments: readonly { path: string }[]) => artworkSlugExists(segments),
        ],
        title: (route: ActivatedRouteSnapshot) => inLocale(artworkOf(route)?.title ?? EMPTY),
        resolve: {
          description: (route: ActivatedRouteSnapshot) =>
            inLocale(artworkOf(route)?.image.alt ?? EMPTY),
        },
        children: [],
      },
    ],
  },
  {
    path: CONTACT,
    title: $localize`:@@page.contact.title:Contact`,
    data: {
      page: 'contact',
      // Without the lead's « par email »: the contact redesign publishes none.
      description: $localize`:@@page.contact.description:Un projet, une question ou juste un Hello World ? Je réponds à tout, y compris pour dire non.`,
    },
    loadComponent: () =>
      import('@features/contact/views/contact/contact.component').then((m) => m.ContactComponent),
  },
  // A real page rather than a redirect home. Redirecting hides dead links
  // instead of reporting them, and it is what the current site does — every
  // wrong address silently becomes the home page. It is prerendered once, at
  // /404 (app.routes.server.ts), and nginx serves that file with a real 404
  // status (see production-constraints).
  {
    path: '**',
    title: $localize`:@@page.notFound.title:Erreur 404`,
    data: { page: 'not-found', noindex: true },
    loadComponent: () =>
      import('@features/errors/views/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
