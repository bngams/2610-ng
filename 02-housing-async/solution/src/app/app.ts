import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LoadingService } from './loading.service';

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
          <a routerLink="/s1" routerLinkActive="active">Recherche</a>
          <a routerLink="/s2/3" routerLinkActive="active">Détail</a>
          <a routerLink="/s4/3" routerLinkActive="active">Réserver</a>
          <a routerLink="/s5/3" routerLinkActive="active">Disponibilité</a>
          <a routerLink="/s6" routerLinkActive="active">Filtres</a>
        </nav>
      </header>
      @if (loadingService.pending() > 0) {
        <p class="loading">Loading…</p>
      }
      <section class="content">
        <router-outlet />
      </section>
    </main>
  `,
  styleUrl: './app.css',
})
export class App {
  title = 'homes';
  loadingService = inject(LoadingService);
}
