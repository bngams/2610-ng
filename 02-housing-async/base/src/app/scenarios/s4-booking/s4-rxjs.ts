import { Component, inject, input } from '@angular/core';
import { HousingService } from '../../housing.service';

/**
 * S4 côté RxJS — contraintes :
 *  - trois boutons « Réserver », branchés sur le MÊME Subject de clics mais avec un opérateur
 *    différent : switchMap / concatMap / exhaustMap ;
 *  - chaque pipeline appelle housingService.book(locationId) ;
 *  - affichez pour chacun le nombre de réservations confirmées, et comparez avec db.json.
 */
@Component({
  selector: 'app-s4-rxjs',
  template: `<p class="todo">À vous de jouer : le même bouton en switchMap / concatMap / exhaustMap (logement {{ locationId() }}).</p>`,
})
export class S4Rxjs {
  readonly locationId = input.required<number>();
  private readonly housingService = inject(HousingService);
}
