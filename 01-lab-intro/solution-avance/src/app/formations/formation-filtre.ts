import { Component, input, output } from '@angular/core';
import { Filtres, Niveau } from '../models/formation';

/** Barre de filtres. Émet un NOUVEL objet Filtres à chaque changement (voir A6). */
@Component({
  selector: 'app-formation-filtre',
  template: `
    <div class="toolbar">
      <label>Ville
        <select [value]="filtres().ville" (change)="changerVille($event)">
          <option value="">Toutes</option>
          @for (v of villes(); track v) {
            <option [value]="v">{{ v }}</option>
          }
        </select>
      </label>
      <label>Niveau
        <select [value]="filtres().niveau" (change)="changerNiveau($event)">
          <option value="">Tous</option>
          <option value="init">Initiation</option>
          <option value="avance">Avancé</option>
        </select>
      </label>
      <button (click)="reappliquer()">Ré-appliquer</button>
    </div>
  `,
})
export class FormationFiltre {
  villes = input.required<string[]>();
  filtres = input.required<Filtres>();
  filtresChange = output<Filtres>();

  changerVille(e: Event) {
    const ville = (e.target as HTMLSelectElement).value;
    this.filtresChange.emit({ ...this.filtres(), ville });
  }

  changerNiveau(e: Event) {
    const niveau = (e.target as HTMLSelectElement).value as Niveau | '';
    this.filtresChange.emit({ ...this.filtres(), niveau });
  }

  /** Émet les MÊMES valeurs dans un objet neuf : c'est le cas que A6 doit absorber. */
  reappliquer() {
    this.filtresChange.emit({ ...this.filtres() });
  }
}
