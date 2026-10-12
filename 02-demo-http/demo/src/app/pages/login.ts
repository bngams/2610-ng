import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  template: `
    <h1>Connexion</h1>
    <p>Vous arrivez ici parce que <code>errorInterceptor</code> a reçu un <strong>401</strong>
      et vous a redirigé. Dans une vraie application, c'est l'écran de connexion.</p>
    <p><a routerLink="/produits">Retour aux produits</a></p>
  `,
})
export class Login {}
