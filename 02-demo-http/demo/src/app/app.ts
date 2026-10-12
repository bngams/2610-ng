import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header>
      <strong>Démo HTTP</strong>
      <nav>
        <a routerLink="/produits" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Produits (RxJS)</a>
        <a routerLink="/produits-signals" routerLinkActive="active">Produits (httpResource)</a>
        <a routerLink="/bases" routerLinkActive="active">Bases HttpClient</a>
      </nav>
      <small>env : {{ envName }} · API : {{ apiUrl }}</small>
    </header>
    <main><router-outlet /></main>
  `,
})
export class App {
  protected readonly envName = environment.name;
  protected readonly apiUrl = environment.apiUrl;
}
