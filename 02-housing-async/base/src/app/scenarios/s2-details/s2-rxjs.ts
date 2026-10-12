import { Component, inject, input } from '@angular/core';
import { HousingService } from '../../housing.service';

/**
 * S2-S3 côté RxJS — contraintes :
 *  - un seul flux `vm$` construit avec forkJoin({ location, reviews, agent }) ;
 *  - l'agent dépend du logement (location.agentId) : enchaînez avec switchMap à l'intérieur ;
 *  - S3 : catchError PAR FLUX (sur les avis) avant d'entrer dans forkJoin ; sans lui, tout tombe ;
 *  - un bouton « réessayer » ;
 *  - sortie via toSignal, un squelette tant que vm() est undefined.
 */
@Component({
  selector: 'app-s2-rxjs',
  template: `<p class="todo">À vous de jouer : forkJoin + catchError par flux (logement {{ locationId() }}).</p>`,
})
export class S2Rxjs {
  readonly locationId = input.required<number>();
  private readonly housingService = inject(HousingService);
}
