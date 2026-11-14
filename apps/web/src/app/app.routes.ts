import { ActivatedRouteSnapshot, Routes } from '@angular/router';

import { PROJECTS } from './core/static-content';

/**
 * Whether the second URL segment names a project we actually have.
 *
 * Named and exported rather than inlined into `canMatch` so it can be tested
 * for what it decides — an unknown slug reaching the 404 instead of rendering
 * an empty detail page — without reconstructing Angular's guard signature.
 */
export function projectSlugExists(segments: readonly { readonly path: string }[]): boolean {
  const slug = segments[1]?.path;
  return slug !== undefined && PROJECTS.some((p) => p.slug === slug);
}

// The route only matches known slugs, so the lookup cannot miss here; the
// empty string keeps the resolvers total rather than asserting.
function projectOf(route: ActivatedRouteSnapshot) {
  return PROJECTS.find((p) => p.slug === route.paramMap.get('slug'));
}

// Descriptions reuse each page's own lead rather than separate marketing copy.
export const routes: Routes = [
  {
    path: '',
    data: {
      description:
        'Angular, TypeScript, .NET. Des applications menées de la décision technique à la mise en production. Modélisation, texturing, rendu. Une pratique apprise seule, qui nourrit mon regard de développeur.',
    },
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'developpeur',
    title: 'Lead Tech, Angular et .NET',
    data: {
      description:
        'J’arbitre les choix techniques, j’encadre, et j’écris du code tous les jours. Quatorze ans dans l’aéronautique avant de basculer vers le développement : c’est de là que vient ma façon de travailler.',
    },
    loadComponent: () => import('./features/developer/developer').then((m) => m.Developer),
  },
  // Only known slugs match. An unknown one falls through to the 404 below
  // rather than rendering an empty detail page, which keeps the dead-link
  // reporting honest and lets the component treat its project as always
  // present.
  {
    path: 'developpeur/:slug',
    canMatch: [
      (_route: unknown, segments: readonly { path: string }[]) => projectSlugExists(segments),
    ],
    title: (route: ActivatedRouteSnapshot) => projectOf(route)?.title ?? '',
    resolve: { description: (route: ActivatedRouteSnapshot) => projectOf(route)?.summary ?? '' },
    loadComponent: () =>
      import('./features/project-detail/project-detail').then((m) => m.ProjectDetail),
  },
  {
    path: 'graphisme-3d',
    title: 'Graphisme 3D',
    data: {
      // Without the lead's « sans école et sans commande »: the Pixmodels
      // commission contradicts it, and it is on the content review list.
      description:
        'J’ai commencé la 3D bien avant le développement. C’est là que j’ai appris à apprendre seul — et à regarder une image jusqu’à voir ce qui ne va pas.',
    },
    loadComponent: () => import('./features/gallery/gallery').then((m) => m.Gallery),
  },
  {
    path: 'contact',
    title: 'Contact',
    data: {
      // Without the lead's « par email »: the contact redesign publishes none.
      description:
        'Un projet, une question ou juste un Hello World ? Je réponds à tout, y compris pour dire non.',
    },
    loadComponent: () => import('./features/contact/contact').then((m) => m.Contact),
  },
  // A real page rather than a redirect home. Redirecting hides dead links
  // instead of reporting them, and it is what the current site does — every
  // wrong address silently becomes the home page. It is prerendered once, at
  // /404 (app.routes.server.ts), and nginx serves that file with a real 404
  // status (see production-constraints).
  {
    path: '**',
    title: 'Erreur 404',
    data: { noindex: true },
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
