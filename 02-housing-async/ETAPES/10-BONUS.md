# ✅ 10 — Bonus : trois pièges RxJS qu'on voit dans toutes les revues de code

> Facultatif, à faire si vous avez fini l'étape 09 avant le débrief final. Gardez le
> chaos actif : le symptôme du piège 1 se lit dans son log. Les extraits reprennent les noms de
> `HousingService` (étapes 00 à 07) ; après l'étape 09, lisez par exemple
> `locationsService.get(id)` à la place de `housingService.getHousingLocationById(id)`.

Voici trois extraits bugués, à corriger. Pour chacun, lisez d'abord le code et cherchez le bug
par vous-même, puis lisez le symptôme, la cause et le correctif.

## Piège 1 : le subscribe imbriqué

Ce premier extrait charge une fiche, puis l'agent du logement, dans le composant `details.ts` du
tutoriel. Chaque appel attend le précédent en s'abonnant à l'intérieur de son `subscribe` :

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

Le code compile et l'écran s'affiche ; c'est en navigation réelle que le problème apparaît :

| | |
|---|---|
| **Symptôme** | en naviguant vite de `/details/3` à `/details/5`, la fiche affiche parfois le logement 5 avec l'agent du 3 ; et en quittant la page, les requêtes continuent (log chaos). |
| **Cause** | chaque `subscribe` interne est un flux orphelin : rien ne l'annule quand `params` ré-émet, rien ne le désabonne à la destruction. Les réponses arrivent dans le désordre et s'écrasent. |
| **Correctif** | un seul flux, les dépendances exprimées par `switchMap`, la sortie par `toSignal` (qui se désabonne tout seul). |

Réécrit ainsi, l'extrait devient un seul flux : chaque nouvel `id` annule la chaîne précédente, et
`toSignal` coupe tout à la destruction du composant.

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

Dans les expériences, l'id arrive par `input.required` et non par `ActivatedRoute` :
`toObservable(this.locationId)` joue alors le rôle de `this.route.params`.

## Piège 2 : l'input muté

Ce deuxième extrait est une variante du volet RxJS des filtres : il trie la liste reçue selon le
critère choisi.

```ts
// 🐛 s6-rxjs.ts — le tri « fonctionne », mais la liste d'à côté change aussi
readonly filtered = toSignal(
  combineLatest([list$, sort$]).pipe(
    map(([list, sort]) => list.sort((a, b) => (sort === 'price' ? a.price - b.price : 0))),
  ),
);
```

Le tri a l'air de fonctionner, mais ses effets débordent du composant :

| | |
|---|---|
| **Symptôme** | trier dans un composant trie aussi dans un autre qui a reçu la même liste ; un `computed` ne se recalcule pas alors que « la liste a changé » ; en test, l'ordre d'exécution change le résultat. |
| **Cause** | `Array.prototype.sort` **trie en place** : le `map` a muté le tableau reçu, qui est partagé par tous ceux qui ont reçu la même référence (un autre composant, un `computed`, un store). Les signals et `OnPush` comparent par référence : une mutation est invisible pour eux. |
| **Correctif** | ne jamais muter une entrée ; produire un nouveau tableau (`toSorted`, ou `[...list].sort(...)`). |

Dans l'extrait, il suffit de trier une copie plutôt que la liste reçue ; seule la ligne du `map`
change :

```ts
map(([list, sort]) => [...list].sort((a, b) => (sort === 'price' ? a.price - b.price : 0)))
```

Même règle pour `push`, `splice`, `reverse`, et pour l'affectation d'une propriété sur un objet
reçu en `input()`.

## Piège 3 : lire un `input.required` trop tôt

Ce dernier extrait est une première version du compteur de réservations : il recharge la liste à
chaque `refresh$`, en partant tout de suite grâce à `startWith`.

```ts
// 🐛 NG0950 : Input "locationId" is required but no value is available yet
readonly bookings = toSignal(
  this.refresh$.pipe(startWith(undefined), switchMap(() => this.housingService.getBookings(this.locationId()))),
);
```

Ici, l'erreur est immédiate, dès l'ouverture de la page :

| | |
|---|---|
| **Symptôme** | la page reste à moitié rendue, et la console affiche `NG0950: Input "locationId" is required but no value is available yet`. |
| **Cause** | `toSignal` s'abonne **à la construction** et `startWith` émet **tout de suite** : `locationId()` est lu avant que le parent n'ait fourni la valeur. |
| **Correctif** | partir de `toObservable(this.locationId)`, qui n'émet qu'une fois l'input disponible, et le combiner avec `refresh$`. |

C'est la forme utilisée dans le volet RxJS de la réservation (étape 05) : l'`id` n'est plus lu à la
construction, il arrive dans le flux.

```ts
readonly bookings = toSignal(
  combineLatest([toObservable(this.locationId), this.refresh$.pipe(startWith(undefined))]).pipe(
    switchMap(([id]) => this.housingService.getBookings(id)),
  ),
);
```

> 📖 [NG0950](https://angular.dev/errors/NG0950)

➡️ Retour au [débrief final : la grille de décision](../README.md)
