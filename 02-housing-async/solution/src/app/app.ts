import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <main>
      <header class="brand-name">
        <a [routerLink]="['/']">
          <img class="brand-logo" src="/logo.svg" alt="logo" aria-hidden="true" />
        </a>
        <nav class="scenarios">
          <a routerLink="/s1" routerLinkActive="active">S1 Recherche</a>
          <a routerLink="/s2/3" routerLinkActive="active">S2-S3 Détail</a>
          <a routerLink="/s4/3" routerLinkActive="active">S4 Réserver</a>
          <a routerLink="/s5/3" routerLinkActive="active">S5 Disponibilité</a>
          <a routerLink="/s6" routerLinkActive="active">S6 Filtres</a>
        </nav>
      </header>
      <section class="content">
        <router-outlet />
      </section>
    </main>
  `,
  styleUrl: './app.css',
})
export class App {
  title = 'homes';
}
