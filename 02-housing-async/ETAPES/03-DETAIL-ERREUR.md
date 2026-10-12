# 💥 S3 — Détail : un appel sur trois échoue

**Contexte.** Cette étape se joue dans les deux composants de la fiche détail (étape 02), sur la
même page `/s2/:id` : elle n'a pas de page à elle. En production, un service d'avis en panne ne
doit pas vider la fiche logement. Le logement et l'agent s'affichent, et seuls les avis montrent
une erreur et un bouton « réessayer ».

Pour provoquer cette panne, ouvrez `chaos.config.ts` et passez la règle `/\/api\/reviews/` à
`errorRate: 0.5` ; la page se recharge toute seule. Une fois sur deux, les avis répondent
désormais par un 503.

Les deux approches traitent cette erreur partielle très différemment :

| Besoin | RxJS | Signals |
|---|---|---|
| Isoler l'erreur d'un flux | `catchError` **sur ce flux**, avant `forkJoin` : l'erreur devient une valeur | l'erreur est déjà locale : `reviews.error()` |
| Relancer seulement ce qui a échoué | il faut sortir le flux du `forkJoin` (ou tout recharger) | `reviews.reload()` |

## Côté RxJS (donné, déjà en place)

Le volet RxJS n'a rien de nouveau à écrire : vous l'avez créé à l'étape précédente avec ce qu'il
faut. Relisez `load()` dans `s2-rxjs.ts` : c'est le `catchError` **par flux** sur `reviews$`,
placé **avant** d'entrer dans `forkJoin`, qui fait le travail.

`forkJoin` a une règle brutale : si un flux erre, **tout** erre, et il se désabonne des autres.
Avec le `catchError` par flux, l'erreur devient une valeur (`reviews: null, reviewsError: '503 …'`),
`forkJoin` ne la voit jamais, et le `catchError` global en bas de `load()` ne sert plus qu'aux
vraies pannes.

Trois morceaux du fichier, laissés de côté à l'étape précédente, servent ici :

| Morceau | Rôle |
|---|---|
| `withCatch` et la case à cocher | pour **voir** la différence sans éditer le code : décochée, `reviews$` entre nu dans `forkJoin` |
| `catchError` global, après `forkJoin` | sans le `catchError` par flux, c'est lui qui attrape : `fatal`, et tout l'écran tombe |
| « Réessayer (recharge tout) » | `reload$.next()` relance **tout** le `forkJoin` : en RxJS, le flux des avis vit à l'intérieur, on ne peut pas le relancer seul sans sortir du `forkJoin` (par exemple un `combineLatest` de trois flux indépendants). C'est la limite à noter dans la grille. |

## Côté signals (à vous)

Côté signals, l'erreur est déjà isolée dans la resource `reviews` : il suffit de l'afficher. Dans
le bloc avis de `s2-signals.ts`, ajoutez un `@else if (reviews.error())` avec le message et un
bouton « Réessayer (les avis seulement) » qui fait `(click)="reviews.reload()"`. Il n'y a rien
d'autre à changer par rapport à l'étape précédente, et c'est justement le point.

> 📖 [catchError](https://rxjs.dev/api/operators/catchError) ·
> [Resource : `error`, `reload`](https://angular.dev/guide/signals/resource)

## Critère de réussite

Le logement et l'agent sont affichés, les avis sont en erreur avec « réessayer », et cliquer ne
relance **que** les avis : côté signals, une seule ligne `reviews` apparaît dans le log. Côté RxJS,
sans `catchError` par flux (case décochée), l'écran affiche « Tout a échoué » et plus rien
d'autre. Le 503 tombe à pile ou face : basculez RxJS / Signals pour rejouer le chargement jusqu'à
tomber dessus.

> 💡 **Tester :** quand le 503 tombe sur les avis, la console montre :
>
> ```
> [chaos] GET /api/locations/3 +748ms
> [chaos] GET /api/reviews?locationId=3 => 503 (après 385 ms)
> [chaos] GET /api/agents/1 +1168ms
> ```
>
> Côté signals, cliquez ensuite sur « Réessayer (les avis seulement) » : une seule nouvelle ligne
> apparaît, `[chaos] GET /api/reviews?locationId=3 +1460ms` (ou un nouveau 503 : retentez).
>
> Côté RxJS, décochez la case et rejouez le chargement. Quand un 503 tombe sur les avis, le log
> est différent :
>
> ```
> [chaos] GET /api/reviews?locationId=3 => 503 (après 1251 ms)
> [chaos] GET /api/agents/1 => annulée
> ```
>
> et l'écran dit `Tout a échoué : 503 Service Unavailable (chaos)`. La ligne `annulée` (sur
> `agents/1`, ou sur `locations/3` selon le tirage) est instructive : `forkJoin` ne s'est pas
> contenté d'échouer, il a **désabonné** l'appel encore en cours. Avant de passer à la
> réservation, remettez la règle `/\/api\/reviews/` à `errorRate: 0`.

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
