# 💥 S3 — Détail : un appel sur trois échoue

**Contexte.** S3 se joue dans les deux composants de S2, sur la même page `/s2/:id` : il n'y a
pas de page S3. Dans `chaos.config.ts`, passez la règle `/\/api\/reviews/` à `errorRate: 0.5`
(la page se recharge toute seule). En production, un service d'avis en panne ne doit pas vider
la fiche logement : le logement et l'agent s'affichent, les avis montrent une erreur et un bouton
« réessayer ».

| Besoin | RxJS | Signals |
|---|---|---|
| Isoler l'erreur d'un flux | `catchError` **sur ce flux**, avant `forkJoin` : l'erreur devient une valeur | l'erreur est déjà locale : `reviews.error()` |
| Relancer seulement ce qui a échoué | il faut sortir le flux du `forkJoin` (ou tout recharger) | `reviews.reload()` |

## Côté RxJS (donné, déjà en place)

Relisez `load()` dans `s2-rxjs.ts` : c'est le `catchError` **par flux** sur `reviews$`, placé
**avant** d'entrer dans `forkJoin`, qui fait le travail. `forkJoin` a une règle brutale : si un
flux erre, **tout** erre, et il se désabonne des autres. Avec le `catchError` par flux, l'erreur
devient une valeur (`reviews: null, reviewsError: '503 …'`), `forkJoin` ne la voit jamais, et le
`catchError` global en bas de `load()` ne sert plus qu'aux vraies pannes.

| Morceau | Rôle |
|---|---|
| `withCatch` et la case à cocher | pour **voir** la différence sans éditer le code : décochée, `reviews$` entre nu dans `forkJoin` |
| `catchError` global, après `forkJoin` | sans le `catchError` par flux, c'est lui qui attrape : `fatal`, et tout l'écran tombe |
| « Réessayer (recharge tout) » | `reload$.next()` relance **tout** le `forkJoin` : en RxJS, le flux des avis vit à l'intérieur, on ne peut pas le relancer seul sans sortir du `forkJoin` (par exemple un `combineLatest` de trois flux indépendants). C'est la limite à noter dans la grille. |

## Côté signals (à vous)

Dans le bloc avis de `s2-signals.ts` : un `@else if (reviews.error())` avec le message et un
bouton « Réessayer (les avis seulement) » qui fait `(click)="reviews.reload()"`. Rien d'autre à
changer par rapport à S2 : c'est le point.

> 📖 [catchError](https://rxjs.dev/api/operators/catchError) ·
> [Resource : `error`, `reload`](https://angular.dev/guide/signals/resource)

## Critère de réussite

Logement et agent affichés, avis en erreur avec « réessayer » ; cliquer ne relance **que** les
avis (une seule ligne `reviews` dans le log, côté signals). Et sans `catchError` par flux côté
RxJS (case décochée) : « Tout a échoué », plus rien à l'écran. C'est pile ou face : basculez
RxJS / Signals pour rejouer le chargement jusqu'à tomber sur un 503.

> 💡 **Tester :** dans la console, vous devez voir :
>
> ```
> [chaos] GET /api/locations/3 +748ms
> [chaos] GET /api/reviews?locationId=3 => 503 (après 385 ms)
> [chaos] GET /api/agents/1 +1168ms
> ```
>
> puis, après « Réessayer (les avis seulement) » côté signals, une seule nouvelle ligne :
> `[chaos] GET /api/reviews?locationId=3 +1460ms` (ou un nouveau 503 : retentez). Côté RxJS, case
> décochée, après un 503 sur les avis :
>
> ```
> [chaos] GET /api/reviews?locationId=3 => 503 (après 1251 ms)
> [chaos] GET /api/agents/1 => annulée
> ```
>
> et l'écran dit `Tout a échoué : 503 Service Unavailable (chaos)`. La ligne `annulée` (sur
> `agents/1`, ou sur `locations/3` selon le tirage) est instructive : `forkJoin` ne s'est pas
> contenté d'échouer, il a **désabonné** l'appel encore en cours. Avant de passer à S4, remettez
> la règle `/\/api\/reviews/` à `errorRate: 0`.

<details>
<summary>Ce qu'on retient</summary>

- En RxJS, l'erreur **se propage** le long du flux : il faut la convertir en valeur **au bon
  endroit** (`catchError` par flux, avant le combinateur), sinon elle tue tout ce qui est en aval.
- En signals, l'erreur est **locale** à la resource : `error()` et `reload()` sont là sans rien
  écrire, et relancer un bloc ne touche pas les autres.
- Le « réessayer un seul appel » est la vraie différence : naturel en resources, coûteux en
  `forkJoin`.
</details>

---

➡️ [S4 — Réserver](04-RESERVER.md)
