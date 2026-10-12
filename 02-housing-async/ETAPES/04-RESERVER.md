# 🏁 S4 — Réserver : clics rapides

**Contexte.** Un bouton « Réserver » fait un `POST /bookings`, et l'utilisateur clique trois fois
très vite. Selon l'opérateur, il se passe trois choses différentes, et une seule est acceptable
pour un paiement.

Avec la latence par défaut, trois clics ne tombent pas toujours pendant la même requête. Pour que
« très vite » soit atteignable à la souris, **décommentez** la règle `/\/api\/bookings/` (1000 à
2000 ms) dans `chaos.config.ts`.

Voici ce que fait chacun des trois opérateurs face à ces trois clics :

| Opérateur | À chaque clic | Trois clics rapides = | Pour quoi |
|---|---|---|---|
| `switchMap` | on **abandonne** l'appel en cours et on relance | 1 réservation, 2 annulées (ou, en prod, 3 réservations côté serveur dont 2 inconnues du client) | une recherche, une navigation |
| `concatMap` | on **met en file**, dans l'ordre | 3 réservations, l'une après l'autre | une sauvegarde automatique, un journal |
| `exhaustMap` | on **ignore** tant que l'appel en cours n'est pas fini | 1 réservation, 2 clics ignorés | un paiement, une double soumission |

Pour la page, la route et le lien, refaites **le même geste que pour la recherche et la fiche
détail** (étapes 01 et 02) : comme pour la fiche, la page passe `[locationId]="id"` aux deux
volets. Les noms sont les suivants :

| Quoi | Nom |
|---|---|
| Dossier | `src/app/scenarios/s4-booking/` |
| Page | `s4-page.ts`, `S4Page`, `app-s4-page`, `<h1>S4 — Réserver : clics rapides</h1>` |
| Volets | `s4-rxjs.ts` (`S4Rxjs`, `app-s4-rxjs`) et `s4-signals.ts` (`S4Signals`, `app-s4-signals`) |
| Route | `{ path: 's4/:id', component: S4Page, title: 'S4 — Réserver : clics rapides' }` |
| Lien | `<a routerLink="/s4/3" routerLinkActive="active">S4 Réserver</a>` |

## Côté RxJS (donné)

Le volet RxJS écrit le **même** bouton trois fois, avec un `Subject` de clics par version et un
opérateur différent. Ici, le `subscribe()` est autorisé : c'est la première des deux exceptions
annoncées dans « Le format », car un clic est un **événement**, pas un état. Créez
`src/app/scenarios/s4-booking/s4-rxjs.ts` :

```ts
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
import { HousingService } from '../../housing.service';

type Strategy = 'switchMap' | 'concatMap' | 'exhaustMap';

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
  private readonly housingService = inject(HousingService);

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
  // this.locationId() à ce moment-là lève NG0950. D'où toObservable(this.locationId).
  readonly bookingsCount = toSignal(
    combineLatest([toObservable(this.locationId), this.refresh$.pipe(startWith(undefined))]).pipe(
      switchMap(([id]) => this.housingService.getBookings(id)),
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
    return this.housingService.book(this.locationId()).pipe(catchError(() => of(null)));
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
```

