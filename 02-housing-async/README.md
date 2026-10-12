# 02 — Housing sous pression asynchrone

> **Scénario à réaliser en autonomie.** Vous arrivez du lab [Housing Init](../02-housing-init/)
> avec l'application *Homes* terminée (ou vous partez de sa solution, `../02-housing-init/solution/`).
> Vous allez d'abord la **mettre sous pression** : une API enrichie (avis, agents, disponibilité,
> réservations), une migration de `fetch` vers `HttpClient`, et un intercepteur « chaos » qui
> ajoute latence aléatoire et erreurs sur certaines routes. Puis vous traitez **cinq scénarios
> asynchrones et un scénario synchrone, chacun deux fois** : le côté RxJS vous est **donné et
> expliqué**, le côté signals est **à écrire**, et vous comparez. Le livrable n'est pas le code,
> c'est la **grille de décision** « quand RxJS, quand signals, où on fait le pont » que vous
> remplissez au fil des scénarios (voir [GRILLE.md](GRILLE.md)). Le dossier `solution/` contient
> le projet complet, les six scénarios des deux côtés : à ne regarder qu'en cas de blocage, ou
> pour comparer avec la vôtre une fois terminé (à une exception près, S5, où lire la solution fait
> partie de l'exercice).

> **Niveau : confirmé.** Ce lab suppose que vous codez en Angular (v20) au quotidien, avec RxJS,
> et que vous avez suivi la matinée (`signal`, `computed`, `effect`) et l'intro de ce matin
> (`ng new`, HTTP avec RxJS et avec les signals). Sur le côté signals, il ne vous guide pas pas à
> pas : chaque scénario donne les **contraintes**, des **indices**, l'**API à utiliser** et des
> liens de doc. À vous de construire. Les API qui ne sont pas dans la matinée (`httpResource`,
> `rxResource`, `input.required`, `toObservable`) sont présentées dans la section « Le format »,
> juste avant S1, et rappelées au moment où vous en avez besoin.

Tout le lab tourne en **Angular 22**. Sur votre projet v20, `resource`, `httpResource` et
`rxResource` sont encore expérimentaux : la grille le note, et la variante sûre est
`toSignal(obs$)` (voir le [repère v20 vers v22](../00-intro-syntax-recap/repere-v20.html) du
support de la matinée).

---

## ✨ Objectifs

- Reconnaître les **six situations** qu'on croise dans une app métier : la recherche annulable, le
  chargement parallèle, l'erreur partielle, la course aux clics, le polling, et la dérivation
  synchrone.
- Savoir les **lire en RxJS** (`debounceTime`, `switchMap` / `concatMap` / `exhaustMap`, `forkJoin`,
  `catchError` par flux, `timer` + `takeUntilDestroyed`, `combineLatest`) : le code est donné,
  l'important est de savoir pourquoi chaque opérateur est là.
- Savoir les **écrire en signals** quand c'est possible (`httpResource`, `rxResource`, `computed`,
  `error()` / `reload()`, garde `pending`), et reconnaître quand ça ne l'est pas.
- Placer le **pont** au bon endroit : `toSignal`, `toObservable`, `rxResource`.
- Repartir avec une **grille de décision** applicable lundi sur votre projet.

---

## 📁 Point de départ

Vous partez de l'application Housing **terminée**, telle que le lab Init la laisse à l'étape 14.
Voici ce qu'elle contient, et qui va changer :

```
homes/                                 <- votre projet (ou une copie de 02-housing-init/solution/)
├── api/db.json                        <- 10 logements, une seule ressource : /locations
├── package.json                       <- json-server 0.17.4 déjà en devDependencies, script "api"
└── src/app/
    ├── app.ts, app.css                <- en-tête + <router-outlet>
    ├── app.config.ts                  <- provideRouter(routes), pas encore de HttpClient
    ├── app.routes.ts                  <- deux routes : '' et 'details/:id'
    ├── housinglocation.ts             <- HousingLocationInfo (8 champs)
    ├── housing.service.ts             <- fetch + async/await vers http://localhost:3000/locations
    ├── home/home.ts                   <- la liste, avec then() + markForCheck()
    ├── details/details.ts             <- la fiche + le formulaire, avec then() + markForCheck()
    └── housing-location/…             <- la carte (ne change pas)
```

Ce que vous ne devez pas réécrire, le dossier `assets/` (à côté de ce README, **pas** dans votre
projet) vous le donne. Chaque fichier est copié au moment où une section le demande ; les commandes
`cp` du lab supposent que votre projet `homes/` est **à côté** du dossier `02-housing-async/` (voir
la mise en place) :

```
assets/
├── api/
│   ├── db.json                        <- la base enrichie : locations (+ price, type, agentId), reviews, agents, availability, bookings
│   └── db.seed.json                   <- la même, copie de référence pour `npm run api:reset`   (étape 0)
├── proxy.conf.json                    <- /api vers http://localhost:3000                       (étape 0)
├── chaos/
│   ├── chaos.config.ts                <- latence et taux d'erreur par route : c'est ici que vous réglez (étape 0)
│   └── chaos.interceptor.ts           <- l'intercepteur HttpClient                              (étape 0)
└── scenarios.css                      <- la mise en page des pages de scénario                  (section « Comment une expérience est construite » de l'[étape S1](ETAPES/01-RECHERCHE.md))
```

