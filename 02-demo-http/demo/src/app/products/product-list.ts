import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { ProductsService } from './products.service';

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <h1>Produits <small>HttpClient + toSignal</small></h1>
    @if (page(); as p) {
      <p>{{ p.skip + 1 }} à {{ p.skip + p.items.length }} sur {{ p.total }}</p>
      <ul class="products">
        @for (product of p.items; track product.id) {
          <li>
            <a [routerLink]="['/produits', product.id]">{{ product.title }}</a>
            <span>{{ product.price | currency: 'USD' }}</span>
          </li>
        }
      </ul>
      <div class="pager">
        <button (click)="previous()" [disabled]="p.skip === 0">Précédent</button>
        <button (click)="next()" [disabled]="p.skip + p.limit >= p.total">Suivant</button>
      </div>
    } @else {
      <p>Chargement…</p>
    }
  `,
})
export class ProductList {
  private readonly products = inject(ProductsService);
  readonly limit = 10;
  readonly skip = signal(0);

  // skip change => nouvelle requête ; switchMap annule celle qui n'est pas finie
  readonly page = toSignal(
    toObservable(this.skip).pipe(switchMap((skip) => this.products.list(skip, this.limit))),
  );

  previous() { this.skip.update((s) => Math.max(0, s - this.limit)); }
  next() { this.skip.update((s) => s + this.limit); }
}
