import { Routes } from '@angular/router';
import { authGuard } from '@shop/auth';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';

export const CART_ROUTES: Routes = [
  { path: '', component: Cart },
  { path: 'checkout', component: Checkout, canActivate: [authGuard] },
];
