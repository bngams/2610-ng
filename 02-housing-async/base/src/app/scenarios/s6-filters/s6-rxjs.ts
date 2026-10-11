import { Component, inject } from '@angular/core';
import { HousingService } from '../../housing.service';

/**
 * S6 côté RxJS — contraintes :
 *  - la liste est chargée une fois (getAllHousingLocations) ;
 *  - trois FormControl (city, maxPrice, sort) ; combineLatest de leurs valueChanges (startWith !) ;
 *  - map pour filtrer et trier ; toSignal en sortie.
 */
@Component({
  selector: 'app-s6-rxjs',
  template: `<p class="todo">À vous de jouer : combineLatest + map.</p>`,
})
export class S6Rxjs {
  private readonly housingService = inject(HousingService);
}
