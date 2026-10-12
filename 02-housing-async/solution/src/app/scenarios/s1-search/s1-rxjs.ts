import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, of, startWith, switchMap, tap } from 'rxjs';
import { HousingLocationInfo } from '../../housinglocation';
import { LocationsService } from '../../api/locations.service';

/**
 * S1 côté RxJS : le temps (debounceTime) et l'annulation (switchMap) sont des opérateurs.
 * Le composant ne contient aucun subscribe() : toSignal s'abonne, et se désabonne à la destruction.
 */
@Component({
  selector: 'app-s1-rxjs',
  imports: [ReactiveFormsModule],
  template: `
    <input type="text" [formControl]="city" placeholder="Ville (ex. Juneau)" />
    @if (searching()) {
      <span class="status">recherche…</span>
    }
    <ul>
      @for (l of results(); track l.id) {
        <li>{{ l.name }} — {{ l.city }}, {{ l.state }}</li>
      } @empty {
        <li class="status">Aucun résultat.</li>
      }
    </ul>
  `,
})
export class S1Rxjs {
  private readonly locationsService = inject(LocationsService);

  readonly city = new FormControl('', { nonNullable: true });
  readonly searching = signal(false);

  readonly results = toSignal(
    this.city.valueChanges.pipe(
      startWith(this.city.value),
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.searching.set(true)),
      // switchMap : une nouvelle valeur désabonne la requête précédente -> "annulée" dans le log chaos.
      switchMap((q) =>
        this.locationsService.searchByCity(q).pipe(
          catchError(() => of([] as HousingLocationInfo[])),
          tap(() => this.searching.set(false)),
        ),
      ),
    ),
    { initialValue: [] as HousingLocationInfo[] },
  );
}
