import { Component, inject, input, numberAttribute } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Subject, exhaustMap, map } from 'rxjs';
import { ProductsService } from './products.service';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <p>
      <a routerLink="/produits">Retour à la liste</a> ·
      <a [routerLink]="['/produits', id() + 1]">Produit suivant</a>
    </p>
    <table class="ids">
      <tr><th>id lu par input() (withComponentInputBinding)</th><td>{{ id() }}</td></tr>
      <tr><th>id lu par ActivatedRoute.paramMap (Observable)</th><td>{{ idFromParamMap() }}</td></tr>
      <tr><th>id lu par ActivatedRoute.snapshot (lu une fois)</th><td>{{ idFromSnapshot }}</td></tr>
    </table>
    @if (product.error()) {
      <p class="error">Produit {{ id() }} introuvable.</p>
    }
    @if (product.hasValue()) {
      @let p = product.value();
      <h1>{{ p.title }}</h1>
      <img [src]="p.thumbnail" [alt]="p.title" width="160" height="160" />
      <p>{{ p.description }}</p>
      <p>Prix : <strong>{{ p.price | currency: 'USD' }}</strong> · catégorie {{ p.category }}</p>
      <button (click)="discount$.next(p.price)">Baisser le prix de 10 % (PATCH simulé)</button>
    } @else if (product.isLoading()) {
      <p>Chargement…</p>
    }
  `,
})
export class ProductDetail {
  private readonly products = inject(ProductsService);
  private readonly route = inject(ActivatedRoute);

  // 1. withComponentInputBinding() : le :id de l'URL arrive dans cet input()
  readonly id = input.required({ transform: numberAttribute });

  // 2. la méthode classique, ActivatedRoute
  readonly idFromParamMap = toSignal(this.route.paramMap.pipe(map((params) => Number(params.get('id')))));
  readonly idFromSnapshot = Number(this.route.snapshot.paramMap.get('id')); // figé à la création

  // lecture réactive : id change => la requête repart
  readonly product = this.products.oneResource(this.id);

  // mutation : Observable + exhaustMap => les clics pendant la requête sont ignorés
  protected readonly discount$ = new Subject<number>();

  constructor() {
    this.discount$
      .pipe(
        exhaustMap((price) => this.products.patch(this.id(), { price: Math.round(price * 90) / 100 })),
        takeUntilDestroyed(),
      )
      .subscribe((updated) => this.product.set(updated));
  }
}
