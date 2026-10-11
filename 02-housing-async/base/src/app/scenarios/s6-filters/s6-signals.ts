import { Component, inject } from '@angular/core';
import { HousingService } from '../../housing.service';

/**
 * S6 côté signals — contraintes :
 *  - la liste est chargée une fois (toSignal ou httpResource) ;
 *  - trois signals (city, maxPrice, sort) ; un seul computed pour le résultat.
 */
@Component({
  selector: 'app-s6-signals',
  template: `<p class="todo">À vous de jouer : 3 signals + 1 computed.</p>`,
})
export class S6Signals {
  private readonly housingService = inject(HousingService);
}