Et voici l'arborescence que vous aurez à la fin : c'est une vision finale, chaque dossier de
scénario est créé par la section qui lui correspond.

```
homes/
├── api/db.json, db.seed.json
├── proxy.conf.json
├── angular.json                       <- proxyConfig + scenarios.css
└── src/
    ├── scenarios.css
    └── app/
        ├── app.ts, app.css            <- + la barre de navigation S1 à S6
        ├── app.config.ts              <- + provideHttpClient(withInterceptors([chaosInterceptor]))
        ├── app.routes.ts              <- + une route par scénario
        ├── housinglocation.ts         <- + Review, Agent, Availability, Booking
        ├── housing.service.ts         <- HttpClient, un Observable par endpoint
        ├── chaos/                     <- chaos.config.ts, chaos.interceptor.ts
        ├── home/, details/            <- migrés sur HttpClient + toSignal
        └── scenarios/
            ├── mode-toggle.ts         <- la bascule RxJS / Signals
            ├── s1-search/             <- s1-page.ts, s1-rxjs.ts (donné), s1-signals.ts (à vous)
            ├── s2-details/            <- S2 et S3 : même page, mêmes composants
            ├── s4-booking/
            ├── s5-polling/
            └── s6-filters/            <- + filters.ts (la fonction pure, donnée)
```

Il n'y a pas de dossier `s3-*` : S3 se joue dans les composants de S2, en changeant un réglage du
chaos.

---

## 🚀 Mise en place

