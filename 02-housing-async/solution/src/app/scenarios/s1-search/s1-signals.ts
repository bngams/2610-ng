import { Component, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { httpResource } from '@angular/common/http';
import { debounceTime } from 'rxjs';
import { HousingLocationInfo } from '../../housinglocation';

/**
 * S1 côté signals : httpResource annule tout seul la requête précédente quand sa requête change
 * (il se désabonne, l'intercepteur chaos logue "annulée"). Mais il ne sait pas attendre : le
 * debounce est une notion de temps, elle passe par le pont RxJS.
 *
 * Pourquoi httpResource et pas resource + fetch ? fetch (même avec abortSignal) contourne
 * HttpClient, donc l'intercepteur chaos : vous ne verriez ni latence, ni annulation dans le log.
 */
@Component({
  selector: 'app-s1-signals',
  template: `
    <input type="text" #q [value]="query()" (input)="query.set(q.value)" placeholder="Ville (ex. Juneau)" />
    @if (results.isLoading()) {
      <span class="status">recherche…</span>
    }
    @if (results.error()) {
      <p class="error">Erreur : {{ results.error()?.message }}</p>
    } @else {
      <ul>
        @for (l of results.value(); track l.id) {
          <li>{{ l.name }} — {{ l.city }}, {{ l.state }}</li>
        } @empty {
          <li class="status">Aucun résultat.</li>
        }
      </ul>
    }
  `,
})
export class S1Signals {
  /** Ce que l'utilisateur tape, à chaque frappe. */
  readonly query = signal('');

  /** Le pont : signal -> observable (debounce) -> signal. C'est la seule ligne RxJS du composant.
   *  Pas de distinctUntilChanged : un signal ne notifie pas une valeur identique. */
  private readonly debouncedQuery = toSignal(
    toObservable(this.query).pipe(debounceTime(300)),
    { initialValue: '' },
  );

  /** La requête dérive du signal débouncé : chaque changement relance (et annule) la requête. */
  readonly results = httpResource<HousingLocationInfo[]>(
    () => ({ url: '/api/locations', params: { city_like: this.debouncedQuery() } }),
    { defaultValue: [] },
  );
}
