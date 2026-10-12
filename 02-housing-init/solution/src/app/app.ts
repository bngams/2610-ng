import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  template: `
    <main>
      <a [routerLink]="['/']">
        <header class="brand-name">
          <img class="brand-logo" src="/logo.svg" alt="logo" aria-hidden="true" />
        </header>
      </a>
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
