import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionButton, SessionStore } from '@shop/auth';
import { Header, MenuItem } from '@shop/ui';

@Component({
  imports: [RouterOutlet, Header, SessionButton],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly session = inject(SessionStore);

  protected readonly menu: MenuItem[] = [
    // la MÊME règle que le roleGuard('admin') de la route
    { title: 'Produits', path: '/', visible: () => this.session.hasRole('admin') },
  ];
}
