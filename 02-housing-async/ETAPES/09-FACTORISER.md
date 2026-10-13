# 🧱 09 — Factoriser : `ResourceService<I, T>`, puis le contrat v2

> **Scénario à réaliser en autonomie, en deux parties.** Dans la partie A, vous remplacez
> `HousingService` et ses neuf méthodes presque identiques par une classe générique,
> `ResourceService<I, T>`, que vous écrivez à partir d'un squelette ; les six petites classes qui
> en héritent sont fournies. Dans la partie B, le back change de contrat : chaque réponse arrive
> enveloppée dans `{ data, meta }`. Si la partie A est réussie, un seul fichier change. Le code
> complet est dans `solution/src/app/api/`, à n'ouvrir qu'en cas de blocage.

## ✨ Objectifs

- Écrire une classe abstraite générique, avec des contraintes de type (`I extends number | string`,
  `T extends { id?: I }`) qui disent ce que la classe attend.
- Garder des **Observables** pour les méthodes, et ajouter les fabriques `httpResource` pour le côté
  signals, au même endroit.
- Choisir où vit l'adresse de l'API : un `InjectionToken` plutôt qu'un import d'`environment`.
- Absorber un changement de contrat du back dans **un seul fichier**, avec `map` côté Observable
  et l'option `parse` de `httpResource` côté signals.

## Partie A — Une classe générique pour toutes les ressources

### 🔍 A.1 — Ce qui se répète

Ouvrez `src/app/housing.service.ts` : neuf méthodes, et presque toutes ont la même forme,
`` this.http.get<T>(`${base}/ressource/…`) ``. Les volets signals de la recherche et de la fiche
détail répètent les mêmes adresses, avec `environment.apiUrl`, parce qu'un `httpResource` prend une
URL et pas une méthode du service. Et chaque nouvelle ressource ajouterait ses méthodes au même
service.

Une ressource json-server se manipule pourtant toujours de la même façon : lister (avec des
filtres), lire un élément, en créer un, en modifier un. On écrit donc ce CRUD une fois, dans une
classe abstraite, et chaque ressource n'en garde que ce qui lui est propre. À la fin de la partie
A, le dossier `src/app/api/` contiendra sept fichiers, et `housing.service.ts` aura disparu :

```
src/app/api/
├── resource.service.ts        <- à vous : API_URL, ListParams, ResourceService<I, T>
├── locations.service.ts       <- fourni : + searchByCity()
├── reviews.service.ts         <- fourni
├── agents.service.ts          <- fourni
├── availability.service.ts    <- fourni
├── bookings.service.ts        <- fourni : + book()
└── applications.service.ts    <- fourni : rien de plus que le CRUD
```

### ⚖️ A.2 — Les choix de conception

Avant d'écrire la classe, voici les décisions qu'elle encode, et pourquoi chacune a été prise :

| Choix | Pourquoi |
|---|---|
| `I extends number \| string` | le type de l'identifiant : `number` avec json-server, `string` pour une API qui utilise des UUID. La contrainte refuse un `boolean` ou un objet |
| `T extends { id?: I }` | le modèle porte un `id` du bon type. Optionnel, car un objet qu'on va **créer** n'en a pas encore : `create(item: Omit<T, 'id'>)` |
| des méthodes qui renvoient des `Observable`, pas des `Promise` | les composants les **composent** : `exhaustMap` et `concatMap` sur le `POST` de la réservation, `switchMap` sur la recherche, `forkJoin` sur la fiche. Une Promise part dès sa création et ne s'annule pas : la recherche ne pourrait plus abandonner « Jun », et le log ne montrerait plus jamais « annulée » |
| `getResource()` et `listResource()` à côté | le côté signals obtient un `httpResource` **sans connaître l'URL** : la duplication des volets signals disparaît |
| l'adresse dans un `InjectionToken`, `API_URL` | la classe ne dépend plus d'un fichier propre à cette application ; un test fournit une autre adresse avec `{ provide: API_URL, useValue: '…' }`, et une bibliothèque partagée pourrait l'utiliser telle quelle. Importer `environment` directement marcherait aussi, au prix de ces deux possibilités |
| `path` abstrait, et `url` en **getter** | chaque sous-classe dit seulement `path = 'reviews'`. Un **champ** `url` calculé dans la classe mère vaudrait `/api/undefined` : les champs de la classe mère sont initialisés **avant** ceux de la sous-classe |

