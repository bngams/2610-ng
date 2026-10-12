# Grille de décision — version attendue

> À comparer avec la vôtre, pas à recopier. Les formulations entre parenthèses sont celles qu'on
> attend à l'oral en fin de journée.

| Situation | RxJS | Signals | Pont | Vu dans |
|---|---|---|---|---|
| **État dérivé synchrone** | `combineLatest([...])` + `map` ; piège : chaque source doit avoir émis une fois (`startWith`), sinon rien ne sort | **`computed`**, trois signals en entrée, une ligne de logique : c'est le terrain naturel des signals | aucun pont pour la dérivation ; `toSignal(http)` une seule fois pour la liste initiale | S6 |
| **1 requête dépendant d'un état** | `toObservable(état)` ou `valueChanges` => `switchMap(http)` => `toSignal` | **`httpResource(() => url(état))`** : relance quand les params changent, annule la précédente, expose `value / isLoading / error / reload` ; `undefined` en params = `idle` (dépendance pas encore là, S2 agent) | la sortie est déjà un signal ; `rxResource` si le service renvoie un Observable | S1, S2 |
| **Requêtes en parallèle** | `forkJoin({ a, b, c })` : une émission quand tout est fini => UX « squelette puis tout » ; une erreur = tout tombe (d'où S3) | N resources indépendantes + `computed(() => a.hasValue() && b.hasValue() && …)` => UX « bloc par bloc », erreur locale par bloc | pas nécessaire | S2 |
| **Annulation, « dernier gagne »** | `switchMap` | un `resource` **annule tout seul** quand ses params changent (désabonnement / `abortSignal`) | le debounce n'existe pas côté resource : `toSignal(toObservable(q).pipe(debounceTime(300)))` alimente les params | S1, S4 |
| **File ou anti-rebond d'action** | recherche : `switchMap` ; paiement / double soumission : **`exhaustMap`** ; sauvegarde automatique / journal : **`concatMap`** | `resource` ≈ `switchMap` (faux pour une mutation : « intended for read operations ») ; `exhaustMap` ≈ garde `pending` / `isLoading()` qui désactive le bouton ; **`concatMap` : pas d'équivalent** (il faudrait écrire la file) | `rxResource` ne change rien au problème : une mutation n'est pas une dérivation | S4 |
| **Flux dans le temps** | `timer(0, 3000)` => `switchMap(http)` => `takeUntilDestroyed()` ; `retry({ delay })`, `webSocket`… tout se compose | « signals seuls » = `effect` + `setInterval` + `onCleanup` : marche, mais l'effect ne lit aucun signal, rien ne se compose (pause, backoff, dernier-gagne), nettoyage manuel | **`rxResource({ stream: () => timer(0, 3000).pipe(switchMap(http)) })`** : le temps reste RxJS, la resource consomme et nettoie | S5, S1 |
| **Formulaire => état** | `FormControl.valueChanges` (+ `startWith(control.value)`) => `toSignal` | v22 : Signal Forms (`form()`, `field.value()`), ou `(input)` => `signal.set()` ; v20 : Reactive Forms + `toSignal(valueChanges)` | `toSignal(valueChanges, { initialValue })` est le pont standard | S1, S6, J2 |

## Règle de sortie

**Signals pour l'état et la dérivation, RxJS pour le temps et l'orchestration, le pont dans le
composant** (`toSignal` en sortie, `toObservable` pour injecter un signal dans un pipe, `rxResource`
quand un flux doit nourrir une resource). Un `resource` est une lecture ; une mutation est un
événement, elle se traite en RxJS (`exhaustMap`, `concatMap`) ou avec une garde explicite.

## Et sur un projet Angular 20 ?

`toSignal` / `toObservable` sont stables depuis la v20 : toute la colonne « Pont » s'applique.
`resource`, `rxResource`, `httpResource` sont **expérimentaux** en v20 (signature susceptible de
changer) : la colonne « Signals » des lignes « requête » se lit « `switchMap(http)` + `toSignal` en
attendant la v22 ». Les lignes « dérivation » (`computed`) et « temps » (RxJS) ne changent pas.
