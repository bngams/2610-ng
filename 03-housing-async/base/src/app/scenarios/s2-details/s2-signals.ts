import { Component, inject, input } from '@angular/core';
import { HousingService } from '../../housing.service';

/**
 * S2-S3 côté signals — contraintes :
 *  - trois resources (httpResource ou rxResource) : location, reviews, agent ;
 *  - l'agent dépend du logement : ses params renvoient undefined tant que location n'a pas de valeur ;
 *  - un computed `ready` ;
 *  - S3 : un bloc @if (reviews.error()) avec un bouton qui appelle reviews.reload().
 */
@Component({
  selector: 'app-s2-signals',
  template: `<p class="todo">À vous de jouer : 3 resources + computed ready (logement {{ locationId() }}).</p>`,
})
export class S2Signals {
  readonly locationId = input.required<number>();
  private readonly housingService = inject(HousingService);
}
