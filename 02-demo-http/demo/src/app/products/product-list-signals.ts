import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductsService } from './products.service';

@Component({
  selector: 'app-product-list-signals',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <h1>Produits <small>httpResource</small></h1>
    @if (page.error()) {
      <p class="error">Impossible de charger la liste.</p>
    }
    @if (page.hasValue()) {
      @let p = page.value();
      <p>{{ p.skip + 1 }} à {{ p.skip + p.items.length }} sur {{ p.total }}
        @if (page.isLoading()) { <small>(chargement…)</small> }</p>
      <ul class="products">
        @for (product of p.items; track product.id) {
          <li>
            <a [routerLink]="['/produits', product.id]">{{ product.title }}</a>
            <span>{{ product.price | currency: 'USD' }}</span>
          </li>
        }
      </ul>
      <div class="pager">
        <button (click)="previous()" [disabled]="skip() === 0">Précédent</button>
        <button (click)="next()" [disabled]="skip() + limit >= p.total">Suivant</button>
      </div>
    } @else if (page.isLoading()) {
      <p>Chargement…</p>
    }
  `,
})
export class ProductListSignals {
  readonly limit = 10;
  readonly skip = signal(0);
  private readonly params = computed(() => ({ skip: this.skip(), limit: this.limit }));

  // params change => httpResource relance la requête (et annule la précédente)
  readonly page = inject(ProductsService).listResource(this.params);

  previous() { this.skip.update((s) => Math.max(0, s - this.limit)); }
  next() { this.skip.update((s) => s + this.limit); }
}
