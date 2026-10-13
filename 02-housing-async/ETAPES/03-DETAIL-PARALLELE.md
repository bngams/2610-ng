# 🧩 03 — Détail : trois appels en parallèle

**Contexte.** La fiche d'un logement (`/s2/:id`) a besoin de trois choses : le logement, ses
avis, et son agent. Le logement et les avis ne dépendent que de l'`id`, alors que l'agent dépend
du logement (`location.agentId`). Vous voulez tout lancer au plus tôt.

Pour cette étape, la règle `/\/api\/reviews/` de `chaos.config.ts` reste à `errorRate: 0`, la
valeur fournie. L'étape suivante, l'erreur partielle sur les avis, la passera à `0.5`.

Le tableau suivant met en regard les deux façons d'exprimer ces trois besoins :

| Besoin | RxJS | Signals |
|---|---|---|
| Lancer N appels et attendre les N réponses | `forkJoin({ a, b })` : émet une fois, quand tout est fini | N resources indépendantes, chacune avec son statut |
| Enchaîner un appel qui dépend d'un autre | `switchMap` à l'intérieur du flux concerné | une fonction de requête qui renvoie `undefined` tant que la dépendance n'a pas de valeur (la resource reste `idle`) |
| Savoir que « tout est là » | c'est le comportement par défaut de `forkJoin` | un `computed` sur les `hasValue()` |

Pour la page, la route et le lien, refaites **le même geste que pour la recherche** (étape 02),
avec les noms suivants :

| Quoi | Nom |
|---|---|
| Dossier | `src/app/scenarios/s2-details/` |
| Page | `s2-page.ts`, classe `S2Page`, sélecteur `app-s2-page` (la page sert aussi à l'étape suivante, d'où son titre), `<h1>Détail : trois appels en parallèle, un sur trois échoue</h1>` |
| Volets | `s2-rxjs.ts` (`S2Rxjs`, `app-s2-rxjs`) et `s2-signals.ts` (`S2Signals`, `app-s2-signals`) |
| Route | `{ path: 's2/:id', component: S2Page, title: 'Détail : trois appels en parallèle, un sur trois échoue' }` |
| Lien | `<a routerLink="/s2/3" routerLinkActive="active">Détail</a>` |

Il y a une différence avec la page de la recherche : la nouvelle page lit l'`id` de la route et le
**passe** aux deux volets, qui le reçoivent par `input.required`. Voici les lignes de `s2-page.ts`
qui changent par rapport à `s1-page.ts` ; le reste du fichier suit le même modèle, et le volet
signals reçoit `[locationId]="id"` de la même façon :

```ts
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// …
        <section class="pane rxjs"><h2>RxJS</h2><app-s2-rxjs [locationId]="id" /></section>
// …
export class S2Page {
  readonly mode = signal<Mode>('rxjs');
  readonly id = Number(inject(ActivatedRoute).snapshot.params['id']);
}
```

De l'autre côté, chaque volet déclare l'input qui reçoit cette valeur :
`readonly locationId = input.required<number>();`. C'est ce qui rend les volets réutilisables
sans routeur, et c'est aussi ce qui crée le piège `NG0950` décrit dans « Le format » du
[README](../README.md) : relisez-le avant de lire le code RxJS.

## Côté RxJS (donné)

Le volet RxJS lance le logement et les avis ensemble avec `forkJoin`, et va chercher l'agent dès
que le logement est là. Créez `src/app/scenarios/s2-details/s2-rxjs.ts`. Ce fichier contient déjà
ce qu'il faut pour l'étape suivante (la case à cocher `catchError par flux`, le bouton
« Réessayer ») : on y reviendra, pour l'instant lisez le `forkJoin`.

```ts
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
      // catchError PAR FLUX : l'erreur devient une valeur, forkJoin ne la voit jamais (l'erreur partielle).
      reviews: withCatch
        ? reviews$.pipe(catchError((err: unknown) => of({ reviews: null, reviewsError: describe(err) })))
        : reviews$,
    }).pipe(
      map(({ location, reviews }) => ({ ...location, ...reviews, fatal: null })),
      // Sans le catchError par flux, c'est celui-ci qui attrape : tout l'écran tombe (l'erreur partielle).
      catchError((err: unknown) =>
        of({ location: null, agent: null, reviews: null, reviewsError: null, fatal: describe(err) }),
      ),
    );
  }
}

function describe(err: unknown): string {
  return err instanceof HttpErrorResponse ? `${err.status} ${err.statusText}` : String(err);
}
```

Chaque morceau du fichier a sa raison d'être, détaillée dans ce tableau :

| Morceau | Pourquoi il est là, et à cet endroit |
|---|---|
| `toObservable(this.locationId)` en tête de flux | l'input requis n'est pas disponible à la construction ; `toObservable` n'émet qu'une fois qu'il l'est (piège `NG0950`) |
| `combineLatest([id, withCatch, reload$])` | trois déclencheurs de rechargement, un seul flux ; `reload$.pipe(startWith(undefined))` pour que `combineLatest` émette dès le départ |
| `switchMap(() => load().pipe(startWith(undefined)))` | un rechargement annule le précédent, et `startWith(undefined)` remet le squelette (`@if (!v)`) |
| `forkJoin({ location, reviews })` | lance les deux flux **en même temps**, attend que **tous** soient terminés, émet **une fois** : UX « squelette, puis tout d'un coup » |
| `switchMap` à l'intérieur de `location` | l'agent dépend du logement : la dépendance est exprimée **dans** le flux concerné, `forkJoin` n'y voit qu'un flux |
| `@let v = vm()` | une lecture du signal pour tout le template (sinon `vm()` à chaque ligne) |
| `toSignal` sans `initialValue` | `undefined` = « pas encore chargé » : c'est le squelette |

