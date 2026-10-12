import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'produits' },
  // loadComponent : le code du composant n'est téléchargé qu'à la première visite
  { path: 'produits', loadComponent: () => import('./products/product-list').then((m) => m.ProductList) },
  { path: 'produits/:id', loadComponent: () => import('./products/product-detail').then((m) => m.ProductDetail) },
  { path: 'produits-signals', loadComponent: () => import('./products/product-list-signals').then((m) => m.ProductListSignals) },
  { path: 'bases', loadComponent: () => import('./pages/http-basics').then((m) => m.HttpBasics) },
  { path: 'connexion', loadComponent: () => import('./pages/login').then((m) => m.Login) },
  { path: '**', redirectTo: 'produits' },
];
