import { Component, inject, input } from '@angular/core';
import { HousingService } from '../../housing.service';

/**
 * S5 côté signals — contraintes :
 *  - tentative « signals seuls » : un effect + setInterval + onCleanup qui recharge un resource ;
 *  - constatez ce qu'il faut gérer à la main (nettoyage, requête en cours à l'arrêt) ;
 *  - puis le pont honnête : rxResource dont le stream est timer(0, 3000) => switchMap(http).
 */
@Component({
  selector: 'app-s5-signals',
  template: `<p class="todo">À vous de jouer : effect + setInterval, puis le pont rxResource (logement {{ locationId() }}).</p>`,
})
export class S5Signals {
  readonly locationId = input.required<number>();
  private readonly housingService = inject(HousingService);
}
