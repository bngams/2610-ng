import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatBadgeModule, MatButtonModule } from '@shop/ui';
import { CartStore } from '../../services/cart.store';

@Component({
  imports: [RouterLink, MatButtonModule, MatBadgeModule],
  selector: 'app-cart-badge',
  styleUrl: './cart-badge.css',
  templateUrl: './cart-badge.html',
})
export class CartBadge {
  // le badge LIT le store, il ne possède aucune donnée
  protected readonly cart = inject(CartStore);
}
