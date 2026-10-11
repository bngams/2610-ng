import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
import { HousingLocationInfo } from '../../housinglocation';
import { HousingService } from '../../housing.service';
import { SortKey, applyFilters } from './filters';

/**
 * S6 côté RxJS : combineLatest attend que CHAQUE source ait émis une fois, d'où les startWith
 * (un valueChanges n'émet pas la valeur initiale). Puis map. Ça marche, mais tout ce qui est
 * synchrone ici (filtrer, trier) n'a pas besoin d'un flux : comparez avec le volet signals.
 */
@Component({
  selector: 'app-s6-rxjs',
  imports: [ReactiveFormsModule],
  template: `
    <input type="text" [formControl]="city" placeholder="Ville" />
    <input type="number" [formControl]="maxPrice" step="100" />
    <select [formControl]="sort">
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
export class S6Rxjs {
  private readonly housingService = inject(HousingService);

  readonly city = new FormControl('', { nonNullable: true });
  readonly maxPrice = new FormControl(2000, { nonNullable: true });
  readonly sort = new FormControl<SortKey>('name', { nonNullable: true });

  readonly filtered = toSignal(
    combineLatest([
      this.housingService.getAllHousingLocations(),
      this.city.valueChanges.pipe(startWith(this.city.value)),
      this.maxPrice.valueChanges.pipe(startWith(this.maxPrice.value)),
      this.sort.valueChanges.pipe(startWith(this.sort.value)),
    ]).pipe(map(([list, city, maxPrice, sort]) => applyFilters(list, city, maxPrice, sort))),
    { initialValue: [] as HousingLocationInfo[] },
  );
}
