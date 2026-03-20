import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Demo - 3D',
    loadComponent: () => import('./demo/demo'),
  },
];
