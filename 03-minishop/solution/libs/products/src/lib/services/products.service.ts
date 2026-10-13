import { Service } from '@angular/core';
import { ResourceService } from '@shop/api';
import { Product } from '../models/product';

/** Les produits : tout le CRUD est hérité de ResourceService, il ne reste qu'à donner le chemin. */
@Service() // Angular 22 : fourni à la racine (en v20 : @Injectable({ providedIn: 'root' }))
export class ProductsService extends ResourceService<number, Product> {
  protected readonly path = 'products';
}
