import { Component, computed, inject, input } from '@angular/core';
import { FormationService } from './formation.service';

/** A8 : composant chargé en @defer par la carte. */
@Component({
  selector: 'app-formation-avis',
  template: `
    <div class="avis">
      @for (a of avis(); track a.auteur) {
        <p><span class="note">{{ '★'.repeat(a.note) }}</span> {{ a.commentaire }} <em class="muted">— {{ a.auteur }}</em></p>
      } @empty {
        <p class="muted">Pas encore d'avis.</p>
      }
    </div>
  `,
})
export class FormationAvis {
  private service = inject(FormationService);
  formationId = input.required<number>();
  avis = computed(() => this.service.getAvis(this.formationId()));
}
