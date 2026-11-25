import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductCard, ProductsService } from '@shop/products';
import { MatButtonModule } from '@shop/ui';
import { CartStore } from '../../../cart/services/cart.store';

@Component({
  imports: [RouterLink, ProductCard, MatButtonModule],
  selector: 'app-catalog',
  styleUrl: './catalog.css',
  templateUrl: './catalog.html',
})
export class Catalog {
  protected readonly products = inject(ProductsService).listResource();
  protected readonly cart = inject(CartStore);
}
