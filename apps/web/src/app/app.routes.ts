import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'developpeur',
    loadComponent: () => import('./features/developer/developer').then((m) => m.Developer),
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
