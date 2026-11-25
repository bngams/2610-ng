import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionButton, SessionStore } from '@shop/auth';
import { Header, MenuItem } from '@shop/ui';
import { CartBadge } from './features/cart/components/cart-badge/cart-badge';

@Component({
  imports: [RouterOutlet, Header, CartBadge, SessionButton],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly session = inject(SessionStore);

  protected readonly menu: MenuItem[] = [
    { title: 'Accueil', path: '/' },
    { title: 'Catalogue', path: '/catalog' },
    // la MÊME règle que l'authGuard de la route : isLoggedIn()
    { title: 'Commande', path: '/cart/checkout', visible: () => this.session.isLoggedIn() },
  ];
}
