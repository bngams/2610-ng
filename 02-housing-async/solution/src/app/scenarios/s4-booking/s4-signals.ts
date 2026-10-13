import { Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { BookingsService } from '../../api/bookings.service';

/**
 * La réservation côté signals.
 *
 * Version A : un resource dont les params changent à chaque clic. Quand les params changent,
 * le resource ANNULE la requête en cours et relance : c'est switchMap, avec les mêmes dégâts.
 * La doc le dit : « resource is intended for read operations, not operations which perform
 * mutations ». Un resource n'est pas un bouton.
 *
 * Version B : une mutation, c'est un événement, pas un état dérivé. On revient à l'impératif :
 * un signal `pending` qui désactive le bouton tant que la requête court. C'est l'équivalent
 * d'exhaustMap, écrit à la main.
 *
 * concatMap (mettre en file, ne rien perdre, garder l'ordre) n'a pas d'équivalent signals : il
 * faudrait gérer soi-même une file d'attente. C'est RxJS, et c'est tout.
 */
@Component({
  selector: 'app-s4-signals',
  template: `
    <p>
      <button type="button" (click)="clicksA.update((n) => n + 1)">Réserver (A : resource)</button>
      clics : {{ clicksA() }} — statut : {{ bookingA.status() }}
      @if (bookingA.hasValue()) {
        — dernière confirmée : #{{ bookingA.value()?.id }}
      }
    </p>
    <p>
      <button type="button" [disabled]="pending()" (click)="bookB()">
        {{ pending() ? 'Réservation en cours…' : 'Réserver (B : garde pending)' }}
      </button>
      clics : {{ clicksB() }} — confirmées : {{ confirmedB() }}
    </p>
  `,
})
export class S4Signals {
  readonly locationId = input.required<number>();
  private readonly bookingsService = inject(BookingsService);

  // --- Version A : resource ≈ switchMap --------------------------------------------------------
  readonly clicksA = signal(0);
  readonly bookingA = rxResource({
    // undefined au départ : le resource reste idle tant qu'on n'a pas cliqué.
    params: () => this.clicksA() || undefined,
    stream: () => this.bookingsService.book(this.locationId()),
  });

  // --- Version B : garde manuelle ≈ exhaustMap -------------------------------------------------
  readonly clicksB = signal(0);
  readonly confirmedB = signal(0);
  readonly pending = signal(false);

  bookB() {
    this.clicksB.update((n) => n + 1);
    if (this.pending()) {
      return; // le bouton est déjà disabled, la garde est une ceinture en plus des bretelles
    }
    this.pending.set(true);
    this.bookingsService
      .book(this.locationId())
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({ next: () => this.confirmedB.update((n) => n + 1), error: () => {} });
  }
}
