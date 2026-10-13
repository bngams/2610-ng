import { Routes } from '@angular/router';
import { Login, roleGuard } from '@shop/auth';
import { NotFound } from './pages/not-found/not-found';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    // canMatch est évalué AVANT loadComponent : sans le rôle, le fichier de la page n'est même pas téléchargé
    canMatch: [roleGuard('admin')],
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  { path: 'login', component: Login }, // la page de connexion de @shop/auth, comme dans le FO
  { path: '**', component: NotFound },
];
