import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@shop/ui';
import { CartStore } from '../../services/cart.store';

@Component({
  imports: [CurrencyPipe, RouterLink, MatButtonModule],
  selector: 'app-cart',
  styleUrl: './cart.css',
  templateUrl: './cart.html',
})
export class Cart {
  protected readonly cart = inject(CartStore);
}
