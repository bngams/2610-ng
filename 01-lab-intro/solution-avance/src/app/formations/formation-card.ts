import { Component, computed, input, output } from '@angular/core';
import { Formation } from '../models/formation';
import { FormationAvis } from './formation-avis';

@Component({
  selector: 'app-formation-card',
  imports: [FormationAvis],
  host: { '[class.selected]': 'selected()' },
  template: `
    <article class="card" [class.selected]="selected()" (click)="selectionner.emit(formation().id)">
      <h3>{{ formation().titre }}</h3>
      <p class="meta">{{ formation().ville }} · {{ formation().prixHT }} € HT · {{ formation().dateDebut }}</p>

      <!-- A2 : computed à partir d'inputs -->
      @if (placesRestantes() > 0) {
        <span class="badge">{{ placesRestantes() }} place(s)</span>
      } @else {
        <span class="badge complet">complet</span>
      }

      <p>
        @if (inscrit()) {
          <button (click)="desinscrire.emit(formation().id); $event.stopPropagation()">Se désinscrire</button>
        } @else {
          <button class="primary" [disabled]="placesRestantes() === 0"
                  (click)="inscrire.emit(formation().id); $event.stopPropagation()">S'inscrire</button>
        }
      </p>

      <!-- A8 : les avis ne sont chargés (et leur code téléchargé) qu'à l'affichage de la carte -->
      @defer (on viewport) {
        <app-formation-avis [formationId]="formation().id" />
      } @placeholder {
        <p class="placeholder">Les avis s'affichent quand la carte est visible.</p>
      } @loading (minimum 300ms) {
        <p class="placeholder">Chargement des avis…</p>
      }
    </article>
  `,
})
export class FormationCard {
  formation = input.required<Formation>();
  inscrit = input(false);
  selected = input(false);

  inscrire = output<number>();
  desinscrire = output<number>();
  selectionner = output<number>();

  /** A2 : dérivé de deux inputs, recalculé seulement si l'un d'eux change. */
  placesRestantes = computed(() => this.formation().places - (this.inscrit() ? 1 : 0));
}
