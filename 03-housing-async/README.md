# 03 — Housing sous pression asynchrone

> **Scénario à réaliser en autonomie.** Vous partez de l'application Housing *terminée* (celle du
> tutoriel officiel « first app » d'angular.dev), branchée sur une API locale qu'on a rendue
> capricieuse : latence aléatoire et erreurs sur certaines routes. Vous traitez **cinq scénarios
> asynchrones et un témoin synchrone, chacun deux fois** : d'abord en RxJS, puis en
> signals/`resource`, et vous comparez. Le livrable n'est pas le code, c'est la **grille de
> décision** « quand RxJS, quand signals, où on fait le pont » que vous remplissez au fil des
> scénarios (voir [GRILLE.md](GRILLE.md)). Le dossier `solution/` contient les deux versions de
> chaque scénario : à ne regarder qu'en cas de blocage, ou pour comparer avec la vôtre une fois
> terminé.

> **Niveau : confirmé.** Ce lab suppose que vous codez en Angular (v20) au quotidien, avec RxJS,
> NgRx et les Reactive Forms. Il suppose aussi la matinée : `signal`, `computed`, `effect`. Il ne
> vous guide pas pas à pas : chaque scénario donne le **pipeline attendu** sous forme de
> contraintes, un **critère de réussite observable** et des liens de doc. À vous de construire.
> Les API de la journée qui ne sont pas dans la matinée (`httpResource`, `rxResource`,
> `input.required`, `toObservable`) sont introduites dans la section « Le format » et dans les
> liens de doc de chaque scénario.

Tout le lab tourne en **Angular 22**. Sur votre projet v20, `resource`/`httpResource`/`rxResource`
sont encore expérimentaux : la grille le note, et la variante sûre est `toSignal(obs$)`
(voir le [repère v20 vers v22](../00-intro-syntax-recap/repere-v20.html) du support de la matinée).

---

## ✨ Objectifs

- Reconnaître les **six situations** qu'on croise dans une app métier : la recherche annulable, le
  chargement parallèle, l'erreur partielle, la course aux clics, le polling, et le témoin : la
  dérivation synchrone.
- Savoir les écrire **en RxJS** (`debounceTime`, `switchMap`/`concatMap`/`exhaustMap`, `forkJoin`,
  `catchError` par flux, `timer` + `takeUntilDestroyed`, `combineLatest`).
- Savoir les écrire **en signals** quand c'est possible (`httpResource`, `rxResource`, `computed`,
  `error()`/`reload()`, garde sur `isLoading()`), et reconnaître quand ça ne l'est pas.
- Placer le **pont** au bon endroit : `toSignal`, `toObservable`, `rxResource`.
- Repartir avec une **grille de décision** applicable lundi sur votre projet.

---

## 📁 Point de départ

Vous copiez `base/`, qui contient l'app Housing finie, une API enrichie et l'intercepteur chaos.
Voici ce qui est déjà là, et ce que vous écrivez :

```
03-housing-async/
├── README.md                     <- cet énoncé
├── GRILLE.md                     <- le gabarit de grille à remplir (le livrable)
├── base/                         <- ce que vous copiez
│   ├── api/
│   │   ├── db.json               <- la base json-server (10 logements + avis, agents, dispo, réservations)
│   │   └── db.seed.json          <- la copie de référence (npm run api:reset)
│   ├── proxy.conf.json           <- /api vers http://localhost:3000 (pas de CORS), référencé par angular.json
│   ├── package.json              <- scripts : start, api, api:reset
│   └── src/app/
│       ├── housinglocation.ts    <- modèles : HousingLocationInfo (+ price, type, agentId), Review, Agent, Availability, Booking
│       ├── housing.service.ts    <- HttpClient, un Observable par endpoint (déjà fait pour vous)
│       ├── chaos/
│       │   ├── chaos.config.ts   <- latence et taux d'erreur par route : c'est ici que vous réglez
│       │   └── chaos.interceptor.ts
│       ├── home/, details/, housing-location/   <- l'app du tutoriel, migrée sur HttpClient
│       └── scenarios/
│           ├── mode-toggle.ts    <- la bascule « Les deux / RxJS seul / Signals seul »
│           ├── s1-search/        <- s1-page.ts (fourni) + s1-rxjs.ts, s1-signals.ts (À VOUS)
│           ├── s2-details/       <- S2 et S3 : même page, mêmes composants
│           ├── s4-booking/
│           ├── s5-polling/
│           └── s6-filters/
└── solution/                     <- même projet, les 6 scénarios implémentés des deux côtés
    └── GRILLE-corrigee.md        <- la grille attendue, à lire APRÈS avoir rempli la vôtre
```

