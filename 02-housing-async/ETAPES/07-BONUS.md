# ✅ 07 — Bonus : trois pièges RxJS qu'on voit dans toutes les revues de code

> Facultatif, à faire si vous avez fini les six expériences avant le débrief final. Gardez le
> chaos actif : le symptôme du piège 1 se lit dans son log.

Voici trois extraits bugués, à corriger. Pour chacun, vous lisez le symptôme, puis la cause, puis
le correctif.

## Piège 1 : le subscribe imbriqué

```ts
// 🐛 details.ts (route /details/:id) — « ça marche », jusqu'au jour où l'utilisateur change de page vite
this.route.params.subscribe((params) => {
  this.housingService.getHousingLocationById(+params['id']).subscribe((location) => {
    this.location = location;
    this.housingService.getAgent(location.agentId).subscribe((agent) => {
      this.agent = agent;
    });
  });
});
```

| | |
|---|---|
| **Symptôme** | en naviguant vite de `/details/3` à `/details/5`, la fiche affiche parfois le logement 5 avec l'agent du 3 ; et en quittant la page, les requêtes continuent (log chaos). |
| **Cause** | chaque `subscribe` interne est un flux orphelin : rien ne l'annule quand `params` ré-émet, rien ne le désabonne à la destruction. Les réponses arrivent dans le désordre et s'écrasent. |
| **Correctif** | un seul flux, les dépendances exprimées par `switchMap`, la sortie par `toSignal` (qui se désabonne tout seul) : |

```ts
readonly vm = toSignal(
  this.route.params.pipe(
    map((p) => +p['id']),
    switchMap((id) => this.housingService.getHousingLocationById(id)),
    switchMap((location) =>
      this.housingService.getAgent(location.agentId).pipe(map((agent) => ({ location, agent }))),
    ),
  ),
);
```

Dans les scénarios, l'id arrive par `input.required` et non par `ActivatedRoute` :
`toObservable(this.locationId)` joue alors le rôle de `this.route.params`.

## Piège 2 : l'input muté

```ts
// 🐛 s6-rxjs.ts — le tri « fonctionne », mais la liste d'à côté change aussi
readonly filtered = toSignal(
  combineLatest([list$, sort$]).pipe(
    map(([list, sort]) => list.sort((a, b) => (sort === 'price' ? a.price - b.price : 0))),
  ),
);
```

| | |
|---|---|
| **Symptôme** | trier dans un composant trie aussi dans un autre qui a reçu la même liste ; un `computed` ne se recalcule pas alors que « la liste a changé » ; en test, l'ordre d'exécution change le résultat. |
| **Cause** | `Array.prototype.sort` **trie en place** : le `map` a muté le tableau reçu, qui est partagé par tous ceux qui ont reçu la même référence (un autre composant, un `computed`, un store). Les signals et `OnPush` comparent par référence : une mutation est invisible pour eux. |
| **Correctif** | ne jamais muter une entrée ; produire un nouveau tableau (`toSorted`, ou `[...list].sort(...)`) : |

```ts
map(([list, sort]) => [...list].sort((a, b) => (sort === 'price' ? a.price - b.price : 0)))
```

Même règle pour `push`, `splice`, `reverse`, et pour l'affectation d'une propriété sur un objet
reçu en `input()`.

## Piège 3 : lire un `input.required` trop tôt

```ts
// 🐛 NG0950 : Input "locationId" is required but no value is available yet
readonly bookings = toSignal(
  this.refresh$.pipe(startWith(undefined), switchMap(() => this.housingService.getBookings(this.locationId()))),
);
```

| | |
|---|---|
| **Symptôme** | la page reste à moitié rendue, et la console affiche `NG0950: Input "locationId" is required but no value is available yet`. |
| **Cause** | `toSignal` s'abonne **à la construction** et `startWith` émet **tout de suite** : `locationId()` est lu avant que le parent n'ait fourni la valeur. |
| **Correctif** | partir de `toObservable(this.locationId)`, qui n'émet qu'une fois l'input disponible, et le combiner avec `refresh$` : |

```ts
readonly bookings = toSignal(
  combineLatest([toObservable(this.locationId), this.refresh$.pipe(startWith(undefined))]).pipe(
    switchMap(([id]) => this.housingService.getBookings(id)),
  ),
);
```

> 📖 [NG0950](https://angular.dev/errors/NG0950)

➡️ Retour au [débrief final : la grille de décision](../README.md)
