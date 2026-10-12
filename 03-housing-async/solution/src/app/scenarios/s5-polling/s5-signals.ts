import { Component, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, timer } from 'rxjs';
import { HousingService } from '../../housing.service';

/**
 * S5 côté signals, version A : « signals seuls ».
 *
 * Un resource sait charger une fois ; pour recharger toutes les 3 s il faut un setInterval,
 * et pour l'arrêter, un onCleanup dans un effect. Ça marche, mais :
 *  - l'effect ne lit aucun signal : il ne sert que de crochet de destruction déguisé ;
 *  - rien ne se compose : pas de pause, pas de backoff, pas de "dernier gagne" entre deux
 *    rechargements (reload() pendant un chargement en cours est simplement ignoré) ;
 *  - le nettoyage est manuel : oubliez clearInterval et le polling survit à la page.
 */
@Component({
  selector: 'app-s5-signals-effect',
  template: `
    <p>
      Disponible :
      <strong>{{ availability.hasValue() ? (availability.value().available ? 'oui' : 'non') : '…' }}</strong>
    </p>
    <p class="status">ticks : {{ ticks() }} — statut : {{ availability.status() }}</p>
  `,
})
export class S5SignalsEffect {
  readonly locationId = input.required<number>();
  private readonly housingService = inject(HousingService);

  readonly ticks = signal(0);
  readonly availability = rxResource({
    params: () => this.locationId(),
    stream: ({ params }) => this.housingService.getAvailability(params),
  });

  constructor() {
    effect((onCleanup) => {
      const handle = setInterval(() => {
        this.ticks.update((n) => n + 1);
        this.availability.reload();
      }, 3000);
      onCleanup(() => clearInterval(handle));
    });
  }
}

/**
 * S5 côté signals, version B : le pont. Le temps reste RxJS (timer + switchMap), la resource
 * ne fait que consommer le flux : à la destruction, rxResource se désabonne, le polling cesse.
 * C'est la version à retenir : « signals pour l'état, RxJS pour le temps, le pont dans le composant ».
 */
@Component({
  selector: 'app-s5-signals-stream',
  template: `
    <p>
      Disponible :
      <strong>{{ availability.hasValue() ? (availability.value().available ? 'oui' : 'non') : '…' }}</strong>
    </p>
    <p class="status">statut : {{ availability.status() }} — dernier : {{ availability.value()?.updatedAt }}</p>
  `,
})
export class S5SignalsStream {
  readonly locationId = input.required<number>();
  private readonly housingService = inject(HousingService);

  readonly availability = rxResource({
    params: () => this.locationId(),
    stream: ({ params }) =>
      timer(0, 3000).pipe(
        switchMap(() => this.housingService.getAvailability(params).pipe(catchError(() => EMPTY))),
      ),
  });
}

@Component({
  selector: 'app-s5-signals',
  imports: [S5SignalsEffect, S5SignalsStream],
  template: `
    <p>
      <label><input type="radio" name="s5v" [checked]="version() === 'A'" (change)="version.set('A')" /> A : effect + setInterval</label>
      <label><input type="radio" name="s5v" [checked]="version() === 'B'" (change)="version.set('B')" /> B : rxResource + timer (le pont)</label>
    </p>
    @if (version() === 'A') {
      <app-s5-signals-effect [locationId]="locationId()" />
    } @else {
      <app-s5-signals-stream [locationId]="locationId()" />
    }
  `,
})
export class S5Signals {
  readonly locationId = input.required<number>();
  readonly version = signal<'A' | 'B'>('A');
}
