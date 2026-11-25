import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SessionStore } from '@shop/auth';
import { MatButtonModule } from '@shop/ui';
import { CartStore } from '../../services/cart.store';

@Component({
  imports: [CurrencyPipe, RouterLink, MatButtonModule],
  selector: 'app-checkout',
  styleUrl: './checkout.css',
  templateUrl: './checkout.html',
})
export class Checkout {
  protected readonly cart = inject(CartStore);
  private readonly session = inject(SessionStore);
  /** Le message affiché une fois la commande confirmée. */
  protected readonly confirmation = signal('');

  /** Commande simulée : pas d'API de commandes, un message puis un panier vide. */
  confirm(): void {
    // l'authGuard garantit qu'un utilisateur est connecté sur cette page
    const name = this.session.user()?.username;
    this.confirmation.set(
      `Merci ${name} ! Votre commande de ${this.cart.count()} article(s) est confirmée.`,
    );
    this.cart.clear();
  }
}