Angular 22 exige **Node 24.15+** (ou 22.22.3+, voir la
[matrice des versions](https://angular.dev/reference/versions)) : en dessous, la CLI s'arrête sur
« Please update your Node.js version ». Vous aurez besoin de **trois terminaux** : un pour l'API, un pour l'app,
un pour les commandes (`curl`, `npm run api:reset`).

```bash
nvm use 24            # ou nvm install 24 si besoin ; à refaire dans chaque terminal
node -v               # -> v24.x

# placez-vous à la racine du cours, le dossier qui contient 02-housing-init/ et 02-housing-async/.
# Si vous partez de la solution du lab Init plutôt que de votre projet :
cp -r 02-housing-init/solution homes && cd homes
# Si vous partez de votre propre projet : copiez-le (ou déplacez-le) à cet endroit, puis cd homes.
npm install           # json-server 0.17.4 est déjà dans les devDependencies (étape 14 du lab Init)

# terminal 1 : l'API
npm run api
# terminal 2 : l'app
npm start
```

> 💡 **Tester :** `npm run api` n'affiche pour l'instant qu'une ressource,
> `http://localhost:3000/locations`, et `npm start` termine par `➜  Local:   http://localhost:4200/`.
> Ouvrez-le : les dix cartes s'affichent, comme à la fin du lab Init. Gardez la **console du
> navigateur ouverte** (F12) pendant tout le lab, avec le filtre `chaos` : c'est là que se lisent
> les preuves.

---

## 🔁 Le format : deux fois, puis comparer

Pour chaque scénario, le déroulé est le même :

1. **Côté RxJS**, le code est **donné** : copiez-le, lisez le tableau qui explique chaque
   opérateur, faites-le tourner et observez le log. Contrainte que ce code respecte : **aucun
   `subscribe()` manuel pour un état**, la sortie passe par `toSignal` ; les deux exceptions (un
   événement, S4 ; un tick, S5) sont nommées.
2. **Côté signals**, le code est **à écrire** : `httpResource` / `rxResource` / `computed`, à partir
   des contraintes, des indices et des liens de doc. Quand le scénario n'a pas d'équivalent propre,
   le but est justement de le constater, pas de forcer.
3. **Vérifier** le critère de réussite (log chaos + onglet Réseau), puis **remplir** la ligne
   correspondante de [GRILLE.md](GRILLE.md) : trois mots par case suffisent, l'important est d'être
   capable de le justifier à l'oral. Le bloc « Ce qu'on retient » de chaque scénario est replié :
   ouvrez-le après avoir rempli la grille, pas avant.

Quatre API qui ne sont pas dans la matinée, et que vous utiliserez partout :

| API | Ce qu'il faut savoir | Doc |
|---|---|---|
| `httpResource(() => url \| requête \| undefined)` | le `resource` de `HttpClient` : sa **fonction de requête** (l'équivalent des `params` de `resource`) renvoie une URL, un objet `{ url, params, method, body }`, ou `undefined` pour rester `idle` ; elle relance et annule quand ses signals changent ; expose `value()`, `isLoading()`, `error()`, `hasValue()`, `status()`, `reload()` ; attention, `value()` **lève** si la resource est en erreur, testez `hasValue()` avant. Elle prend une URL, pas un Observable : dupliquez l'URL depuis `housing.service.ts`. | [httpResource](https://angular.dev/guide/http/http-resource) |
| `rxResource({ params, stream })` | le même `resource`, mais nourri par un Observable : c'est la forme à prendre pour réutiliser les méthodes de `HousingService`, ou pour un `stream` qui émet plusieurs fois (S5) | [rxResource](https://angular.dev/api/core/rxjs-interop/rxResource) |
| `locationId = input.required<number>()` | les composants S2, S4, S5 reçoivent l'id ainsi. Piège : `toSignal` s'abonne **à la construction**, et un `startWith` ou un `of` émet **tout de suite** ; lire `this.locationId()` à ce moment-là lève `NG0950`. Partez de `toObservable(this.locationId)`, qui n'émet qu'une fois l'input disponible (détail en fin de lab, piège 3). | [NG0950](https://angular.dev/errors/NG0950) |
| `toSignal` / `toObservable` | le pont. `toObservable` émet de façon asynchrone ; `toSignal(obs$, { initialValue })` évite un `undefined` de départ | [rxjs-interop](https://angular.dev/ecosystem/rxjs-interop) |

> 📖 [`resource`, le guide](https://angular.dev/guide/signals/resource)

---

## 🗂️ Les étapes

Une page par expérience, à faire dans l'ordre : l'étape 0 prépare le projet, S1 montre comment une
expérience se construit, S2 à S6 réutilisent le même geste.

| Étape | Ce que vous faites | Côté signals |
|---|---|---|
| [00 — Mise sous pression](ETAPES/00-MISE-SOUS-PRESSION.md) | API enrichie, proxy, `fetch` => `HttpClient`, intercepteur chaos (code donné) | `toSignal` |
| [01 — Recherche : anti-rebond et annulation](ETAPES/01-RECHERCHE.md) | construire une expérience (route, page, bascule), puis `debounceTime` + `switchMap` | `httpResource` + le pont pour le debounce |
| [02 — Détail : trois appels en parallèle](ETAPES/02-DETAIL-PARALLELE.md) | `forkJoin` | 3 resources + `computed` |
| [03 — Détail : un appel sur trois échoue](ETAPES/03-DETAIL-ERREUR.md) | `catchError` par flux | `error()` + `reload()` |
| [04 — Réserver : clics rapides](ETAPES/04-RESERVER.md) | `switchMap` / `concatMap` / `exhaustMap` | `rxResource` et une garde sur `isLoading()` |
| [05 — Disponibilité : polling](ETAPES/05-DISPONIBILITE.md) | `timer` + `switchMap` + `takeUntilDestroyed` | essayez, constatez, puis lisez la solution |
| [06 — Filtres : dérivation synchrone](ETAPES/06-FILTRES.md) | `combineLatest` | `computed`, sans requête |

## 📋 Livrable : la grille de décision

Ouvrez [GRILLE.md](GRILLE.md). Sept lignes (une situation par ligne), trois colonnes à remplir
(RxJS, Signals, Pont) plus une colonne « Vu dans » déjà renseignée. Chaque case : quelques mots,
de quoi tenir trente secondes à l'oral. La ligne « formulaire => état » n'est couverte que côté
RxJS par S1 et S6 (`valueChanges`) : remplissez la colonne Signals avec ce que vous savez, on la
reprend avec les Signal Forms.

Ce que la grille doit permettre, en fin de journée : prendre un cas **de votre projet** (vous en
apportez un pour la séance de questions-réponses) et dire en trente secondes : RxJS, signals, ou
pont, et où.

Une version attendue est dans `solution/GRILLE-corrigee.md`, à ouvrir après avoir rempli la vôtre.

---

## ✅ Bonus : trois pièges RxJS qu'on voit dans toutes les revues de code

Voici trois extraits bugués, à corriger. Pour chacun, vous lisez le symptôme, puis la cause, puis
le correctif.

### Piège 1 : le subscribe imbriqué

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

### Piège 2 : l'input muté

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

### Piège 3 : lire un `input.required` trop tôt

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

---

## Récap

- **Signals pour l'état et la dérivation** : `computed` remplace `combineLatest` + `map` dès que
  tout est synchrone (S6) ; `httpResource` remplace `switchMap(http)` + `toSignal` pour « une
  requête qui dépend d'un état » (S1, S2), avec annulation et statut d'erreur local (S3).
- **RxJS pour le temps et l'orchestration** : anti-rebond (S1), file ou garde sur des événements
  (S4), polling et tout ce qui a un `timer` dedans (S5). Un `resource` n'est pas un bouton :
  pour une mutation, c'est `exhaustMap` ou une garde `pending`.
- **Le pont vit dans le composant** : `toSignal(obs$)` en sortie, `toObservable(sig)` pour
  injecter un signal dans un pipe, `rxResource` quand un flux doit nourrir une resource.
- **Le chaos est votre ami** : sans latence ni erreur, aucun de ces bugs n'est visible en dev ;
  ils arrivent en prod. Gardez un intercepteur de ce genre à portée de main sur votre projet.
- **Sur votre projet v20** : `toSignal` est stable, `resource` ne l'est pas encore ; la grille
  reste valable, seule la colonne « Signals » attend la v22 pour les lignes « requête ».
