import { Component, inject } from '@angular/core';
import { FormationCard } from './formation-card';
import { FormationService } from './formation.service';

@Component({
  selector: 'app-formation-list',
  imports: [FormationCard],
  template: `
    <!-- TODO (A1) : le panier d'inscription -->

    <h2>Formations</h2>
    <div class="cards">
      @for (f of formations; track f.id) {
        <app-formation-card [formation]="f" (inscrire)="onInscrire($event)" />
      } @empty {
        <p class="muted">Aucune formation.</p>
      }
    </div>
  `,
})
export class FormationList {
  private service = inject(FormationService);

  // Point de départ du parcours Avancé : la liste, la carte et le service sont là.
  // Rien n'est encore réactif : c'est l'objet des étapes A1 à A8.
  formations = this.service.getAll();

  onInscrire(id: number) {
    console.log('inscription demandée pour la formation', id);
  }
}