| Morceau | Pourquoi il est là |
|---|---|
| `Subject<void>` par stratégie | le bouton **pousse** un événement ; le `Subject` est la source du flux |
| `wire(strategy, flatten)` | le même pipeline trois fois, seul l'opérateur d'aplatissement change : c'est lui l'objet de l'expérience |
| `map(() => counter.update(...))` | compte le clic **avant** l'aplatissement, pour voir ceux qui seront ignorés ou annulés |
| `switchMap` / `concatMap` / `exhaustMap` | abandonner / mettre en file / ignorer, voir le tableau |
| `takeUntilDestroyed()` puis `subscribe` | la première exception à la règle : un événement, donc un `subscribe` ; `takeUntilDestroyed` coupe le flux à la destruction du composant (sans ça, les `Subject` survivent à la page) |
| `catchError(() => of(null))` dans `book()` | une réservation en erreur ne doit pas tuer le flux des clics suivants |
| `this.locationId()` dans `book()` | lu au **clic**, donc bien après la construction : pas de `NG0950` ici |
| `bookingsCount` : `combineLatest([toObservable(locationId), refresh$])` | le compteur côté serveur, relancé par « Compter » ; `toObservable(this.locationId)` parce que `startWith` émet à la construction (piège 3 de l'[étape bonus 09](09-BONUS.md)) |

## Côté signals (à vous)

Côté signals, il n'existe pas d'opérateur d'aplatissement : vous allez essayer deux façons de
réserver et comparer leur comportement aux trois opérateurs. Créez
`src/app/scenarios/s4-booking/s4-signals.ts`, avec deux versions côte à côte :

- **Version A, un `rxResource`** dont les `params` changent à chaque clic (un signal `clicksA`
  incrémenté par le bouton ; `params: () => this.clicksA() || undefined` pour rester `idle`
  avant le premier clic ; `stream: () => this.housingService.book(this.locationId())`). Affichez
  `bookingA.status()` et, si `hasValue()`, l'`id` de la dernière réservation. Observez son
  comportement sur trois clics rapides, puis relisez la doc de `resource` : *conçu pour des
  lectures, pas pour des opérations qui modifient des données* (« intended for read operations,
  not operations which perform mutations »).
- **Version B, une garde `pending`** : un signal booléen qui désactive le bouton (`[disabled]`)
  tant que la requête court ; la méthode `bookB()` incrémente `clicksB`, pose `pending`, appelle
  `book()` avec un `subscribe()` (la même exception que côté RxJS : une mutation est un événement) et
  remet `pending` à `false` dans `finalize`. Comptez `confirmedB`.

Et `concatMap` ? Cherchez l'équivalent : il n'y en a pas sans écrire une file à la main.

Dans le fichier ci-dessous, le template et les signals de la version B sont donnés ; à vous
d'écrire `bookingA` et le corps de `bookB()`.

🚧 **À compléter :**

```ts
import { Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { HousingService } from '../../housing.service';

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
  private readonly housingService = inject(HousingService);

  readonly clicksA = signal(0);
  // TODO A : bookingA = rxResource({ params: () => ..., stream: () => ... })

  readonly clicksB = signal(0);
  readonly confirmedB = signal(0);
  readonly pending = signal(false);

  bookB() {
    // TODO B : compter le clic ; si pending, sortir ; pending = true ; book(...).pipe(finalize(...)).subscribe(...)
  }
}
```

> 📖 [switchMap](https://rxjs.dev/api/operators/switchMap) ·
> [concatMap](https://rxjs.dev/api/operators/concatMap) ·
> [exhaustMap](https://rxjs.dev/api/operators/exhaustMap) ·
> [rxResource](https://angular.dev/api/core/rxjs-interop/rxResource) ·
> [takeUntilDestroyed](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed) ·
> [finalize](https://rxjs.dev/api/operators/finalize)

## Critère de réussite

Après trois clics rapides sur chaque bouton, le compteur et le log racontent l'histoire du
tableau du début. Une fois les trois lignes `+NNNms` du `concatMap` passées, « Compter »
(`GET /bookings?locationId=3`) confirme ce que le serveur a reçu.

Côté signals, la version A logue des `POST => annulée`, car un `resource` se comporte comme
`switchMap`. La version B ne compte même pas les clics 2 et 3, puisque le bouton est désactivé.

Vous savez maintenant dire **quel opérateur pour une recherche, un paiement, une sauvegarde
automatique**, et vous notez dans la grille que `resource` se comporte comme `switchMap`.

> 💡 **Tester :** sur une base fraîche (`bookings` vide dans le seed), trois clics sur chaque
> bouton RxJS, puis « Compter » :
>
> ```
> Réserver (switchMap)  clics : 3 — confirmées : 1
> Réserver (concatMap)  clics : 3 — confirmées : 3
> Réserver (exhaustMap) clics : 3 — confirmées : 1
> 5 réservation(s) en base
> ```
>
> et dans la console, pour `switchMap` : `POST /api/bookings => annulée` deux fois, puis
> `POST /api/bookings +1747ms`. Côté signals, trois clics sur A : au moins un `=> annulée` ; trois
> clics sur B : `clics : 1 — confirmées : 1`. Entre deux essais : `Ctrl-C` sur l'API,
> `npm run api:reset`, `npm run api`. Une fois la réservation terminée, vous pouvez remettre la
> règle `/\/api\/bookings/` en commentaire.

<details>
<summary>Ce qu'on retient</summary>

- Une mutation est un **événement**, pas un état dérivé : c'est le terrain de RxJS. Trois
  opérateurs, trois politiques, et seule `exhaustMap` convient à un paiement.
- Un `resource` **n'est pas un bouton** : ses params qui changent, c'est `switchMap`, avec les
  mêmes dégâts. La doc le dit.
- Côté signals, `exhaustMap` se réécrit à la main (une garde `pending` + `[disabled]`) ;
  `concatMap` n'a pas d'équivalent sans écrire une file.
</details>

---

➡️ [S5 — Disponibilité](05-DISPONIBILITE.md)