Chaque dossier `scenarios/sN-*/` contient une page (`sN-page.ts`, fournie : titre, consigne,
bascule, les deux volets côte à côte, routée sur `/s1`, `/s2/:id`, `/s4/:id`, `/s5/:id`, `/s6`) et
deux composants vides, `sN-rxjs.ts` et `sN-signals.ts`, dont l'en-tête rappelle les contraintes.
**Vous écrivez le contenu de ces deux composants, et rien d'autre n'est imposé** : ajoutez des
fichiers, des composants enfants, du CSS, comme vous voulez. Il n'y a pas de dossier `s3-*` :
S3 se code dans les composants de S2.

### Ce qui a été fait pour vous : la migration `fetch` vers `HttpClient`

Le tutoriel termine sur `fetch` + `await` + `markForCheck()`. On a remplacé ça par `HttpClient`
dans `housing.service.ts`, pour trois raisons :

| Pourquoi | Ce que ça change pour vous |
|---|---|
| Un `Observable` est **froid et annulable** : se désabonner, c'est abandonner la requête | sans ça, pas de `switchMap`, pas de « dernier gagne » |
| `HttpClient` passe par les **intercepteurs** | sans ça, pas de chaos : `fetch` contourne tout |
| Les composants lisent via `toSignal` ou `resource` : plus de `markForCheck()` | l'app est zoneless (sans Zone.js), le rendu suit les signals |

Le reste de l'app (templates, CSS, routes `''` et `details/:id`) est celui du tutoriel, plus une
barre de navigation vers les scénarios et trois champs ajoutés aux logements (`price`, `type`,
`agentId`) pour que les filtres et les jointures aient un sens.

---

## 🚀 Mise en place

Angular 22 exige **Node 24.15+** (ou 22.22.3+) : en dessous, la CLI s'arrête sur
« Please update your Node.js version ». Vous aurez besoin de deux terminaux, un pour l'API et un
pour l'app.

```bash
nvm use 24            # ou nvm install 24 si besoin
node -v               # -> v24.x

cd 03-housing-async
cp -r base mon-housing && cd mon-housing
npm install

# terminal 1 : l'API
npm run api
# terminal 2 : l'app (le proxy /api est déjà branché : proxy.conf.json, référencé dans angular.json)
npm start
```

> 💡 **Tester :** `npm run api` affiche les ressources exposées par json-server :
>
> ```
>   \{^_^}/ hi!
>
>   Loading api/db.json
>   Done
>
>   Resources
>   http://localhost:3000/locations
>   http://localhost:3000/reviews
>   http://localhost:3000/agents
>   http://localhost:3000/availability
>   http://localhost:3000/bookings
> ```
>
> `npm start` termine par `➜  Local:   http://localhost:4200/`. Ouvrez-le : la liste des dix
> logements s'affiche après un délai visible (c'est le chaos, voir plus bas), et la barre du haut
> mène aux pages S1, S2-S3, S4, S5 et S6, qui contiennent pour l'instant un encart « À vous de jouer ».

### L'API

json-server est épinglé en **0.17.4** : c'est cette branche qui supporte le filtre `_like`
(regex, insensible à la casse) dont le scénario S1 a besoin ; la branche 1.x a changé les
opérateurs. Les endpoints, tels que `housing.service.ts` les appelle (à travers le proxy,
`/api/...` devient `http://localhost:3000/...`) :

