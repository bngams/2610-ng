import { Component, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductsService } from '@shop/products';
import { MatButtonModule } from '@shop/ui';

@Component({
  imports: [CurrencyPipe, RouterLink, MatButtonModule],
  selector: 'app-product-detail',
  styleUrl: './product-detail.css',
  templateUrl: './product-detail.html',
})
export class ProductDetail {
  /** Le paramètre :id de l'URL (withComponentInputBinding), toujours une chaîne. */
  readonly id = input.required<string>();

  // rechargé tout seul si l'id change
  protected readonly product = inject(ProductsService).getResource(() => Number(this.id()));
}
