import { Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  Observable,
  OperatorFunction,
  Subject,
  catchError,
  combineLatest,
  concatMap,
  exhaustMap,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { Booking } from '../../housinglocation';
import { BookingsService } from '../../api/bookings.service';

type Strategy = 'switchMap' | 'concatMap' | 'exhaustMap';

/**
 * S4 côté RxJS : le MÊME bouton, trois opérateurs d'aplatissement, trois comportements.
 *
 *  - switchMap  : chaque clic ANNULE la réservation précédente si elle n'est pas finie.
 *                 Avec le chaos (délai avant envoi), les clics 1 et 2 n'atteignent jamais le
 *                 serveur ; en prod (délai réseau après envoi), le serveur les aurait traités
 *                 mais le client n'en saurait rien. Faux dans les deux cas pour un paiement.
 *  - concatMap  : chaque clic est mis en FILE, rien n'est perdu, tout part dans l'ordre.
 *                 Trois clics = trois réservations (voulu pour une sauvegarde automatique, pas pour un paiement).
 *  - exhaustMap : tant qu'une réservation est en cours, les clics sont IGNORÉS.
 *                 Trois clics = une réservation. C'est l'opérateur du paiement, de la double soumission.
 */
@Component({
  selector: 'app-s4-rxjs',
  template: `
    @for (s of strategies; track s) {
      <p>
        <button type="button" (click)="clicks[s].next()">Réserver ({{ s }})</button>
        clics : {{ counts[s]().clicks }} — confirmées : {{ counts[s]().confirmed }}
      </p>
    }
    <p>
      <button type="button" (click)="refresh$.next()">Compter dans /bookings</button>
      <span class="status">{{ bookingsCount() === null ? '…' : bookingsCount() + ' réservation(s) en base' }}</span>
    </p>
  `,
})
export class S4Rxjs {
  readonly locationId = input.required<number>();
  private readonly bookingsService = inject(BookingsService);

  readonly strategies: Strategy[] = ['switchMap', 'concatMap', 'exhaustMap'];
  readonly clicks: Record<Strategy, Subject<void>> = {
    switchMap: new Subject<void>(),
    concatMap: new Subject<void>(),
    exhaustMap: new Subject<void>(),
  };
  readonly counts = {
    switchMap: signal({ clicks: 0, confirmed: 0 }),
    concatMap: signal({ clicks: 0, confirmed: 0 }),
    exhaustMap: signal({ clicks: 0, confirmed: 0 }),
  };

  readonly refresh$ = new Subject<void>();
  // Piège évité : toSignal s'abonne tout de suite, et startWith émet tout de suite. Lire
  // this.locationId() à ce moment-là lève NG0950 (input requis pas encore renseigné). D'où
  // toObservable(this.locationId), qui n'émet qu'une fois l'input disponible.
  readonly bookingsCount = toSignal(
    combineLatest([toObservable(this.locationId), this.refresh$.pipe(startWith(undefined))]).pipe(
      switchMap(([id]) => this.bookingsService.list({ locationId: id })),
      map((list): number | null => list.length),
    ),
    { initialValue: null },
  );

  constructor() {
    this.wire('switchMap', switchMap((_: void) => this.book()));
    this.wire('concatMap', concatMap((_: void) => this.book()));
    this.wire('exhaustMap', exhaustMap((_: void) => this.book()));
  }

  private book(): Observable<Booking | null> {
    return this.bookingsService.book(this.locationId()).pipe(catchError(() => of(null)));
  }

  private wire(strategy: Strategy, flatten: OperatorFunction<void, Booking | null>) {
    const counter = this.counts[strategy];
    this.clicks[strategy]
      .pipe(
        map(() => counter.update((c) => ({ ...c, clicks: c.clicks + 1 }))),
        flatten,
        takeUntilDestroyed(),
      )
      .subscribe((booking) => {
        if (booking) {
          counter.update((c) => ({ ...c, confirmed: c.confirmed + 1 }));
        }
      });
  }
}
