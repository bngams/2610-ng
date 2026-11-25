import { Routes } from '@angular/router';
import { Catalog } from './pages/catalog/catalog';
import { ProductDetail } from './pages/product-detail/product-detail';

// les routes de la feature catalogue, chargées à la demande (loadChildren dans app.routes.ts)
export const CATALOG_ROUTES: Routes = [
  { path: '', component: Catalog },
  { path: ':id', component: ProductDetail }, // :id arrive dans l'input id du composant
];
