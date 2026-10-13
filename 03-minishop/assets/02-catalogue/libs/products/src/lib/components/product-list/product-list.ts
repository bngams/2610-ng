import { Component, inject } from '@angular/core';
import { ProductsService } from '../../services/products.service';
import { ProductCard } from '../product-card/product-card';

/** La liste des produits, en lecture seule : elle charge elle-même ses données. */
@Component({
  imports: [ProductCard],
  selector: 'lib-product-list',
  styleUrl: './product-list.css',
  templateUrl: './product-list.html',
})
export class ProductList {
  // un httpResource : la requête part toute seule, value(), isLoading() et error() sont des signals
  protected readonly products = inject(ProductsService).listResource();
}
