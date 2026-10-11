import { Component, input, output } from '@angular/core';
import { Formation } from '../models/formation';

@Component({
  selector: 'app-formation-card',
  template: `
    <article class="card">
      <h3>{{ formation().titre }}</h3>
      <p class="meta">{{ formation().ville }} · {{ formation().prixHT }} € HT</p>
      @if (formation().places > 0) {
        <span class="badge">{{ formation().places }} places</span>
      } @else {
        <span class="badge complet">complet</span>
      }
      <p>
        <button class="primary" (click)="onInscrire()" [disabled]="formation().places === 0">
          S'inscrire
        </button>
      </p>
    </article>
  `,
})
export class FormationCard {
  formation = input.required<Formation>();
  inscrire = output<number>();

  onInscrire() {
    this.inscrire.emit(this.formation().id);
  }
}
