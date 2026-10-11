import { Component, computed, inject, signal } from '@angular/core';
import { FormationCard } from './formation-card';
import { FormationService } from './formation.service';

@Component({
  selector: 'app-formation-list',
  imports: [FormationCard],
  template: `
    <section class="panier">
      <span>Panier : <strong>{{ panier().length }}</strong> inscription(s)</span>
      <span>Total : <strong>{{ total() }} € HT</strong></span>
    </section>

    <h2>Formations</h2>
    <div class="cards">
      @for (f of formations; track f.id) {
        <app-formation-card [formation]="f" (inscrire)="ajouterAuPanier($event)" />
      } @empty {
        <p class="muted">Aucune formation.</p>
      }
    </div>
  `,
})
export class FormationList {
  private service = inject(FormationService);

  formations = this.service.getAll();

  // I4 : état réactif
  panier = signal<number[]>([]);
  total = computed(() =>
    this.panier()
      .map(id => this.formations.find(f => f.id === id)?.prixHT ?? 0)
      .reduce((somme, prix) => somme + prix, 0),
  );

  ajouterAuPanier(id: number) {
    this.panier.update(ids => [...ids, id]);
  }
}
