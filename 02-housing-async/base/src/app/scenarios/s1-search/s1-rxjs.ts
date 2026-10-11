import { Component, inject } from '@angular/core';
import { HousingService } from '../../housing.service';

/**
 * S1 côté RxJS — contraintes :
 *  - un champ texte (FormControl + valueChanges, ou toObservable d'un signal) ;
 *  - debounceTime(300) puis distinctUntilChanged ;
 *  - switchMap(housingService.searchByCity) pour annuler la recherche précédente ;
 *  - un seul `toSignal` en sortie, aucun subscribe() manuel dans le composant.
 */
@Component({
  selector: 'app-s1-rxjs',
  template: `<p class="todo">À vous de jouer : recherche RxJS (debounceTime + switchMap + toSignal).</p>`,
})
export class S1Rxjs {
  private readonly housingService = inject(HousingService);
}