Le dernier piège se vérifie en quelques lignes. Enregistrez ce script sous `t.ts`, hors du
projet, puis lancez `node t.ts` (Node 24 exécute directement un fichier TypeScript simple) :

```ts
abstract class Base {
  protected readonly apiUrl = '/api';
  protected abstract readonly path: string;
  readonly urlField = `${this.apiUrl}/${this.path}`;
  get urlGetter() { return `${this.apiUrl}/${this.path}`; }
}
class Reviews extends Base { protected readonly path = 'reviews'; }
const r = new Reviews();
console.log('champ :', r.urlField, '| getter :', r.urlGetter);
```

Node affiche `champ : /api/undefined | getter : /api/reviews` : le champ a été calculé avant que
`Reviews` ne définisse `path`, le getter est évalué à la lecture.

> ℹ️ **Interface plutôt que classe pour les modèles.** `HousingLocationInfo`, `Review`… restent des
> `interface`. Le JSON reçu n'est **jamais** une instance : `http.get<Review>(…)` est une
> affirmation de type, pas une construction. Si `Review` était une classe avec une méthode
> `stars()`, le code compilerait, et `review.stars()` lèverait `TypeError` à l'exécution ; de
> même, `review instanceof Review` vaudrait `false`. Une interface décrit la forme des données
> sans rien promettre de plus, et ne pèse rien dans le bundle.

### 🚧 A.3 — Écrire `ResourceService`

Créez le dossier `src/app/api/` et, dedans, le fichier `resource.service.ts`. Les signatures sont
données, car les six classes fournies s'appuient dessus ; les corps sont à écrire.

🚧 **À compléter :**

```ts
import { InjectionToken, inject } from '@angular/core';
import { HttpClient, HttpResourceRef, httpResource } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** L'adresse de base de l'API : '/api' en développement, grâce au proxy. */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});

/** Les paramètres de requête d'une liste, par exemple `{ locationId: 3 }` ou `{ city_like: 'chi' }`. */
export type ListParams = Record<string, string | number | boolean>;

export abstract class ResourceService<I extends number | string, T extends { id?: I }> {
  protected readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  /** Le segment de la ressource dans l'URL, par exemple `'locations'`. */
  protected abstract readonly path: string;

  protected get url(): string {
    // TODO 1 : l'adresse de la ressource, par exemple '/api/locations'
  }

  list(params: ListParams = {}): Observable<T[]> {
    // TODO 2 : GET sur this.url, avec params en query string
  }

  get(id: I): Observable<T> {
    // TODO 3 : GET sur this.url/id
  }

  create(item: Omit<T, 'id'>): Observable<T> {
    // TODO 4 : POST de item sur this.url
  }

  patch(id: I, changes: Partial<T>): Observable<T> {
    // TODO 5 : PATCH de changes sur this.url/id
  }

  /** Un élément, rechargé quand `id()` change ; reste `idle` tant que `id()` vaut `undefined`. */
  getResource(id: () => I | undefined): HttpResourceRef<T | undefined> {
    // TODO 6 : httpResource<T>(() => …) qui renvoie undefined si id() vaut undefined, sinon l'URL de l'élément
  }

  /** Une liste, rechargée quand `params()` change ; reste `idle` tant que `params()` vaut `undefined`. */
  listResource(params: () => ListParams | undefined): HttpResourceRef<T[] | undefined> {
    // TODO 7 : httpResource<T[]>(() => …) qui renvoie undefined, ou { url: this.url, params: … }
  }
}
```

Le build reste rouge tant que les corps sont vides : chaque méthode déclare un type de retour.
Quelques indices pour les sept `TODO` :

- `TODO 1` est un gabarit de chaîne avec `this.apiUrl` et `this.path`. Les `TODO 2` à `5` tiennent
  chacun en une ligne `return this.http.…<T>(…)`, comme dans `housing.service.ts`. `HttpClient` accepte directement un `ListParams` dans `{ params }`.
- Pour les deux fabriques, lisez le signal **une fois** dans une constante
  (`const value = id();`), puis testez `value === undefined` : un `id` qui vaut `0` est un
  identifiant valide, un simple `value ? … : undefined` le prendrait pour « pas d'id ».
