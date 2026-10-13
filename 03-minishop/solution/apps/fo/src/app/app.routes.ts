import { Routes } from '@angular/router';
import { Login } from '@shop/auth';
import { Home } from './pages/home/home';
import { NotFound } from './pages/not-found/not-found';

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: 'catalog',
    loadChildren: () => import('./features/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES),
  },
  {
    path: 'cart',
    loadChildren: () => import('./features/cart/cart.routes').then((m) => m.CART_ROUTES),
  },
  { path: 'login', component: Login },
  { path: '**', component: NotFound },
];
