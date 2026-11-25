import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { SessionStore } from '@shop/auth';

/** La promo du moment, exposée par Native Federation : le FO et le BO la chargent à l'exécution. */
@Component({
  imports: [MatCardModule],
  selector: 'app-promo-banner',
  styleUrl: './promo-banner.css',
  templateUrl: './promo-banner.html',
})
export class PromoBanner {
  // partagée en singleton : c'est la session de l'application hôte
  protected readonly session = inject(SessionStore);
}