| Endpoint | Rôle | Scénario |
|---|---|---|
| `GET /locations` | les 10 logements, avec `price`, `type`, `agentId` | tous |
| `GET /locations?city_like=chi` | recherche par ville, côté serveur | S1 |
| `GET /locations/:id` | un logement | S2 |
| `GET /reviews?locationId=:id` | 3 à 5 avis par logement | S2, S3 |
| `GET /agents/:id` | l'agent référencé par `location.agentId` | S2 |
| `GET /availability/:locationId` | `{ available: boolean }` (l'`id` vaut le `locationId`) | S5 |
| `PATCH /availability/:locationId` | pour basculer `available` sans éditer le fichier | S5 |
| `POST /bookings` | crée une réservation `{ locationId, at }` | S4 |
| `GET /bookings?locationId=:id` | pour compter ce que le serveur a vraiment reçu | S4 |

> 💡 **Tester :** `curl -s "http://localhost:3000/locations?city_like=chi" | grep '"city"'`
>
> ```
>     "city": "Chicago",
>     "city": "Chicago",
> ```
>
> `curl -s http://localhost:3000/availability/3`
>
> ```json
> {
>   "id": 3,
>   "locationId": 3,
>   "available": true,
>   "updatedAt": "2026-10-11T08:00:00Z"
> }
> ```

⚠️ json-server **écrit dans `api/db.json`** à chaque `POST`/`PATCH` (et, grâce à `--watch`, relit
le fichier si vous l'éditez à la main). Pour repartir d'une base propre entre deux essais de S4
ou S5, trois gestes : `Ctrl-C` sur le terminal de l'API, `npm run api:reset` (qui recopie
`db.seed.json`, où `bookings` est vide), puis `npm run api`.

---

## 🌪️ Le chaos

Sans latence ni erreur, aucun scénario n'est visible : une recherche annulée sur une API qui
répond en 5 ms ne s'annule jamais, un `forkJoin` sur trois appels instantanés ne montre pas de
squelette, et un bouton cliqué trois fois sur un POST de 2 ms ne fait pas de course. D'où
l'intercepteur `chaos`, branché dans `app.config.ts` :

```ts
provideHttpClient(withInterceptors([chaosInterceptor]))
```

Pour chaque requête, il tire un délai aléatoire et, selon la route, décide de répondre **503** au
lieu d'envoyer. Le réglage est dans `src/app/chaos/chaos.config.ts` :

```ts
export const CHAOS_ENABLED = true;
export const CHAOS_DEFAULT = { minDelayMs: 300, maxDelayMs: 1500, errorRate: 0 };
export const CHAOS_RULES: ChaosRule[] = [
  // S3 : les avis tombent une fois sur deux.
  { match: /\/api\/reviews/, minDelayMs: 300, maxDelayMs: 1500, errorRate: 0.5 },
  // Exemples de réglages à activer selon le scénario :
  // { match: /\/api\/bookings/, minDelayMs: 1000, maxDelayMs: 2000, errorRate: 0 },
];
```

| Champ d'une règle | Rôle |
|---|---|
| `match` | une RegExp testée sur l'URL complète (avec query string), ou un préfixe de chaîne ; la première règle qui correspond gagne, sinon `CHAOS_DEFAULT` |
| `minDelayMs` / `maxDelayMs` | la fourchette de latence, tirée au hasard à chaque appel |
| `errorRate` | la probabilité (0 à 1) de remplacer la requête par une `HttpErrorResponse` 503 |

`CHAOS_ENABLED = false` rend l'API normale : utile pour vérifier qu'un bug vient bien du chaos.

Un point d'implémentation qui compte pour la suite : **le délai est placé avant l'envoi**
(`timer(délai)` puis `switchMap(() => next(req))`), pas après la réponse. Conséquence : quand un
`switchMap` ou un `resource` se désabonne pendant l'attente, la requête **ne part jamais**, et
l'intercepteur le logue. Vous verrez l'une de ces trois lignes dans la console du navigateur :

```
[chaos] GET /api/reviews?locationId=3 +842ms            <- partie, répondue, après 842 ms d'attente
[chaos] GET /api/reviews?locationId=3 => 503 (après 537 ms)   <- remplacée par une erreur
[chaos] GET /api/locations?city_like=Jun => annulée      <- désabonnée avant la réponse
```

Deux précisions pour lire les preuves correctement. Une requête désabonnée **après** l'envoi est
aussi loguée « annulée » (la réponse est jetée) : c'est l'onglet Réseau qui dit si elle est partie
(elle y apparaît *canceled*) ou non (elle n'y est pas). Et un 503 du chaos **n'apparaît jamais
dans l'onglet Réseau**, puisque la requête n'est pas envoyée : pour les erreurs, la preuve est la
console. Gardez-la ouverte pendant tout le lab.

> 💡 **Tester :** ouvrez `http://localhost:4200/`, console ouverte. Vous devez voir une ligne
> `[chaos] GET /api/locations +NNNms` avec un délai différent à chaque rechargement. Puis passez
> `errorRate` à `0.5` dans `CHAOS_DEFAULT` : une fois sur deux, la page d'accueil reste vide avec
> `[chaos] GET /api/locations => 503 (après NNN ms)` suivi d'une erreur `HttpErrorResponse` rouge
> (`toSignal` relance l'erreur quand le template lit le signal : c'est attendu). Remettez `0`
> avant de continuer.

---

## 🔁 Le format : deux fois, puis comparer

Pour chaque scénario, le déroulé est le même :

1. **Côté RxJS** d'abord : c'est votre langue maternelle, allez vite. Contrainte générale :
   **aucun `subscribe()` manuel dans un composant**, la sortie passe par `toSignal` ; les deux
   exceptions sont nommées dans S4 et S5.
2. **Côté signals** ensuite : `httpResource` / `rxResource` / `computed`. Quand le scénario n'a
   pas d'équivalent propre, le but est justement de le constater, pas de forcer.
3. **Comparer**, en remplissant la ligne correspondante de [GRILLE.md](GRILLE.md) : trois mots par
   case suffisent, l'important est d'être capable de le justifier à l'oral.

Chaque page de scénario affiche les deux volets côte à côte (bascule « Les deux / RxJS seul /
Signals seul » en haut). Quand un volet est masqué, son composant est **détruit** : c'est la façon
de vérifier qu'un flux s'arrête bien. Et comme chaque volet fait ses propres requêtes, **affichez
un seul volet quand vous lisez le log ou l'onglet Réseau** : en « Les deux », tout apparaît en
double. Les blocs « Tester » ci-dessous sont écrits pour un seul volet.

Quatre API qui ne sont pas dans la matinée, et que vous utiliserez partout :

| API | Ce qu'il faut savoir | Doc |
|---|---|---|
| `httpResource(() => url \| requête \| undefined)` | le `resource` de `HttpClient` : sa **fonction de requête** (l'équivalent des `params` de `resource`) renvoie une URL, un objet `{ url, params, method, body }`, ou `undefined` pour rester `idle` ; elle relance et annule quand ses signals changent ; expose `value()`, `isLoading()`, `error()`, `hasValue()`, `reload()` ; attention, `value()` **lève** si la resource est en erreur, testez `hasValue()` avant. Elle prend une URL, pas un Observable : dupliquez l'URL depuis `housing.service.ts`. | [httpResource](https://angular.dev/guide/http/http-resource) |
| `rxResource({ params, stream })` | le même `resource`, mais nourri par un Observable : c'est la forme à prendre pour réutiliser les méthodes de `HousingService`, ou pour un `stream` qui émet plusieurs fois (S5) | [rxResource](https://angular.dev/api/core/rxjs-interop/rxResource) |
| `locationId = input.required<number>()` | les composants S2, S4, S5 reçoivent l'id ainsi (déjà dans les squelettes). Piège : `toSignal` s'abonne **à la construction**, et un `startWith` ou un `of` émet **tout de suite** ; lire `this.locationId()` à ce moment-là lève `NG0950`. Partez de `toObservable(this.locationId)`, qui n'émet qu'une fois l'input disponible (détail en fin de lab, piège 3). | [NG0950](https://angular.dev/errors/NG0950) |
| `toSignal` / `toObservable` | le pont. `toObservable` émet de façon asynchrone ; `toSignal(obs$, { initialValue })` évite un `undefined` de départ | [rxjs-interop](https://angular.dev/ecosystem/rxjs-interop) |

> 📖 [`resource`, le guide](https://angular.dev/guide/signals/resource)

---

## 🔎 S1 — Recherche live par ville, avec anti-rebond et annulation

**Contexte.** Un champ texte ; à chaque frappe, on cherche côté serveur (`searchByCity`, soit
`GET /locations?city_like=`). Deux problèmes à résoudre : ne pas envoyer une requête par lettre
(anti-rebond), et ne jamais afficher le résultat d'une requête plus ancienne que la dernière
saisie (annulation, « dernier gagne »).

| Besoin | RxJS | Signals |
|---|---|---|
| Attendre que l'utilisateur ait fini de taper | `debounceTime(300)` | rien de natif : un `resource` réagit à chaque changement |
| Ne pas relancer la même recherche | `distinctUntilChanged` | inutile : un signal ne notifie pas si la valeur est identique |
| Abandonner la requête précédente | `switchMap` | `resource` le fait seul quand sa requête change |

**Côté RxJS**, le pipeline attendu : un `FormControl` et son `valueChanges` (ou `toObservable`
d'un signal), puis `debounceTime(300)`, `distinctUntilChanged`, `switchMap(http)`, et `toSignal` en
sortie. Un indicateur « recherche… » pendant l'appel.

**Côté signals**, le pipeline attendu : un signal `query` alimenté par `(input)` ; un
`httpResource` dont la fonction de requête lit la saisie. Le debounce **n'existe pas** dans
`resource` : il passe par le pont, `toSignal(toObservable(query).pipe(debounceTime(300)), {
initialValue: '' })`, et c'est ce signal débouncé que lit la fonction de requête. Affichez
`isLoading()`, `value()`, `error()`.

Pourquoi `httpResource` et pas `resource` + `fetch` avec `abortSignal` ? Ça marche aussi, mais
`fetch` contourne `HttpClient`, donc l'intercepteur : vous ne verriez ni latence, ni « annulée »
dans le log. Si vous voulez voir l'`abortSignal` à l'œuvre, faites-le en bonus et comparez
l'onglet Réseau (la requête y apparaît *canceled*, puisqu'elle est partie).

**Critère de réussite.** Tapez « Jun », marquez une pause d'environ 400 ms (assez pour passer le
debounce, pas assez pour que le chaos laisse partir la requête), puis « eau » : la liste
n'affiche que Juneau, et le log montre `Jun => annulée`. Dans l'onglet Réseau, il n'y a **qu'une**
requête, `city_like=Juneau` : celle de `Jun` n'est jamais partie. Si `Jun` apparaît en `+NNNms`,
le chaos a tiré un délai court : recommencez. Sans le debounce (essayez en le retirant), vous
verriez une ligne par lettre, chacune annulée par la suivante.

> 📖 [debounceTime](https://rxjs.dev/api/operators/debounceTime) ·
> [switchMap](https://rxjs.dev/api/operators/switchMap) ·
> [toSignal](https://angular.dev/api/core/rxjs-interop/toSignal) ·
> [httpResource](https://angular.dev/guide/http/http-resource)
>
> 💡 **Tester :** ouvrez la console avec le filtre `chaos`, vous devez voir :
>
> ```
> [chaos] GET /api/locations?city_like=Jun => annulée
> [chaos] GET /api/locations?city_like=Juneau +1016ms
> ```

---

## 🧩 S2 — Détail + avis + agent, en parallèle

**Contexte.** La page d'un logement (`/s2/:id`) a besoin de trois choses : le logement, ses avis,
et son agent. Le logement et les avis ne dépendent que de l'`id` ; l'agent dépend du logement
(`location.agentId`). Vous voulez tout lancer au plus tôt. Pour ce scénario, dans `CHAOS_RULES`,
passez l'`errorRate` de la règle `/\/api\/reviews/` à `0` ; S3 le remettra à `0.5`.

| Besoin | RxJS | Signals |
|---|---|---|
| Lancer N appels et attendre les N réponses | `forkJoin({ a, b })` : émet une fois, quand tout est fini | N resources indépendantes, chacune avec son statut |
| Enchaîner un appel qui dépend d'un autre | `switchMap` à l'intérieur du flux concerné | une fonction de requête qui renvoie `undefined` tant que la dépendance n'a pas de valeur (la resource reste `idle`) |
| Savoir que « tout est là » | c'est le comportement par défaut de `forkJoin` | un `computed` sur les `hasValue()` |

**Côté RxJS**, le pipeline attendu : un seul flux, qui part de `toObservable(this.locationId)`
(voir le piège `NG0950` plus haut) et construit un `forkJoin` ; l'enchaînement logement puis agent
**à l'intérieur** ; sortie via `toSignal` ; un squelette tant que `vm()` est `undefined`.

**Côté signals**, le pipeline attendu : trois `httpResource` : `location`, `reviews`, `agent` ; la
fonction de requête de `agent` lit `location` (via `hasValue()`, pas `value()` à sec) ; un
`computed` `ready`. Chaque bloc gère son propre `isLoading()`.

**Critère de réussite.** Côté RxJS : un squelette, puis **tout d'un coup**. Côté signals : le
logement apparaît, puis l'agent, puis les avis (ou dans un autre ordre selon le chaos), et
`ready()` passe à `true` à la fin. **Les deux UX sont valables** : le « tout ou rien » rassure
sur une page de paiement, le « bloc par bloc » est plus réactif sur une fiche. Notez dans la
grille laquelle vous choisiriez, et pourquoi.

> 📖 [forkJoin](https://rxjs.dev/api/index/function/forkJoin) ·
> [resource : params, loader, statuts](https://angular.dev/guide/signals/resource) ·
> [computed](https://angular.dev/guide/signals)
>
> 💡 **Tester :** `/s2/3`, un seul volet affiché, dans la console vous devez voir trois lignes
> `+NNNms` : `locations/3`, `reviews?locationId=3`, `agents/1`. Dans les deux versions, les avis
> partent en même temps que le logement, et `agents/1` part toujours **après** `locations/3`.

---

## 💥 S3 — Erreur partielle : les avis tombent une fois sur deux

**Contexte.** S3 se code dans les deux composants de S2, sur la même page `/s2/:id` : il n'y a
pas de page S3. Remettez `errorRate: 0.5` sur la règle `/\/api\/reviews/`. En production, un
service d'avis en panne ne doit pas vider la fiche logement : le logement et l'agent s'affichent,
les avis montrent une erreur et un bouton « réessayer ».

| Besoin | RxJS | Signals |
|---|---|---|
| Isoler l'erreur d'un flux | `catchError` **sur ce flux**, avant `forkJoin` : l'erreur devient une valeur | l'erreur est déjà locale : `reviews.error()` |
| Relancer seulement ce qui a échoué | il faut sortir le flux du `forkJoin` (ou tout recharger) | `reviews.reload()` |

**Côté RxJS**, le pipeline attendu : `catchError` par flux (sur les avis), placé **avant** d'entrer
dans `forkJoin`. Montrez ce qui se passe sans : une case à cocher qui active ou non le
`catchError` suffit. Un bouton « réessayer » : il recharge tout, et c'est une limite à noter.

**Côté signals**, le pipeline attendu : un bloc `@if (reviews.error())` avec le message et un
bouton qui appelle `reviews.reload()`. Rien d'autre à changer par rapport à S2 : c'est le point.

**Critère de réussite.** Logement et agent affichés, avis en erreur avec « réessayer » ; cliquer
ne relance **que** les avis (une seule ligne `reviews` dans le log, côté signals). Et sans
`catchError` par flux côté RxJS : « tout a échoué », plus rien à l'écran.

> 📖 [catchError](https://rxjs.dev/api/operators/catchError) ·
> [Resource : `error`, `reload`](https://angular.dev/guide/signals/resource)
>
> 💡 **Tester :** dans la console, vous devez voir :
>
> ```
> [chaos] GET /api/locations/3 +303ms
> [chaos] GET /api/reviews?locationId=3 => 503 (après 537 ms)
> [chaos] GET /api/agents/1 +779ms
> ```
>
> puis, après « Réessayer » côté signals, une seule nouvelle ligne :
> `[chaos] GET /api/reviews?locationId=3 => 503 (après 324 ms)` (retentez, c'est pile ou face).

---

## 🏁 S4 — Race condition : clics rapides sur « réserver »

**Contexte.** Un bouton « Réserver » qui fait un `POST /bookings`. L'utilisateur clique trois fois
très vite. Selon l'opérateur, il se passe trois choses différentes, et une seule est acceptable
pour un paiement. Pour que « très vite » soit atteignable à la souris, activez la règle
`/\/api\/bookings/` (1000 à 2000 ms) proposée en commentaire dans `chaos.config.ts`.

| Opérateur | À chaque clic | Trois clics rapides = | Pour quoi |
|---|---|---|---|
| `switchMap` | on **abandonne** l'appel en cours et on relance | 1 réservation, 2 annulées (ou, en prod, 3 réservations côté serveur dont 2 inconnues du client) | une recherche, une navigation |
| `concatMap` | on **met en file**, dans l'ordre | 3 réservations, l'une après l'autre | une sauvegarde automatique, un journal |
| `exhaustMap` | on **ignore** tant que l'appel en cours n'est pas fini | 1 réservation, 2 clics ignorés | un paiement, une double soumission |

**Côté RxJS**, le pipeline attendu : le **même** bouton écrit trois fois, avec un `Subject` de
clics par version et un opérateur différent ; chaque pipeline appelle `book(locationId)` ; un
compteur « clics / confirmées » par version. Ici le `subscribe()` est autorisé (c'est un
événement, pas un état) : pensez `takeUntilDestroyed()`. Ajoutez un bouton « Compter » qui affiche
la taille de `getBookings(locationId)` (sortie `toSignal`, en partant de
`toObservable(this.locationId)`).

**Côté signals**, le pipeline attendu : version A, un `rxResource` dont les `params` changent à
chaque clic (`stream: () => book(...)`) : observez son comportement et relisez la doc de
`resource` : *conçu pour des lectures, pas pour des opérations qui modifient des données*
(« intended for read operations, not operations which perform mutations »). Version B, un signal
`pending` qui désactive le bouton tant que la requête court, avec un `subscribe()` (c'est la
deuxième exception) : l'équivalent manuel d'`exhaustMap`. Et `concatMap` ? Cherchez l'équivalent ;
il n'y en a pas sans écrire une file à la main.

**Critère de réussite.** Après trois clics rapides sur chaque bouton, le compteur et le log
racontent l'histoire ci-dessus, et « Compter » (`GET /bookings?locationId=3`) confirme ce que le
serveur a reçu, une fois les trois lignes `+NNNms` du `concatMap` passées. Vous savez dire **quel
opérateur pour une recherche, un paiement, une sauvegarde automatique**, et vous notez dans la
grille que `resource` se comporte comme `switchMap`.

> 📖 [switchMap](https://rxjs.dev/api/operators/switchMap) ·
> [concatMap](https://rxjs.dev/api/operators/concatMap) ·
> [exhaustMap](https://rxjs.dev/api/operators/exhaustMap) ·
> [rxResource](https://angular.dev/api/core/rxjs-interop/rxResource) ·
> [takeUntilDestroyed](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed)
>
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
> et dans la console, pour `switchMap` : `POST /api/bookings => annulée` deux fois, puis `+1195ms`.
> Entre deux essais : `Ctrl-C` sur l'API, `npm run api:reset`, `npm run api`.

---

## ⏱️ S5 — Polling de disponibilité toutes les 3 s, arrêté en quittant la page

**Contexte.** La disponibilité d'un logement change côté serveur (un autre agent réserve). Vous
interrogez `GET /availability/:id` toutes les 3 secondes tant que la page est ouverte, et **plus
du tout** une fois qu'on l'a quittée.

| Besoin | RxJS | Signals |
|---|---|---|
| Un tick toutes les 3 s | `timer(0, 3000)` ou `interval(3000)` | `setInterval` à la main |
| Un appel par tick, sans empiler si le précédent traîne | `switchMap(http)` | `reload()` (renvoie `false` et ne fait rien si un chargement est en cours) |
| Arrêter à la destruction | `takeUntilDestroyed()` (ou `toSignal`, qui se désabonne) | `onCleanup` dans un `effect`, à ne pas oublier |

**Côté RxJS**, le pipeline attendu : `timer(0, 3000)`, puis `switchMap(getAvailability)`. Pour la
sortie, deux options : `toSignal` (qui se désabonne tout seul), ou, c'est la première exception
à la règle, un `subscribe()` fermé par `takeUntilDestroyed()`, pour voir l'opérateur à l'œuvre.
Affichez le nombre d'appels et l'heure du dernier.

**Côté signals**, le pipeline attendu : d'abord la tentative « signals seuls » : un `rxResource`
plus un `effect` qui pose un `setInterval` appelant `reload()`, avec `onCleanup(clearInterval)`.
Faites-la marcher, puis répondez : que lit cet `effect` comme signal ? Comment feriez-vous une
pause, un repli progressif (backoff), un « dernier gagne » ? Ensuite, le pont : un `rxResource`
dont le `stream` est `timer(0, 3000).pipe(switchMap(http))`. Gardez les deux variantes, chacune
derrière un `@if` (un bouton radio suffit), pour les comparer dans la grille.

**Critère de réussite.** Changez `available` (`PATCH` ci-dessous, ou éditez `api/db.json`) :
l'affichage suit au tick suivant, soit moins de 3 s plus la latence du chaos. Naviguez vers S6 :
**plus aucune ligne** `availability` dans le log, ni dans l'onglet Réseau, 10 secondes plus tard.

> 📖 [timer](https://rxjs.dev/api/index/function/timer) ·
> [takeUntilDestroyed](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed) ·
> [effect et onCleanup](https://angular.dev/guide/signals) ·
> [rxResource](https://angular.dev/api/core/rxjs-interop/rxResource)
>
> 💡 **Tester :** ouvrez un troisième terminal et lancez :
>
> ```bash
> curl -s -X PATCH -H 'Content-Type: application/json' -d '{"available":false}' http://localhost:3000/availability/3
> ```
>
> La page passe de « Disponible : oui » à « non » au tick suivant. Dans la console, une ligne
> `[chaos] GET /api/availability/3 +NNNms` toutes les 3 s environ ; une `=> annulée` apparaît quand
> vous détruisez un volet en pleine requête (bascule A/B, changement de volet) ; puis silence
> après avoir quitté la page.

---

## 🧮 S6 — Filtres combinés sur des données déjà chargées

**Contexte.** La liste est chargée une fois. Trois critères, ville (texte, insensible à la
casse), prix max (nombre), tri (nom ou prix), se combinent **sans nouvel appel HTTP**. C'est le
scénario « témoin » : il n'y a pas d'asynchrone dans la combinaison elle-même.

| Besoin | RxJS | Signals |
|---|---|---|
| Combiner trois sources qui changent indépendamment | `combineLatest([...])` + `map` ; attention, chaque source doit avoir émis une fois (`startWith`) | un `computed` qui lit trois signals |
| Le chargement initial | un flux de plus dans le `combineLatest` | `toSignal(http)` ou `httpResource`, une fois |

**Côté RxJS**, le pipeline attendu : trois `FormControl` ; `combineLatest` de leurs `valueChanges`
et de la liste ; `map` qui filtre et trie ; `toSignal`.

**Côté signals**, le pipeline attendu : trois signals, un `computed`. Liez les champs comme vous
voulez (`(input)` vers `signal.set()`, ou `[(ngModel)]` sur un signal). Comptez les lignes.

**Critère de réussite.** Les deux volets réagissent pareil (tapez « oak », prix max 1400, tri par
prix : deux résultats, dans l'ordre 890 puis 1390). L'onglet Réseau ne montre **aucune** requête
pendant la saisie. Le volet signals tient en quatre lignes de logique.

> 📖 [combineLatest](https://rxjs.dev/api/index/function/combineLatest) ·
> [startWith](https://rxjs.dev/api/operators/startWith) ·
> [computed](https://angular.dev/guide/signals)
>
> 💡 **Tester :** après la saisie, les deux listes affichent :
>
> ```
> Seriously Safe Towns — Oakland — 890 $
> Hopeful Housing Solutions — Oakland — 1390 $
> ```

---

## 📋 Livrable : la grille de décision

Ouvrez [GRILLE.md](GRILLE.md). Sept lignes (une situation par ligne), trois colonnes à remplir
(RxJS, Signals, Pont) plus une colonne « Vu dans » déjà renseignée, puis deux questions : la
« règle de sortie », en une phrase, que vous appliquerez sur votre projet, et ce qui change sur un
projet Angular 20. Chaque case : quelques mots, de quoi tenir trente secondes à l'oral. La ligne
« formulaire => état » n'est couverte que côté RxJS par S1 et S6 (`valueChanges`) : remplissez la
colonne Signals avec ce que vous savez, on la reprend demain (J2) avec les Signal Forms.

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
// 🐛 s6-rxjs.ts — le tri « fonctionne », mais le volet d'à côté change aussi
readonly filtered = toSignal(
  combineLatest([list$, sort$]).pipe(
    map(([list, sort]) => list.sort((a, b) => (sort === 'price' ? a.price - b.price : 0))),
  ),
);
```

| | |
|---|---|
| **Symptôme** | trier dans un volet trie aussi dans l'autre ; un `computed` ne se recalcule pas alors que « la liste a changé » ; en test, l'ordre d'exécution change le résultat. |
| **Cause** | `Array.prototype.sort` **trie en place** : le `map` a muté le tableau reçu, qui est partagé par tous ceux qui ont reçu la même référence (l'autre volet, un `computed`, un store). Les signals et `OnPush` comparent par référence : une mutation est invisible pour eux. |
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
