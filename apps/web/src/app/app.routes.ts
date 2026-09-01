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
  { path: '**', redirectTo: '' },
];
