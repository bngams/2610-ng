import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LocationsService } from '../../api/locations.service';
import { SortKey, applyFilters } from './filters';

/**
 * Les filtres côté signals : trois signals, un computed. Pas de startWith, pas de combineLatest, pas de
 * subscribe : la dérivation synchrone est le terrain naturel des signals.
 * (Le chargement initial reste asynchrone : toSignal fait le pont une fois pour toutes.)
 */
@Component({
  selector: 'app-s6-signals',
  template: `
    <input type="text" #c [value]="city()" (input)="city.set(c.value)" placeholder="Ville" />
    <input type="number" #p [value]="maxPrice()" (input)="maxPrice.set(p.valueAsNumber || 0)" step="100" />
    <select #s [value]="sort()" (change)="sort.set($any(s.value))">
      <option value="name">Tri : nom</option>
      <option value="price">Tri : prix</option>
    </select>
    <ul>
      @for (l of filtered(); track l.id) {
        <li>{{ l.name }} — {{ l.city }} — {{ l.price }} $</li>
      } @empty {
        <li class="status">Aucun résultat.</li>
      }
    </ul>
  `,
})
export class S6Signals {
  private readonly locationsService = inject(LocationsService);

  readonly list = toSignal(this.locationsService.list(), { initialValue: [] });
  readonly city = signal('');
  readonly maxPrice = signal(2000);
  readonly sort = signal<SortKey>('name');
  readonly filtered = computed(() => applyFilters(this.list(), this.city(), this.maxPrice(), this.sort()));
}
