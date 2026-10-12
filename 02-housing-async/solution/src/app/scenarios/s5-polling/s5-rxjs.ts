import { Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, timer } from 'rxjs';
import { Availability } from '../../housinglocation';
import { AvailabilityService } from '../../api/availability.service';

/**
 * S5 côté RxJS : le temps est un flux comme un autre.
 *   timer(0, 3000) -> switchMap(http) -> takeUntilDestroyed()
 *
 * switchMap (et non mergeMap) : si l'appel précédent traîne plus de 3 s (chaos), on l'abandonne
 * plutôt que d'empiler. takeUntilDestroyed() coupe le tout à la destruction du composant :
 * quittez la page, le log chaos s'arrête. (Avec toSignal(...) à la place du subscribe, le
 * désabonnement serait inclus : même garantie, écrite autrement.)
 */
@Component({
  selector: 'app-s5-rxjs',
  template: `
    <p>
      Disponible :
      <strong>{{ availability()?.available === undefined ? '…' : availability()?.available ? 'oui' : 'non' }}</strong>
    </p>
    <p class="status">appels : {{ calls() }} — dernier : {{ lastCall() }}</p>
  `,
})
export class S5Rxjs {
  readonly locationId = input.required<number>();
  private readonly availabilityService = inject(AvailabilityService);

  readonly availability = signal<Availability | undefined>(undefined);
  readonly calls = signal(0);
  readonly lastCall = signal('');

  constructor() {
    toObservable(this.locationId)
      .pipe(
        switchMap((id) =>
          timer(0, 3000).pipe(
            switchMap(() =>
              this.availabilityService.get(id).pipe(catchError(() => EMPTY)),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((a) => {
        this.availability.set(a);
        this.calls.update((n) => n + 1);
        this.lastCall.set(new Date().toLocaleTimeString());
      });
  }
}
