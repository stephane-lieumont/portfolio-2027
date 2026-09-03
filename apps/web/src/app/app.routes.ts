import { Routes } from '@angular/router';

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

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'developpeur',
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
    loadComponent: () =>
      import('./features/project-detail/project-detail').then((m) => m.ProjectDetail),
  },
  {
    path: 'graphisme-3d',
    loadComponent: () => import('./features/gallery/gallery').then((m) => m.Gallery),
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact').then((m) => m.Contact),
  },
  // A real page rather than a redirect home. Redirecting hides dead links
  // instead of reporting them, and it is what the current site does — every
  // wrong address silently becomes the home page. Serving this with an actual
  // 404 status is nginx's job (see production-constraints).
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