- Ne donnez pas de `defaultValue: []` à `listResource`. `hasValue()` renvoie `true` dès que la
  valeur n'est pas `undefined` : avec `[]` par défaut, la resource des avis « aurait une valeur »
  pendant son chargement, et le `ready()` de la fiche détail passerait à `true` trop tôt.
- `httpResource` doit être appelé dans un **contexte d'injection**. C'est le cas si un composant
  appelle `getResource()` dans l'initialisation d'un champ : la resource appartient alors au
  composant, et elle est détruite avec lui, même si c'est le service qui l'a fabriquée.

> 📖 [Generics (TypeScript)](https://www.typescriptlang.org/docs/handbook/2/generics.html) ·
> [Classes abstraites (TypeScript)](https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members) ·
> [InjectionToken](https://angular.dev/api/core/InjectionToken) ·
> [httpResource](https://angular.dev/api/common/http/httpResource) ·
> [Contexte d'injection](https://angular.dev/guide/di/dependency-injection-context)

### 📦 A.4 — Les six sous-classes (fournies)

Chaque ressource hérite de `ResourceService` et ne déclare que son `path`, plus ce qui lui est
propre. Les six fichiers sont dans `assets/services/` :

| Fichier | Ce qu'il contient |
|---|---|
| [`locations.service.ts`](../assets/services/locations.service.ts) | `LocationsService extends ResourceService<number, HousingLocationInfo>`, `path = 'locations'`, plus `searchByCity(query)` (un `list({ city_like: query })`) |
| [`reviews.service.ts`](../assets/services/reviews.service.ts) | `ReviewsService`, `path = 'reviews'`, rien d'autre : les avis d'un logement sont un `list({ locationId })` |
| [`agents.service.ts`](../assets/services/agents.service.ts) | `AgentsService`, `path = 'agents'`, rien d'autre |
| [`availability.service.ts`](../assets/services/availability.service.ts) | `AvailabilityService`, `path = 'availability'` ; l'`id` d'une disponibilité vaut le `locationId`, donc `get(locationId)` suffit |
| [`bookings.service.ts`](../assets/services/bookings.service.ts) | `BookingsService`, `path = 'bookings'`, plus `book(locationId)`, un `create({ locationId, at })` avec la date du moment |
| [`applications.service.ts`](../assets/services/applications.service.ts) | `ApplicationsService extends ResourceService<number, Application>`, `path = 'applications'`, rien d'autre : le dossier part avec `create(dossier)` |

Copiez-les à côté de votre `resource.service.ts`, depuis la racine du projet :

```bash
cp ../02-housing-async/assets/services/*.service.ts src/app/api/
```

Les dossiers entrent dans le moule sans rien de spécifique, et c'est ce qui justifie de ne pas leur
garder un service à part. `Application` déclare `id?: number`, donc elle respecte
`T extends { id?: I }` avec `I = number`. Et `create(item: Omit<Application, 'id'>)` accepte
exactement l'objet que les deux formulaires envoient, `{ locationId, ...dossier }`, qui n'a pas
encore d'`id`. L'ancienne `submitApplication(application)` n'était qu'un `POST` sur la collection :
c'est la définition de `create`.

Chacun est un service `@Injectable({ providedIn: 'root' })` ordinaire : un composant l'obtient
avec `inject(ReviewsService)`. Le plus court des six montre à quoi se réduit une ressource :

```ts
@Injectable({ providedIn: 'root' })
export class ReviewsService extends ResourceService<number, Review> {
  protected readonly path = 'reviews';
}
```

### 🔌 A.5 — Brancher les composants, puis supprimer `HousingService`

Il reste à remplacer `HousingService` partout où il est injecté. Le comportement ne change pas,
seuls l'injection et l'appel changent. Dans chaque fichier, remplacez l'import et
`inject(HousingService)` par le service indiqué, puis l'appel, selon ce tableau :

| Fichier | Service injecté | Avant => après |
|---|---|---|
| `home/home.ts`, `s6-filters/s6-rxjs.ts`, `s6-filters/s6-signals.ts` | `LocationsService` | `getAllHousingLocations()` => `list()` |
| `details/details.ts` | `LocationsService` | `getHousingLocationById(id)` => `get(id)` |
| `application-form/application-form.ts`, `application-form/application-form-signals.ts` | `ApplicationsService` | `submitApplication(dossier)` => `create(dossier)` |
| `s1-search/s1-rxjs.ts` | `LocationsService` | `searchByCity(q)`, inchangé |
| `s2-details/s2-rxjs.ts` | `LocationsService`, `ReviewsService`, `AgentsService` | `getHousingLocationById(id)` => `get(id)` ; `getReviews(id)` => `list({ locationId: id })` ; `getAgent(agentId)` => `get(agentId)` |
| `s4-booking/s4-rxjs.ts`, `s4-booking/s4-signals.ts` | `BookingsService` | `book(id)`, inchangé ; `getBookings(id)` => `list({ locationId: id })` |
| `s5-polling/s5-rxjs.ts`, `s5-polling/s5-signals.ts` (ses deux versions, A et B, injectent chacune le service) | `AvailabilityService` | `getAvailability(id)` => `get(id)` |

Les services sont dans `src/app/api/` : depuis un composant d'expérience, importez-les avec
`'../../api/locations.service'`, depuis `home/`, `details/` ou `application-form/` avec
`'../api/locations.service'` (ou `'../api/applications.service'`).
Nommez les champs d'après le service (`locationsService`, `reviewsService`…) : dans `s2-rxjs.ts`,
un champ `reviews` entrerait en collision de sens avec `Vm.reviews`. Dans `home.ts`, le champ du
lab Init porte aussi un type explicite (`housingService: HousingService = inject(HousingService)`) :
remplacez la ligne entière par `locationsService = inject(LocationsService)`, comme dans
`details.ts`. Dans les deux composants du dossier, le champ est privé : écrivez
`private readonly applicationsService = inject(ApplicationsService);`.

Les deux volets signals de la recherche et de la fiche changent davantage, puisqu'ils
n'écrivent plus d'URL. Dans `s1-search/s1-signals.ts`, retirez les imports de `httpResource`, de
`HousingLocationInfo` et d'`environment`, importez `inject` et `LocationsService`, et remplacez la
déclaration de `results` par celle-ci :

```ts
  readonly results = inject(LocationsService).listResource(() => ({
    city_like: this.debouncedQuery(),
  }));
```

Dans `s2-details/s2-signals.ts`, de la même façon, les trois resources deviennent trois appels
aux fabriques ; les imports de `httpResource`, des trois modèles et d'`environment` disparaissent
au profit de `inject` et des trois services :

```ts
  readonly location = inject(LocationsService).getResource(() => this.locationId());

  readonly reviews = inject(ReviewsService).listResource(() => ({ locationId: this.locationId() }));

  readonly agent = inject(AgentsService).getResource(() =>
    this.location.hasValue() ? this.location.value().agentId : undefined,
  );
```

Les templates des deux volets ne changent pas. Dans la recherche, `results.value()` vaut désormais
`undefined` pendant le chargement au lieu de `[]` : `@for` accepte `undefined` et affiche le bloc
`@empty`, comme avant.

Quand plus aucun fichier n'importe `HousingService`, supprimez `src/app/housing.service.ts`.

> 💡 **Tester :** `grep -rn "HousingService\|environment" src/app` ne trouve plus que
> des lignes de `api/resource.service.ts` (l'import d'`environment` et la `factory` d'`API_URL`).
> Et `npm run build` se termine par `Output location: …/dist/homes`.

### ✅ Critère de réussite de la partie A

Les six expériences et l'application du tutoriel se comportent **exactement** comme avant, avec
les mêmes URL dans le log du chaos : dix cartes à l'accueil, `Monthly rent: 1100 $` sur
`/details/3`, « Juneau » seul après « Jun » puis « eau » sur les deux volets de la recherche, la
fiche complète sur `/s2/3` avec `ready() = true`, `1 / 3 / 1` réservations confirmées et
`5 réservation(s) en base` sur une base fraîche, la disponibilité qui suit le `PATCH`,
« Oakland 890 $, Oakland 1390 $ » dans les filtres, et le dossier, dans ses deux versions, qui
logue `POST /api/applications => 201` puis affiche `Application #… received.`.

Avant la partie B, enregistrez cet état pour pouvoir le comparer ensuite, avec git. Le projet créé
par `ng new` est un dépôt git ; une copie de `02-housing-init/solution` ne l'est pas : si
`git status` répond `not a git repository`, lancez d'abord `git init` à la racine de `homes/`.
Faites ensuite un commit : `git add -A` puis `git commit -m "09 partie A"`.

## Partie B — Le back change de contrat

### 📜 B.1 — Le nouveau contrat

L'équipe back annonce une version 2 de l'API : chaque réponse est désormais **enveloppée**. La
donnée est dans `data`, et `meta` décrit la liste quand c'en est une. Voici ce que renvoient trois
requêtes typiques :

```text
GET /locations?_page=2&_limit=4  ->  { "data": [ …4 logements… ], "meta": { "total": 10, "page": 2, "limit": 4 } }
GET /locations                   ->  { "data": [ …10 logements… ], "meta": { "total": 10, "page": 1, "limit": 10 } }
GET /locations/3                 ->  { "data": { "id": 3, "name": "Homesteady Housing", … }, "meta": null }
```

Le tableau suivant fixe ce que vaut `meta` dans chaque cas, y compris pour un élément seul :

| Cas | `data` | `meta` |
|---|---|---|
| une liste paginée (`_page`, `_limit`) | la page demandée | `total` (tous les éléments qui correspondent aux filtres), `page`, `limit` |
| une liste sans pagination | toute la liste | `total` = nombre d'éléments, `page: 1`, `limit` = `total` : la même forme, sans cas particulier côté client |
| un élément seul, une création, une modification | l'objet | `null` : il n'y a pas de collection à décrire |
| une erreur (404…) | `null` | `null`, avec le même statut HTTP qu'avant |

### 🛠️ B.2 — Le serveur v2 (fourni)

Ce serveur est fourni : [`assets/api/server.js`](../assets/api/server.js). Il utilise json-server
0.17.4 **comme un module** Express plutôt qu'en ligne de commande : il garde son routeur et sa
base `api/db.json`, et ne remplace que la fonction qui écrit la réponse. Copiez-le dans le dossier
`api/` du projet :

```bash
cp ../02-housing-async/assets/api/server.js api/server.js
```

Dans `package.json`, ajoutez un script `api:v2` juste après `"api"`, sans oublier la virgule :

```json
    "api": "json-server --watch api/db.json --port 3000",
    "api:v2": "node api/server.js",
```

Le cœur du fichier tient en quelques morceaux, détaillés dans le tableau qui suit :

| Morceau | Rôle |
|---|---|
| `jsonServer.create()`, `jsonServer.defaults()` | une application Express avec les middlewares de la ligne de commande (CORS, journal des requêtes, fichiers de `public/`) |
| `jsonServer.router(path.join(__dirname, 'db.json'))` | le même routeur que `npm run api`, sur la même base : `api:reset` reste valable |
| `router.render = (req, res) => …` | appelée par json-server après chaque route, avec le résultat dans `res.locals.data` ; par défaut, elle fait `res.jsonp(res.locals.data)` (lu dans `node_modules/json-server/lib/server/router/index.js`) |
| `res.get('X-Total-Count')` | le total avant pagination ; json-server ne pose cet en-tête que si la requête contient `_page`, `_limit` ou `_end` : sinon, le total est la longueur de `data` |
| `new URL(req.originalUrl, …).searchParams` | voir le piège ci-dessous |

⚠️ **Piège : `meta.page` vaut toujours 1.**

- *Symptôme :* une première version qui lisait `req.query._page` renvoyait bien les logements 4
  à 7 pour `?_page=2&_limit=4`, mais avec `"meta": { "total": 10, "page": 1, "limit": 10 }`.
- *Cause :* avant d'appeler `render`, le routeur de json-server **retire** de `req.query` les
  paramètres qu'il a consommés : `_limit` explicitement, et `_page` parce qu'aucun logement n'a de
  champ `_page` (lu dans `router/plural.js`).
- *Correctif :* relire les paramètres dans l'URL d'origine, que json-server ne touche pas :
  `new URL(req.originalUrl, 'http://localhost').searchParams.get('_page')`.

Ce serveur n'a pas l'option `--watch` : une modification de `db.json` à la main n'est vue qu'au
redémarrage. Le geste de remise à zéro reste le même, avec `npm run api:v2` à la place de
`npm run api`.

> 💡 **Tester :** dans le terminal 1, `Ctrl-C` puis `npm run api:v2`, qui affiche
> `API v2 { data, meta } sur http://localhost:3000`. Dans le terminal 3,
> `curl -s "http://localhost:3000/locations?_page=2&_limit=4"` renvoie les logements 4 à 7 et
> `"meta": { "total": 10, "page": 2, "limit": 4 }` ; `curl -si http://localhost:3000/locations/99`
> affiche `HTTP/1.1 404 Not Found`, puis `{ "data": null, "meta": null }`.

> 📖 [json-server 0.17.4 : utilisation comme module](https://github.com/typicode/json-server/tree/v0.17.4#module)

### 💥 B.3 — Voir l'application casser

Le serveur v2 tourne, l'application n'a pas changé : rechargez l'accueil. Aucune carte ne
s'affiche, et la console montre :

```
[chaos] GET /api/locations +1340ms
GET /api/locations => 200 (1359 ms)
ERROR TypeError: newCollection[Symbol.iterator] is not a function
```

La requête a réussi (`200`), mais le `@for` de l'accueil a reçu `{ data, meta }` au lieu d'un
tableau. Le typage n'a rien vu : `http.get<HousingLocationInfo[]>` affirme une forme, il ne la
vérifie pas (c'est la remarque « interface plutôt que classe » de la partie A). Toutes les
expériences sont touchées de la même façon.

### 🚧 B.4 — Adapter `ResourceService`, et rien d'autre

Tous les appels HTTP passent maintenant par `ResourceService` : c'est le seul endroit à adapter.
Il y a deux chemins à traiter.

- **Les Observables** (`list`, `get`, `create`, `patch`) : on demande à `HttpClient` le type réel,
  `ApiResponse<T>`, puis on ne garde que `data` avec l'opérateur `map`.
- **Les resources** (`getResource`, `listResource`) : `httpResource` n'est pas un Observable, on
  ne peut pas lui ajouter de `map`. Il a une option prévue pour cela, `parse`. Sa signature,
  extraite de `node_modules/@angular/common/types/http.d.ts`, est la suivante :

```ts
interface HttpResourceOptions<TResult, TRaw> {
    /**
     * Transform the result of the HTTP request before it's delivered to the resource.
     * `parse` receives the value from the HTTP layer as its raw type (e.g. as `unknown` for JSON data).
     */
    parse?: (value: TRaw) => TResult;
    defaultValue?: NoInfer<TResult>;
    // …
}
```

Pour du JSON, `TRaw` vaut `unknown` : `parse` reçoit la réponse brute, et ce qu'elle renvoie
devient la valeur de la resource. C'est aussi l'endroit prévu pour valider une réponse avec une
bibliothèque de schémas comme Zod.

Dans `src/app/api/resource.service.ts`, complétez donc les cinq `TODO` suivants. Le reste du
fichier ne bouge pas.

🚧 **À compléter :**

```ts
import { Observable } from 'rxjs';   // TODO 1 : ajouter map à l'import

// TODO 2 : sous ListParams, déclarer et exporter les deux types du contrat
export interface ApiMeta {
  // total, page, limit : des nombres
}
export interface ApiResponse<T> {
  // data : T ; meta : ApiMeta ou null
}

// TODO 3 : une petite fonction unwrap<T>(response: ApiResponse<T>): T, qui renvoie response.data

// TODO 4 : dans list, get, create et patch, demander ApiResponse<…> à HttpClient, puis .pipe(map(unwrap))
//          exemple : this.http.get<ApiResponse<T[]>>(this.url, { params }).pipe(map(unwrap))

// TODO 5 : dans getResource et listResource, passer un 2e argument à httpResource :
//          { parse: (raw) => unwrap(raw as ApiResponse<T>) }   (ou ApiResponse<T[]> pour la liste)
```

La conversion `raw as ApiResponse<T>` est la même affirmation de type que `http.get<T>` : rien
n'est vérifié à l'exécution. Une seule fonction `unwrap` sert aux deux chemins, si bien que le
jour où le contrat change encore, il n'y a qu'une ligne à modifier.

> 📖 [httpResource, option `parse`](https://angular.dev/guide/http/http-resource) ·
> [map](https://rxjs.dev/api/operators/map)

### ✅ Critère de réussite de la partie B

Avec `npm run api:v2` dans le terminal 1, les six expériences et l'application du tutoriel se
comportent comme avec `npm run api` à la fin de la partie A : mêmes écrans, mêmes lignes dans le
log du chaos, mêmes `annulée` dans la recherche, mêmes `5 réservation(s) en base`, même passage à
`Disponible : non` après le `PATCH` (dont la réponse `curl` est maintenant enveloppée), et la
même confirmation après l'envoi du dossier : sur une base remise à zéro, l'API v2 répond
`{ "data": { …, "id": 1 }, "meta": null }`, et c'est `create()` qui en extrait le dossier, si bien que `created.id` vaut bien `1`.

La preuve que le changement est contenu se lit dans git :

```bash
git diff --stat -- src
```

Git répond par une seule ligne de fichier, celle de `resource.service.ts` :

```
 src/app/api/resource.service.ts | 50 ++++++++++++++++++++++++++++++-----------
 1 file changed, 37 insertions(+), 13 deletions(-)
```

Les chiffres varient selon votre écriture, pas le nombre de fichiers. Hors de `src/`,
`git status` montre `package.json` (le script `api:v2`), le nouveau `api/server.js`, et
`api/db.json` si vous avez réservé entre-temps (json-server y écrit ; `npm run api:reset`, API
arrêtée, le remet dans son état de départ).

> ⚠️ Votre application parle maintenant le contrat v2 : avec `npm run api`, elle casse à son
> tour, autrement qu'en B.3. `unwrap` cherche un `data` qui n'existe pas et renvoie `undefined` :
> les listes restent vides sans erreur, et la fiche détail RxJS affiche
> `Tout a échoué : TypeError: Cannot read properties of undefined (reading 'agentId')`. C'est le
> sens d'un changement de contrat : le client suit le serveur. La solution du lab est dans cet
> état, et se lance avec `npm run api:v2`.

## ✅ Bonus — Paginer l'accueil avec `meta`

`meta` n'a servi à rien jusqu'ici : `unwrap` le jette. Pour paginer l'accueil, il faut au
contraire le garder. Quelques pistes, sans code à trou :

- ajoutez à `ResourceService` une méthode `page(params, page, limit)` qui renvoie
  `Observable<ApiResponse<T[]>>` **sans** `map(unwrap)`, en ajoutant `_page` et `_limit` aux
  paramètres ;
- dans `Home`, deux signals, `filterText` et `page`, et un `rxResource` dont les `params` lisent
  les deux et dont le `stream` appelle `page({ city_like: … }, page, 4)` : le filtre par ville
  passe côté serveur, sinon il ne filtrerait que la page affichée ;
- des `computed` pour la liste (`value()?.data ?? []`), le total et la dernière page, et deux
  boutons « Précédent » / « Suivant » désactivés aux bornes ; une recherche remet `page` à 1.

Sur la base de départ, l'accueil affiche alors `Page 1 / 3 (10 logements)` et quatre cartes, puis
deux cartes en page 3, et le log montre
`[chaos] GET /api/locations?city_like=&_page=2&_limit=4 +1213ms`. Une recherche « chi » donne
`Page 1 / 1 (2 logements)`. Une version est dans `solution/src/app/home/home.ts`.

## Récap

- Une classe abstraite générique écrit le CRUD une fois ; chaque ressource ne déclare que son
  `path` et ses méthodes propres. Les contraintes `I extends number | string` et
  `T extends { id?: I }` documentent ce que la classe attend, et le compilateur les vérifie.
- Des **Observables** pour les méthodes, parce que les composants les composent et les annulent ;
  des fabriques `httpResource` au même endroit pour le côté signals, sans URL dans les composants.
- Les modèles restent des **interfaces** : le JSON n'est jamais une instance de classe.
- Un changement de contrat se traite à **un** endroit : `map(unwrap)` pour les Observables,
  `parse` pour les resources. C'est le bénéfice concret de la factorisation.

---

➡️ S'il vous reste du temps : [10 — Bonus : trois pièges RxJS](10-BONUS.md), puis retour au
[débrief final : la grille de décision](../README.md).
