import { Component, inject } from '@angular/core';
import { HousingService } from '../../housing.service';

/**
 * S1 côté signals — contraintes :
 *  - un signal `query` alimenté par (input) ;
 *  - un `httpResource` (ou `rxResource`) dont les params dérivent de la requête ;
 *  - le debounce n'existe pas côté resource : il passe par le pont
 *    toSignal(toObservable(query).pipe(debounceTime(300))) qui alimente les params ;
 *  - afficher isLoading() et value().
 */
@Component({
  selector: 'app-s1-signals',
  template: `<p class="todo">À vous de jouer : recherche signals (httpResource + pont pour le debounce).</p>`,
})
export class S1Signals {
  private readonly housingService = inject(HousingService);
}