## Côté signals (à vous)

Côté signals, il n'y a plus de combinateur : chaque appel devient une resource indépendante.
Créez `src/app/scenarios/s2-details/s2-signals.ts`, en respectant ces contraintes :

- trois `httpResource`, `location`, `reviews` et `agent` ;
- la fonction de requête de `agent` lit `location` (via `hasValue()`, jamais `value()` à sec) et
  renvoie `undefined` tant que le logement n'est pas là ;
- un `computed` `ready`, vrai quand les trois ont une valeur ;
- dans le template, un bloc par resource, qui gère son propre `isLoading()` / `error()` /
  `hasValue()`.

Le fichier ci-dessous vous donne le bloc du logement pour montrer la forme ; les blocs de l'agent
et des avis sont à écrire sur le même modèle, ainsi que les quatre déclarations de la classe.

🚧 **À compléter :**

```ts
import { Component, computed, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Agent, HousingLocationInfo, Review } from '../../housinglocation';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-s2-signals',
  template: `
    <p class="status">ready() = {{ ready() }}</p>

    @if (location.isLoading()) {
      <div class="skeleton"></div>
    } @else if (location.error()) {
      <p class="error">Logement : {{ location.error()?.message }}</p>
      <button type="button" (click)="location.reload()">Réessayer</button>
    } @else if (location.hasValue()) {
      <h3>{{ location.value().name }}</h3>
      <p>{{ location.value().city }}, {{ location.value().state }} — {{ location.value().price }} $/mois</p>
    }

    <!-- TODO : le bloc agent (name, agency), puis le bloc avis (@for sur reviews.value()) -->
  `,
})
export class S2Signals {
  readonly locationId = input.required<number>();

  // TODO : location = httpResource<HousingLocationInfo>(() => `${environment.apiUrl}/locations/${...}`)
  // TODO : reviews  = httpResource<Review[]>(() => ({ url: `${environment.apiUrl}/reviews`, params: { locationId: ... } }))
  // TODO : agent    = httpResource<Agent>(() => ... ? `${environment.apiUrl}/agents/${...agentId}` : undefined)
  // TODO : ready    = computed(() => ... && ... && ...)
}
```

Quelques indices. La fonction de requête est un contexte réactif : lire `this.locationId()`
dedans est sûr, contrairement à `toSignal` + `startWith`. Quand elle renvoie `undefined`, la
resource reste `idle` et aucune requête ne part. Dès que `location` se résout, la fonction de
`agent` est réévaluée et la requête part : c'est le `switchMap` de RxJS, exprimé en dérivation.

> 📖 [forkJoin](https://rxjs.dev/api/index/function/forkJoin) ·
> [resource : params, loader, statuts](https://angular.dev/guide/signals/resource) ·
> [httpResource](https://angular.dev/guide/http/http-resource) ·
> [computed](https://angular.dev/guide/signals)

## Critère de réussite

Côté RxJS : un squelette, puis **tout d'un coup**. Côté signals : le logement apparaît, puis
l'agent, puis les avis (ou dans un autre ordre selon le chaos), et `ready()` passe à `true` à la
fin. **Les deux UX sont valables** : le « tout ou rien » rassure sur une page de paiement, le
« bloc par bloc » est plus réactif sur une fiche. Notez dans la grille laquelle vous choisiriez,
et pourquoi.

> 💡 **Tester :** `/s2/3`, dans la console, trois lignes `+NNNms` par volet :
>
> ```
> [chaos] GET /api/locations/3 +418ms
> [chaos] GET /api/reviews?locationId=3 +1097ms
> [chaos] GET /api/agents/1 +883ms
> ```
>
> Dans les deux versions, les avis partent en même temps que le logement (les deux premières
> lignes peuvent s'inverser), et `agents/1` part toujours **après** `locations/3`.

<details>
<summary>Ce qu'on retient</summary>

- `forkJoin` = **une** émission quand tout est fini : squelette puis tout. N resources = N
  statuts indépendants : bloc par bloc, et `computed` si vous voulez retrouver le « tout est là ».
- La **dépendance** (agent après logement) s'écrit `switchMap` dans le flux concerné en RxJS, et
  `undefined` tant que la dépendance n'a pas de valeur en signals.
- Côté signals, aucun pont : la sortie est déjà un signal. Le prix à payer : trois URL dupliquées
  depuis le service (`rxResource` les éviterait, au prix d'un peu de plomberie ; l'étape 09 les
  range dans le service, avec `getResource` et `listResource`).
</details>

---

➡️ [04 — Détail : un appel sur trois échoue](04-DETAIL-ERREUR.md)
