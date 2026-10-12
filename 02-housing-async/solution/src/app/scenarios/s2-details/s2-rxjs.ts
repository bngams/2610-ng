import { Component, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  Subject,
  catchError,
  combineLatest,
  forkJoin,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { Agent, HousingLocationInfo, Review } from '../../housinglocation';
import { HousingService } from '../../housing.service';

interface Vm {
  location: HousingLocationInfo | null;
  agent: Agent | null;
  reviews: Review[] | null;
  reviewsError: string | null;
  fatal: string | null;
}

/**
 * S2 côté RxJS : forkJoin attend que TOUS les flux soient terminés, puis émet une seule fois.
 * UX : un squelette, puis tout d'un coup.
 *
 * S3 : forkJoin a une règle brutale : si UN flux erre, tout erre. D'où le catchError PAR FLUX,
 * placé sur les avis AVANT d'entrer dans forkJoin : l'erreur devient une valeur (reviews: null)
 * et les autres blocs s'affichent. Décochez la case pour voir ce qui se passe sans.
 *
 * Réessayer : en RxJS, le flux "avis" vit à l'intérieur du forkJoin ; pour ne recharger que
 * lui, il faudrait le sortir et combiner autrement (combineLatest de trois flux indépendants).
 * Ici, le bouton relance tout le chargement : c'est la limite à noter dans la grille.
 */
@Component({
  selector: 'app-s2-rxjs',
  template: `
    <label>
      <input type="checkbox" [checked]="withCatch()" (change)="withCatch.set(!withCatch())" />
      catchError par flux (décochez pour voir tout tomber)
    </label>
    @let v = vm();
    @if (!v) {
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton"></div>
    } @else if (v.fatal) {
      <p class="error">Tout a échoué : {{ v.fatal }}</p>
      <button type="button" (click)="reload$.next()">Recharger</button>
    } @else {
      <h3>{{ v.location?.name }}</h3>
      <p>{{ v.location?.city }}, {{ v.location?.state }} — {{ v.location?.price }} $/mois</p>
      <p>Agent : {{ v.agent?.name }} ({{ v.agent?.agency }})</p>
      @if (v.reviews) {
        <ul>
          @for (r of v.reviews; track r.id) {
            <li>{{ r.rating }}/5 — {{ r.author }} : {{ r.text }}</li>
          }
        </ul>
      } @else {
        <p class="error">Avis indisponibles ({{ v.reviewsError }})</p>
        <button type="button" (click)="reload$.next()">Réessayer (recharge tout)</button>
      }
    }
  `,
})
export class S2Rxjs {
  readonly locationId = input.required<number>();
  readonly withCatch = signal(true);
  readonly reload$ = new Subject<void>();

  private readonly housingService = inject(HousingService);

  readonly vm = toSignal(
    combineLatest([
      toObservable(this.locationId),
      toObservable(this.withCatch),
      this.reload$.pipe(startWith(undefined)),
    ]).pipe(
      // startWith(undefined) : on repasse par le squelette à chaque rechargement.
      switchMap(([id, withCatch]) => this.load(id, withCatch).pipe(startWith(undefined))),
    ),
  );

  private load(id: number, withCatch: boolean): Observable<Vm> {
    const reviews$ = this.housingService.getReviews(id).pipe(
      map((reviews) => ({ reviews, reviewsError: null as string | null })),
    );

    return forkJoin({
      // L'agent dépend du logement : switchMap à l'intérieur, forkJoin n'en sait rien.
      location: this.housingService.getHousingLocationById(id).pipe(
        switchMap((location) =>
          this.housingService.getAgent(location.agentId).pipe(map((agent) => ({ location, agent }))),
        ),
      ),
      // catchError PAR FLUX : l'erreur devient une valeur, forkJoin ne la voit jamais.
      reviews: withCatch
        ? reviews$.pipe(catchError((err: unknown) => of({ reviews: null, reviewsError: describe(err) })))
        : reviews$,
    }).pipe(
      map(({ location, reviews }) => ({ ...location, ...reviews, fatal: null })),
      // Sans le catchError par flux, c'est celui-ci qui attrape : tout l'écran tombe.
      catchError((err: unknown) =>
        of({ location: null, agent: null, reviews: null, reviewsError: null, fatal: describe(err) }),
      ),
    );
  }
}

function describe(err: unknown): string {
  return err instanceof HttpErrorResponse ? `${err.status} ${err.statusText}` : String(err);
}
