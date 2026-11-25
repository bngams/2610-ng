import { Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule, MatCardModule } from '@shop/ui';
import { Product } from '../../models/product';

/**
 * Une carte produit, de présentation pure : elle reçoit un produit (input) et signale un clic
 * sur « Ajouter » (output). Elle ne connaît ni l'API, ni le panier.
 */
@Component({
  imports: [CurrencyPipe, MatCardModule, MatButtonModule],
  selector: 'lib-product-card',
  styleUrl: './product-card.css',
  templateUrl: './product-card.html',
})
export class ProductCard {
  readonly product = input.required<Product>();
  /** Affiche le bouton « Ajouter » ; false par défaut, par exemple dans le back-office. */
  readonly canAdd = input(false);
  /** Émis au clic sur « Ajouter », avec le produit de la carte. */
  readonly add = output<Product>();
}
