import { Component, inject, input } from '@angular/core';
import { HousingService } from '../../housing.service';

/**
 * S5 côté RxJS — contraintes :
 *  - timer(0, 3000) ou interval(3000) => switchMap(housingService.getAvailability) ;
 *  - takeUntilDestroyed() pour arrêter à la destruction du composant ;
 *  - sortie via toSignal ; affichez aussi l'heure du dernier appel.
 */
@Component({
  selector: 'app-s5-rxjs',
  template: `<p class="todo">À vous de jouer : interval + switchMap + takeUntilDestroyed (logement {{ locationId() }}).</p>`,
})
export class S5Rxjs {
  readonly locationId = input.required<number>();
  private readonly housingService = inject(HousingService);
}
