import { Component, inject, input } from '@angular/core';
import { HousingService } from '../../housing.service';

/**
 * S4 côté signals — contraintes :
 *  - version A : un resource (rxResource) dont les params changent à chaque clic : observez qu'il
 *    se comporte comme switchMap (et relisez la doc de resource : « intended for read operations ») ;
 *  - version B : un bouton gardé par isLoading() / un signal `pending`, équivalent d'exhaustMap ;
 *  - concluez : quel équivalent pour concatMap ?
 */
@Component({
  selector: 'app-s4-signals',
  template: `<p class="todo">À vous de jouer : resource ≈ switchMap, garde isLoading() ≈ exhaustMap (logement {{ locationId() }}).</p>`,
})
export class S4Signals {
  readonly locationId = input.required<number>();
  private readonly housingService = inject(HousingService);
}
