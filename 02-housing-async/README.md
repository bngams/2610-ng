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
└── scenarios.css                      <- la mise en page des pages de scénario                  (section « Comment une expérience est construite »)
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

## 🌪️ Étape 0 — Mise sous pression

Rien de ce qui suit n'est un exercice : ce code vous est **donné**, parce que vous l'avez vu ce
matin, et parce que les scénarios n'ont d'intérêt que sur une API lente et faillible. Vous le
copiez, vous le lisez avec les tableaux qui l'accompagnent, et vous vérifiez le critère de
réussite en bas de la section. Il y a six gestes.

### 0.1 — L'API enrichie

Le tutoriel ne connaît que `/locations`. Les scénarios ont besoin d'avis à charger en parallèle
(S2), d'un agent qui dépend du logement (S2), d'une disponibilité qui change (S5), de
réservations à créer (S4) et d'un prix à filtrer (S6). Remplacez `api/db.json` par la base
enrichie, gardez-en une copie de référence, et ajoutez un script de remise à zéro dans
`package.json` :

```bash
cp ../02-housing-async/assets/api/db.json api/db.json
cp ../02-housing-async/assets/api/db.seed.json api/db.seed.json
```

```json
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "api": "json-server --watch api/db.json --port 3000",
    "api:reset": "node -e \"require('fs').copyFileSync('api/db.seed.json','api/db.json')\""
  },
```

json-server est épinglé en **0.17.4** : c'est cette branche qui supporte le filtre `_like` (regex,
insensible à la casse) dont S1 a besoin ; la branche 1.x a changé les opérateurs. Voici les
endpoints, et le scénario qui s'en sert :

| Endpoint | Rôle | Scénario |
|---|---|---|
| `GET /locations` | les 10 logements, avec trois champs en plus : `price`, `type`, `agentId` | tous |
| `GET /locations?city_like=chi` | recherche par ville, côté serveur | S1 |
| `GET /locations/:id` | un logement | S2 |
| `GET /reviews?locationId=:id` | 3 à 5 avis par logement | S2, S3 |
| `GET /agents/:id` | l'agent référencé par `location.agentId` | S2 |
| `GET /availability/:locationId` | `{ available: boolean }` (l'`id` vaut le `locationId`) | S5 |
| `PATCH /availability/:locationId` | pour basculer `available` sans éditer le fichier | S5 |
| `POST /bookings` | crée une réservation `{ locationId, at }` | S4 |
| `GET /bookings?locationId=:id` | pour compter ce que le serveur a vraiment reçu | S4 |

Relancez l'API (`Ctrl-C` puis `npm run api` dans le terminal 1).

> 💡 **Tester :** la bannière de json-server liste maintenant cinq ressources :
>
> ```
>   Resources
>   http://localhost:3000/locations
>   http://localhost:3000/reviews
>   http://localhost:3000/agents
>   http://localhost:3000/availability
>   http://localhost:3000/bookings
> ```
>
> Et dans le terminal 3 : `curl -s "http://localhost:3000/locations?city_like=chi" | grep '"city"'`
> renvoie deux lignes `"city": "Chicago",` ; `curl -s http://localhost:3000/availability/3`
> renvoie, indenté par json-server :
>
> ```json
> {
>   "id": 3,
>   "locationId": 3,
>   "available": true,
>   "updatedAt": "2026-10-11T08:00:00Z"
> }
> ```

⚠️ json-server **écrit dans `api/db.json`** à chaque `POST` / `PATCH` (et, grâce à `--watch`, relit
le fichier si vous l'éditez à la main). Pour repartir d'une base propre entre deux essais de S4 ou
S5, trois gestes : `Ctrl-C` sur le terminal de l'API, `npm run api:reset` (qui recopie
`db.seed.json`, où `bookings` est vide), puis `npm run api`.

### 0.2 — Le proxy de développement

Le service du lab Init appelle `http://localhost:3000/locations` en absolu. On va passer par le
serveur de dev : l'app appelle `/api/...`, et `ng serve` relaie vers json-server. Copiez le
fichier, puis déclarez-le dans `angular.json` :

```bash
cp ../02-housing-async/assets/proxy.conf.json proxy.conf.json
```

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "pathRewrite": { "^/api": "" }
  }
}
```

Dans `angular.json`, la cible `serve` du projet `homes` a deux clés, `configurations` et
`defaultConfiguration`. Ajoutez-lui une clé `options` :

```json
        "serve": {
          "builder": "@angular/build:dev-server",
          "options": {
            "proxyConfig": "proxy.conf.json"
          },
          "configurations": { … },
          "defaultConfiguration": "development"
        }
```

| Pourquoi un proxy | Ce que ça change |
|---|---|
| Même origine : `/api` est servi par `localhost:4200` | plus de CORS à gérer, et des URL relatives dans le service, comme en production derrière un reverse proxy |
| `pathRewrite` retire le préfixe | `/api/locations` devient `http://localhost:3000/locations` : json-server ne voit jamais `/api` |
| Les URL commencent toutes par `/api` | c'est sur ce préfixe que les règles du chaos (0.5) vont se brancher |

> 💡 **Tester :** `angular.json` n'est **pas surveillé** par `ng serve` : `Ctrl-C` puis `npm start`
> dans le terminal 2. Puis `curl -s http://localhost:4200/api/locations/3 | head -3` renvoie
> `{ "id": 3, "name": "Homesteady Housing", …`.

### 0.3 — Les modèles

Remplacez `src/app/housinglocation.ts` par la version complète : `HousingLocationInfo` gagne les
trois champs de la base enrichie, et quatre interfaces arrivent pour les nouvelles ressources.

```ts
export interface HousingLocationInfo {
  id: number;
  name: string;
  city: string;
  state: string;
  photo: string;
  availableUnits: number;
  wifi: boolean;
  laundry: boolean;
  /** Loyer mensuel (ajouté pour ce lab : filtres S6). */
  price: number;
  /** 'apartment' | 'studio' | 'house' (ajouté pour ce lab). */
  type: 'apartment' | 'studio' | 'house';
  /** Référence vers /agents/:id (ajouté pour ce lab : S2). */
  agentId: number;
}

export interface Review {
  id: number;
  locationId: number;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface Agent {
  id: number;
  name: string;
  phone: string;
  email: string;
  agency: string;
}

export interface Availability {
  id: number;
  locationId: number;
  available: boolean;
  updatedAt: string;
}

export interface Booking {
  id?: number;
  locationId: number;
  at: string;
}
```

### 0.4 — Le service : de `fetch` à `HttpClient`

Le lab Init termine sur `fetch` + `await`. On le remplace par `HttpClient`, pour trois raisons qui
sont exactement les trois choses dont les scénarios ont besoin :

| Pourquoi | Ce que ça change pour la suite |
|---|---|
| Un `Observable` est **froid et annulable** : se désabonner, c'est abandonner la requête | sans ça, pas de `switchMap`, pas de « dernier gagne » (S1, S4) |
| `HttpClient` passe par les **intercepteurs** | sans ça, pas de chaos : `fetch` contourne tout |
| Les composants lisent via `toSignal` ou `resource` : plus de `markForCheck()` | l'app est zoneless, le rendu suit les signals (0.6) |

Remplacez `src/app/housing.service.ts` en entier :

```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Agent, Availability, Booking, HousingLocationInfo, Review } from './housinglocation';

@Injectable({ providedIn: 'root' })
export class HousingService {
  private readonly http = inject(HttpClient);
  readonly url = '/api';

  getAllHousingLocations(): Observable<HousingLocationInfo[]> {
    return this.http.get<HousingLocationInfo[]>(`${this.url}/locations`);
  }

  getHousingLocationById(id: number): Observable<HousingLocationInfo> {
    return this.http.get<HousingLocationInfo>(`${this.url}/locations/${id}`);
  }

  /** Recherche par ville, côté serveur (json-server 0.17 : `?city_like=` est une regex insensible à la casse). */
  searchByCity(query: string): Observable<HousingLocationInfo[]> {
    return this.http.get<HousingLocationInfo[]>(`${this.url}/locations`, {
      params: { city_like: query },
    });
  }

  getReviews(locationId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.url}/reviews`, { params: { locationId } });
  }

  getAgent(agentId: number): Observable<Agent> {
    return this.http.get<Agent>(`${this.url}/agents/${agentId}`);
  }

  getAvailability(locationId: number): Observable<Availability> {
    return this.http.get<Availability>(`${this.url}/availability/${locationId}`);
  }

  /** Réserve : un POST qui crée une ligne dans /bookings (json-server l'écrit dans db.json). */
  book(locationId: number): Observable<Booking> {
    const body: Booking = { locationId, at: new Date().toISOString() };
    return this.http.post<Booking>(`${this.url}/bookings`, body);
  }

  getBookings(locationId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.url}/bookings`, { params: { locationId } });
  }

  submitApplication(firstName: string, lastName: string, email: string) {
    console.log(
      `Homes application received: firstName: ${firstName}, lastName: ${lastName}, email: ${email}.`,
    );
  }
}
```

| Morceau | Rôle |
|---|---|
| `inject(HttpClient)` | le client HTTP d'Angular ; il n'existe qu'une fois `provideHttpClient()` déclaré (0.5) |
| `readonly url = '/api'` | relatif, grâce au proxy ; plus de `localhost:3000` dans le code |
| `this.http.get<T>(url)` | renvoie un `Observable<T>` **froid** : la requête ne part qu'au premier `subscribe` (ou `toSignal`, ou `resource`) |
| `{ params: { city_like: query } }` | `HttpClient` encode la query string ; l'intercepteur verra `/api/locations?city_like=Jun` |
| `this.http.post<T>(url, body)` | une mutation : c'est elle qui fait de S4 une course |

Le terminal de `ng serve` affiche maintenant des erreurs dans `home.ts` et `details.ts` : les
composants attendent une `Promise`, ils reçoivent un `Observable`. C'est 0.6 ; d'abord
l'intercepteur, puisque c'est lui qu'on branche dans `app.config.ts`.

### 0.5 — L'intercepteur chaos

Sans latence ni erreur, aucun scénario n'est visible : une recherche annulée sur une API qui
répond en 5 ms ne s'annule jamais, un `forkJoin` sur trois appels instantanés ne montre pas de
squelette, et un bouton cliqué trois fois sur un POST de 2 ms ne fait pas de course. D'où
l'intercepteur. Copiez le dossier, puis branchez-le :

```bash
mkdir -p src/app/chaos
cp ../02-housing-async/assets/chaos/chaos.config.ts ../02-housing-async/assets/chaos/chaos.interceptor.ts src/app/chaos/
```

`src/app/app.config.ts`, en entier :

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { chaosInterceptor } from './chaos/chaos.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([chaosInterceptor])),
  ],
};
```

| Morceau | Rôle |
|---|---|
| `provideHttpClient()` | rend `HttpClient` injectable dans toute l'app (sans lui, `inject(HttpClient)` lève `NullInjectorError`) |
| `withInterceptors([...])` | la liste des intercepteurs **fonctionnels** (`HttpInterceptorFn`), appliqués à chaque requête dans l'ordre |
| `chaosInterceptor` | pour chaque requête : tire un délai aléatoire, attend, puis envoie ou remplace la réponse par un 503 |

Le réglage est dans `src/app/chaos/chaos.config.ts`, et c'est le seul fichier du chaos que vous
toucherez pendant le lab. En voici l'extrait utile (le fichier complet, avec l'interface
`ChaosRule`, est celui que vous venez de copier) :

```ts
export const CHAOS_ENABLED = true;
export const CHAOS_DEFAULT = { minDelayMs: 300, maxDelayMs: 1500, errorRate: 0 };
export const CHAOS_RULES: ChaosRule[] = [
  // S3 : passez errorRate à 0.5 pour que les avis tombent une fois sur deux.
  { match: /\/api\/reviews/, minDelayMs: 300, maxDelayMs: 1500, errorRate: 0 },
  // S4 : décommentez pour que « trois clics rapides » soit atteignable à la souris.
  // { match: /\/api\/bookings/, minDelayMs: 1000, maxDelayMs: 2000, errorRate: 0 },
];
```

| Champ d'une règle | Rôle |
|---|---|
| `match` | une RegExp testée sur l'URL complète (avec query string), ou un préfixe de chaîne ; la première règle qui correspond gagne, sinon `CHAOS_DEFAULT` |
| `minDelayMs` / `maxDelayMs` | la fourchette de latence, tirée au hasard à chaque appel |
| `errorRate` | la probabilité (0 à 1) de remplacer la requête par une `HttpErrorResponse` 503 |

`CHAOS_ENABLED = false` rend l'API normale : utile pour vérifier qu'un bug vient bien du chaos.

Un point d'implémentation qui compte pour toute la suite, à lire dans `chaos.interceptor.ts` :
**le délai est placé avant l'envoi** (`timer(délai)` puis `switchMap(() => next(req))`), pas après
la réponse. Conséquence : quand un `switchMap` ou un `resource` se désabonne pendant l'attente, la
requête **ne part jamais**, et l'intercepteur le logue. Vous verrez l'une de ces trois lignes dans
la console du navigateur :

```
[chaos] GET /api/reviews?locationId=3 +842ms                  <- partie, répondue, après 842 ms d'attente
[chaos] GET /api/reviews?locationId=3 => 503 (après 537 ms)   <- remplacée par une erreur
[chaos] GET /api/locations?city_like=Jun => annulée           <- désabonnée avant la réponse
```

Il faut deux précisions pour lire les preuves correctement. Une requête désabonnée **après** l'envoi est
aussi loguée « annulée » (la réponse est jetée) : c'est l'onglet Réseau qui dit si elle est partie
(elle y apparaît *canceled*) ou non (elle n'y est pas). Et un 503 du chaos **n'apparaît jamais
dans l'onglet Réseau**, puisque la requête n'est pas envoyée : pour les erreurs, la preuve est la
console.

### 0.6 — `Home` et `Details` lisent un Observable

Le lab Init faisait `then(...)` puis `markForCheck()` pour prévenir Angular qu'une propriété
ordinaire avait changé. Avec un Observable, deux formes sont possibles dans un composant ; ce lab
prend la première partout où la donnée est un **état** à afficher, et réserve la seconde aux
**événements** (S4, S5) :

| | `toSignal(obs$)` | `obs$.subscribe(...)` |
|---|---|---|
| Ce que ça donne | un signal, lu dans le template avec `()` ; `undefined` (ou `initialValue`) tant que rien n'est arrivé | rien : vous écrivez vous-même dans un `signal` ou une propriété |
| Désabonnement | automatique, à la destruction du composant | à vous : `takeUntilDestroyed()` dans le `pipe` |
| `markForCheck()` | inutile : le rendu suit le signal | inutile aussi si vous écrivez dans un `signal` ; nécessaire si vous écrivez une propriété ordinaire |
| Quand | une donnée à afficher (liste, fiche) | un événement (clic, tick) qui déclenche une action |

`src/app/home/home.ts`, en entier (le template ne change que sur `filteredLocationList()`, qui est
devenu un signal, et sur `track housingLocation.id`) :

```ts
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HousingLocation } from '../housing-location/housing-location';
import { HousingService } from '../housing.service';

@Component({
  selector: 'app-home',
  imports: [HousingLocation],
  template: `
    <section>
      <form>
        <input type="text" placeholder="Filter by city" #filter />
        <button class="primary" type="button" (click)="filterResults(filter.value)">Search</button>
      </form>
    </section>
    <section class="results">
      @for (housingLocation of filteredLocationList(); track housingLocation.id) {
        <app-housing-location [housingLocation]="housingLocation" />
      }
    </section>
  `,
  styleUrl: './home.css',
})
export class Home {
  private readonly housingService = inject(HousingService);

  /** Lab Init : fetch + then + markForCheck(). Ici : un Observable lu par toSignal, le rendu suit tout seul. */
  readonly housingLocationList = toSignal(this.housingService.getAllHousingLocations(), {
    initialValue: [],
  });
  readonly filterText = signal('');
  readonly filteredLocationList = computed(() => {
    const text = this.filterText().toLowerCase();
    const list = this.housingLocationList();
    return text ? list.filter((l) => l.city.toLowerCase().includes(text)) : list;
  });

  filterResults(text: string) {
    this.filterText.set(text);
  }
}
```

| Morceau | Rôle |
|---|---|
| `toSignal(obs$, { initialValue: [] })` | s'abonne **à la construction**, expose un signal ; `initialValue` évite un `undefined` de départ dans le `@for` |
| `filterText = signal('')` + `computed` | la recherche devient une dérivation : plus de `filteredLocationList` à maintenir à la main (c'était le bonus du lab Init) |
| `track housingLocation.id` | la clé stable ; `$index` du tutoriel marche aussi, mais recrée les cartes quand la liste filtrée change |

Dans `src/app/details/details.ts`, la classe change et le template gagne une ligne
(`Monthly rent`) ; remplacez le fichier en entier :

```ts
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HousingService } from '../housing.service';

@Component({
  selector: 'app-details',
  imports: [ReactiveFormsModule],
  template: `
    <article>
      <img
        class="listing-photo"
        [src]="housingLocation()?.photo"
        alt="Exterior photo of {{ housingLocation()?.name }}"
        crossorigin
      />
      <section class="listing-description">
        <h2 class="listing-heading">{{ housingLocation()?.name }}</h2>
        <p class="listing-location">{{ housingLocation()?.city }}, {{ housingLocation()?.state }}</p>
      </section>
      <section class="listing-features">
        <h2 class="section-heading">About this housing location</h2>
        <ul>
          <li>Units available: {{ housingLocation()?.availableUnits }}</li>
          <li>Does this location have wifi: {{ housingLocation()?.wifi }}</li>
          <li>Does this location have laundry: {{ housingLocation()?.laundry }}</li>
          <li>Monthly rent: {{ housingLocation()?.price }} $</li>
        </ul>
      </section>
      <section class="listing-apply">
        <h2 class="section-heading">Apply now to live here</h2>
        <form [formGroup]="applyForm" (submit)="submitApplication()">
          <label for="first-name">First Name</label>
          <input id="first-name" type="text" formControlName="firstName" />

          <label for="last-name">Last Name</label>
          <input id="last-name" type="text" formControlName="lastName" />

          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" />
          <button type="submit" class="primary">Apply now</button>
        </form>
      </section>
    </article>
  `,
  styleUrl: './details.css',
})
export class Details {
  private readonly route = inject(ActivatedRoute);
  private readonly housingService = inject(HousingService);

  readonly id = Number(this.route.snapshot.params['id']);
  /** Lab Init : then + markForCheck(). Ici : toSignal, et `housingLocation()` vaut undefined tant que la réponse n'est pas là. */
  readonly housingLocation = toSignal(this.housingService.getHousingLocationById(this.id));

  applyForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    email: new FormControl(''),
  });

  submitApplication() {
    this.housingService.submitApplication(
      this.applyForm.value.firstName ?? '',
      this.applyForm.value.lastName ?? '',
      this.applyForm.value.email ?? '',
    );
  }
}
```

Le `?.` du template reste nécessaire : sans `initialValue`, le signal vaut `undefined` le temps de
la requête (et le temps du chaos, donc jusqu'à 1,5 s : vous le verrez).

**Critère de réussite de l'étape 0.** L'app fait exactement ce qu'elle faisait à la fin du lab
Init (dix cartes, recherche, fiche, formulaire), avec un délai visible avant chaque affichage, et
la console montre le chaos à l'œuvre.

> 💡 **Tester :** ouvrez `http://localhost:4200/`, console ouverte avec le filtre `chaos` :
>
> ```
> [chaos] GET /api/locations +1100ms
> ```
>
> avec un délai différent à chaque rechargement. `/details/3` affiche `Monthly rent: 1100 $` (la
> base enrichie est bien servie) et logue `[chaos] GET /api/locations/3 +1471ms`. Puis passez
> `errorRate` à `0.5` dans `CHAOS_DEFAULT` : une fois sur deux, la page d'accueil reste vide avec
> `[chaos] GET /api/locations => 503 (après NNN ms)` suivi d'une erreur `HttpErrorResponse` rouge
> (`toSignal` relance l'erreur quand le template lit le signal : c'est attendu). **Remettez `0`**
> avant de continuer.

---

## 🧱 Comment une expérience est construite

Chaque scénario est une **page** à part, pour ne pas toucher à l'app du tutoriel : une route
`/sN`, un composant de page qui porte le titre, la consigne et une bascule **RxJS / Signals**, et
deux composants, `sN-rxjs.ts` et `sN-signals.ts`, un par volet. Un seul volet est affiché à la
fois : quand vous basculez, le composant de l'autre volet est **détruit**. C'est voulu, pour deux
raisons : le log chaos ne montre que les requêtes d'un volet (sinon tout apparaît en double), et la
destruction est le moyen de vérifier qu'un flux s'arrête bien (S5).

Pour S1, tout est montré, fichier par fichier. À partir de S2, la section vous dira « même geste
qu'en S1 » et ne donnera que les noms.

### La mise en page et la bascule

Copiez la feuille de style des scénarios et déclarez-la dans `angular.json`, dans la cible
`build` du projet, à côté de `src/styles.css` :

```bash
cp ../02-housing-async/assets/scenarios.css src/scenarios.css
```

```json
            "styles": [
              "src/styles.css",
              "src/scenarios.css"
            ]
```

Comme pour le proxy, `angular.json` n'est pas surveillé : `Ctrl-C` puis `npm start`. Les classes
que vous utiliserez dans les templates : `.scenario`, `.hint`, `.pane` (+ `.rxjs` / `.signals`),
`.status`, `.error`, `.skeleton`.

Créez le dossier `src/app/scenarios/` et dedans la bascule, `mode-toggle.ts` :

```ts
import { Component, model } from '@angular/core';

export type Mode = 'rxjs' | 'signals';

@Component({
  selector: 'app-mode-toggle',
  template: `
    <div class="mode-toggle">
      @for (m of modes; track m) {
        <button type="button" [class.on]="mode() === m" (click)="mode.set(m)">{{ labels[m] }}</button>
      }
    </div>
  `,
})
export class ModeToggle {
  readonly mode = model<Mode>('rxjs');
  readonly modes: Mode[] = ['rxjs', 'signals'];
  readonly labels: Record<Mode, string> = { rxjs: 'RxJS', signals: 'Signals' };
}
```

| Morceau | Rôle |
|---|---|
| `model<Mode>('rxjs')` | un input **bidirectionnel** : la page le lie avec `[(mode)]="mode"`, et `mode.set(m)` dans la bascule remonte dans le signal de la page |
| `[class.on]` | le bouton actif ; la classe est dans `scenarios.css` |

### La page S1, la route et le lien

Créez `src/app/scenarios/s1-search/s1-page.ts` :

```ts
import { Component, signal } from '@angular/core';
import { Mode, ModeToggle } from '../mode-toggle';
import { S1Rxjs } from './s1-rxjs';
import { S1Signals } from './s1-signals';

@Component({
  selector: 'app-s1-page',
  imports: [ModeToggle, S1Rxjs, S1Signals],
  template: `
    <div class="scenario">
      <h1>S1 — Recherche : anti-rebond et annulation</h1>
      <p class="hint">
        Tapez « Jun », une courte pause, puis « eau » : seul le résultat de « Juneau » doit
        s'afficher, et le log chaos doit montrer « Jun => annulée ».
      </p>
      <app-mode-toggle [(mode)]="mode" />
      @if (mode() === 'rxjs') {
        <section class="pane rxjs"><h2>RxJS</h2><app-s1-rxjs /></section>
      } @else {
        <section class="pane signals"><h2>Signals</h2><app-s1-signals /></section>
      }
    </div>
  `,
})
export class S1Page {
  readonly mode = signal<Mode>('rxjs');
}
```

| Morceau | Rôle |
|---|---|
| `@if (mode() === 'rxjs') … @else` | un seul volet dans le DOM ; changer de mode détruit l'autre composant |
| `imports: [ModeToggle, S1Rxjs, S1Signals]` | les deux composants de volet n'existent pas encore : c'est la section S1 ; le build sera rouge jusque-là |

Ajoutez la route dans `src/app/app.routes.ts` (gardez les deux routes du tutoriel) :

```ts
import { S1Page } from './scenarios/s1-search/s1-page';

export const routes: Routes = [
  { path: '', component: Home, title: 'Home page' },
  { path: 'details/:id', component: Details, title: 'Home details' },
  { path: 's1', component: S1Page, title: 'S1 — Recherche : anti-rebond et annulation' },
];
```

Et le lien dans l'en-tête. Le `app.ts` du tutoriel enveloppe tout l'en-tête dans un `<a>` ; on le
restructure pour y loger une barre de navigation. `src/app/app.ts`, en entier :

```ts
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <main>
      <header class="brand-name">
        <a [routerLink]="['/']">
          <img class="brand-logo" src="/logo.svg" alt="logo" aria-hidden="true" />
        </a>
        <nav class="scenarios">
          <a routerLink="/s1" routerLinkActive="active">S1 Recherche</a>
        </nav>
      </header>
      <section class="content">
        <router-outlet />
      </section>
    </main>
  `,
  styleUrl: './app.css',
})
export class App {
  title = 'homes';
}
```

Et `src/app/app.css`, en entier (l'en-tête passe en `flex` pour aligner le logo et les liens) :

```css
:host {
  --content-padding: 10px;
}
header {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 60px;
  padding: var(--content-padding);
  box-shadow: 0px 5px 25px var(--shadow-color);
}
.brand-logo {
  height: 40px;
}
nav.scenarios {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
nav.scenarios a {
  white-space: nowrap;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: bold;
}
nav.scenarios a.active {
  border-bottom: 3px solid var(--primary-color);
}
.content {
  padding: var(--content-padding);
}
```

Les liens des scénarios suivants viendront s'ajouter dans `<nav>`, un par scénario, au moment où
leur route existe (un `routerLink` vers une route absente lève `NG04002: Cannot match any routes`
au clic).

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

## 🔎 S1 — Recherche : anti-rebond et annulation

**Contexte.** Un champ texte ; à chaque frappe, on cherche côté serveur (`searchByCity`, soit
`GET /locations?city_like=`). Deux problèmes à résoudre : ne pas envoyer une requête par lettre
(anti-rebond), et ne jamais afficher le résultat d'une requête plus ancienne que la dernière
saisie (annulation, « dernier gagne »).

| Besoin | RxJS | Signals |
|---|---|---|
| Attendre que l'utilisateur ait fini de taper | `debounceTime(300)` | rien de natif : un `resource` réagit à chaque changement |
| Ne pas relancer la même recherche | `distinctUntilChanged` | inutile : un signal ne notifie pas si la valeur est identique |
| Abandonner la requête précédente | `switchMap` | `resource` le fait seul quand sa requête change |

### Côté RxJS (donné)

Créez `src/app/scenarios/s1-search/s1-rxjs.ts` :

```ts
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, of, startWith, switchMap, tap } from 'rxjs';
import { HousingLocationInfo } from '../../housinglocation';
import { HousingService } from '../../housing.service';

@Component({
  selector: 'app-s1-rxjs',
  imports: [ReactiveFormsModule],
  template: `
    <input type="text" [formControl]="city" placeholder="Ville (ex. Juneau)" />
    @if (searching()) {
      <span class="status">recherche…</span>
    }
    <ul>
      @for (l of results(); track l.id) {
        <li>{{ l.name }} — {{ l.city }}, {{ l.state }}</li>
      } @empty {
        <li class="status">Aucun résultat.</li>
      }
    </ul>
  `,
})
export class S1Rxjs {
  private readonly housingService = inject(HousingService);

  readonly city = new FormControl('', { nonNullable: true });
  readonly searching = signal(false);

  readonly results = toSignal(
    this.city.valueChanges.pipe(
      startWith(this.city.value),
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.searching.set(true)),
      switchMap((q) =>
        this.housingService.searchByCity(q).pipe(
          catchError(() => of([] as HousingLocationInfo[])),
          tap(() => this.searching.set(false)),
        ),
      ),
    ),
    { initialValue: [] as HousingLocationInfo[] },
  );
}
```

| Opérateur | Pourquoi il est là, et à cet endroit |
|---|---|
| `valueChanges` + `startWith(this.city.value)` | `valueChanges` n'émet pas la valeur initiale ; `startWith` déclenche la première recherche (la liste complète) |
| `debounceTime(300)` | n'émet que 300 ms après la dernière frappe : une requête par **pause**, pas par lettre |
| `distinctUntilChanged()` | « Jun » puis effacer puis « Jun » : pas de deuxième requête identique |
| `tap(() => this.searching.set(true))` | l'indicateur, **avant** la requête ; un effet de bord assumé dans le flux |
| `switchMap(q => http)` | l'annulation : une nouvelle valeur **désabonne** la requête précédente ; avec le chaos, elle ne part même pas (« annulée ») |
| `catchError(() => of([]))` **à l'intérieur** du `switchMap` | une erreur sur une recherche ne doit pas tuer le flux des saisies ; placé à l'extérieur, le `toSignal` serait mort après la première erreur |
| `toSignal(…, { initialValue: [] })` | la sortie : un signal pour le template, désabonnement automatique, pas de `subscribe()` |

### Côté signals (à vous)

Créez `src/app/scenarios/s1-search/s1-signals.ts`. Contraintes : un signal `query` alimenté par
`(input)` ; un `httpResource` dont la fonction de requête lit la saisie ; l'indicateur sur
`isLoading()`, l'erreur sur `error()`, la liste sur `value()`. Le debounce **n'existe pas** dans
`resource` : il passe par le pont, `toSignal(toObservable(query).pipe(debounceTime(300)))`, et
c'est ce signal débouncé que lit la fonction de requête. Le template est donné, la logique est à
compléter :

🚧 **À compléter :**

```ts
import { Component, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { httpResource } from '@angular/common/http';
import { debounceTime } from 'rxjs';
import { HousingLocationInfo } from '../../housinglocation';

@Component({
  selector: 'app-s1-signals',
  template: `
    <input type="text" #q [value]="query()" (input)="query.set(q.value)" placeholder="Ville (ex. Juneau)" />
    @if (results.isLoading()) {
      <span class="status">recherche…</span>
    }
    @if (results.error()) {
      <p class="error">Erreur : {{ results.error()?.message }}</p>
    } @else {
      <ul>
        @for (l of results.value(); track l.id) {
          <li>{{ l.name }} — {{ l.city }}, {{ l.state }}</li>
        } @empty {
          <li class="status">Aucun résultat.</li>
        }
      </ul>
    }
  `,
})
export class S1Signals {
  /** Ce que l'utilisateur tape, à chaque frappe. */
  readonly query = signal('');

  // TODO 1 : le pont, un signal `debouncedQuery` : toSignal(toObservable(this.query).pipe(debounceTime(300)), { initialValue: '' })

  // TODO 2 : `results`, un httpResource<HousingLocationInfo[]> dont la fonction de requête lit le signal
  //          DÉBOUNCÉ (pas `query`, sinon une requête par lettre) et passe `city_like` en params.
}
```

Indices : `httpResource` accepte un objet `{ url, params }` comme `HttpClient` (0.4) ; l'URL est
`/api/locations`, à écrire en dur ici (une resource prend une URL, pas un Observable) ; l'option
`{ defaultValue: [] }` joue le rôle de l'`initialValue` de `toSignal`, et évite un `@for` sur
`undefined` ; pas besoin de `distinctUntilChanged` : un signal ne notifie pas une valeur identique.
Et le `@else` autour de la liste n'est pas décoratif : `value()` **lève** quand la resource est en
erreur (voir « Le format »). Pourquoi `httpResource` et pas `resource` + `fetch` avec `abortSignal` ? Ça marche
aussi, mais `fetch` contourne `HttpClient`, donc l'intercepteur : vous ne verriez ni latence, ni
« annulée » dans le log. Si vous voulez voir l'`abortSignal` à l'œuvre, faites-le en bonus et
comparez l'onglet Réseau (la requête y apparaît *canceled*, puisqu'elle est partie).

> 📖 [httpResource](https://angular.dev/guide/http/http-resource) ·
> [toObservable](https://angular.dev/api/core/rxjs-interop/toObservable) ·
> [toSignal](https://angular.dev/api/core/rxjs-interop/toSignal) ·
> [debounceTime](https://rxjs.dev/api/operators/debounceTime) ·
> [switchMap](https://rxjs.dev/api/operators/switchMap)

### Critère de réussite

Sur chaque volet : tapez « Jun », marquez une pause d'environ 400 ms (assez pour passer le
debounce, pas assez pour que le chaos laisse partir la requête), puis « eau ». La liste n'affiche
que Juneau, et le log montre `Jun => annulée`. Dans l'onglet Réseau, il n'y a que **deux**
requêtes, `city_like=` (la liste complète, à la création du volet) et `city_like=Juneau` : celle de
`Jun` n'est jamais partie. Si `Jun` apparaît en `+NNNms`, le chaos a
tiré un délai court : recommencez (videz le champ, attendez que la liste complète revienne). Sans
le debounce (essayez en retirant `debounceTime` côté RxJS), vous verriez une ligne par lettre,
chacune annulée par la suivante.

> 💡 **Tester :** console, filtre `chaos`, les deux volets donnent la même chose :
>
> ```
> [chaos] GET /api/locations?city_like=Jun => annulée
> [chaos] GET /api/locations?city_like=Juneau +1114ms
> ```
>
> et l'écran affiche `Warm Beds Housing Support — Juneau, AK`.

<details>
<summary>Ce qu'on retient</summary>

- L'**annulation** est gratuite des deux côtés : `switchMap` en RxJS, le `resource` tout seul en
  signals (il se désabonne quand sa requête change).
- Le **temps** (debounce) n'existe qu'en RxJS : côté signals, il passe par le pont
  `toSignal(toObservable(q).pipe(debounceTime(300)))`, une ligne, et c'est la seule ligne RxJS du
  composant.
- Le volet signals n'a ni `startWith`, ni `distinctUntilChanged` (un signal ne notifie pas une
  valeur identique), ni `tap` pour l'indicateur (`isLoading()` est fourni) : la plomberie a disparu.
</details>

---

## 🧩 S2 — Détail : trois appels en parallèle

**Contexte.** La page d'un logement (`/s2/:id`) a besoin de trois choses : le logement, ses avis,
et son agent. Le logement et les avis ne dépendent que de l'`id` ; l'agent dépend du logement
(`location.agentId`). Vous voulez tout lancer au plus tôt. Pour ce scénario, la règle
`/\/api\/reviews/` de `chaos.config.ts` reste à `errorRate: 0` (c'est la valeur fournie) ; S3 la
passera à `0.5`.

| Besoin | RxJS | Signals |
|---|---|---|
| Lancer N appels et attendre les N réponses | `forkJoin({ a, b })` : émet une fois, quand tout est fini | N resources indépendantes, chacune avec son statut |
| Enchaîner un appel qui dépend d'un autre | `switchMap` à l'intérieur du flux concerné | une fonction de requête qui renvoie `undefined` tant que la dépendance n'a pas de valeur (la resource reste `idle`) |
| Savoir que « tout est là » | c'est le comportement par défaut de `forkJoin` | un `computed` sur les `hasValue()` |

**Même geste qu'en S1** pour la page, la route et le lien, avec ces noms :

| Quoi | Nom |
|---|---|
| Dossier | `src/app/scenarios/s2-details/` |
| Page | `s2-page.ts`, classe `S2Page`, sélecteur `app-s2-page` (la page sert à S2 et S3, d'où son titre), `<h1>S2-S3 — Détail : trois appels en parallèle, un sur trois échoue</h1>` |
| Volets | `s2-rxjs.ts` (`S2Rxjs`, `app-s2-rxjs`) et `s2-signals.ts` (`S2Signals`, `app-s2-signals`) |
| Route | `{ path: 's2/:id', component: S2Page, title: 'S2-S3 — Détail : trois appels en parallèle, un sur trois échoue' }` |
| Lien | `<a routerLink="/s2/3" routerLinkActive="active">S2-S3 Détail</a>` |

Une différence avec S1 : la page lit l'`id` de la route et le **passe** aux deux volets, qui le
reçoivent par `input.required`. Dans `s2-page.ts` :

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

Et dans chaque volet : `readonly locationId = input.required<number>();`. C'est ce qui rend les
volets réutilisables sans routeur, et c'est ce qui crée le piège `NG0950` décrit dans « Le
format » : relisez-le avant de lire le code RxJS.

### Côté RxJS (donné)

Créez `src/app/scenarios/s2-details/s2-rxjs.ts`. Ce fichier contient déjà ce qu'il faut pour S3
(la case à cocher `catchError par flux`, le bouton « Réessayer ») : on y revient à la section
suivante, pour l'instant lisez le `forkJoin`.

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
      // catchError PAR FLUX : l'erreur devient une valeur, forkJoin ne la voit jamais (S3).
      reviews: withCatch
        ? reviews$.pipe(catchError((err: unknown) => of({ reviews: null, reviewsError: describe(err) })))
        : reviews$,
    }).pipe(
      map(({ location, reviews }) => ({ ...location, ...reviews, fatal: null })),
      // Sans le catchError par flux, c'est celui-ci qui attrape : tout l'écran tombe (S3).
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

| Morceau | Pourquoi il est là, et à cet endroit |
|---|---|
| `toObservable(this.locationId)` en tête de flux | l'input requis n'est pas disponible à la construction ; `toObservable` n'émet qu'une fois qu'il l'est (piège `NG0950`) |
| `combineLatest([id, withCatch, reload$])` | trois déclencheurs de rechargement, un seul flux ; `reload$.pipe(startWith(undefined))` pour que `combineLatest` émette dès le départ |
| `switchMap(() => load().pipe(startWith(undefined)))` | un rechargement annule le précédent, et `startWith(undefined)` remet le squelette (`@if (!v)`) |
| `forkJoin({ location, reviews })` | lance les deux flux **en même temps**, attend que **tous** soient terminés, émet **une fois** : UX « squelette, puis tout d'un coup » |
| `switchMap` à l'intérieur de `location` | l'agent dépend du logement : la dépendance est exprimée **dans** le flux concerné, `forkJoin` n'y voit qu'un flux |
| `@let v = vm()` | une lecture du signal pour tout le template (sinon `vm()` à chaque ligne) |
| `toSignal` sans `initialValue` | `undefined` = « pas encore chargé » : c'est le squelette |

### Côté signals (à vous)

Créez `src/app/scenarios/s2-details/s2-signals.ts`. Contraintes : trois `httpResource`,
`location`, `reviews`, `agent` ; la fonction de requête de `agent` lit `location` (via
`hasValue()`, jamais `value()` à sec) et renvoie `undefined` tant que le logement n'est pas là ;
un `computed` `ready` vrai quand les trois ont une valeur ; dans le template, un bloc par
resource qui gère son propre `isLoading()` / `error()` / `hasValue()`. Le code d'un bloc, pour
vous donner la forme ; les deux autres sont sur le même modèle :

🚧 **À compléter :**

```ts
import { Component, computed, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Agent, HousingLocationInfo, Review } from '../../housinglocation';

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

  // TODO : location = httpResource<HousingLocationInfo>(() => `/api/locations/${...}`)
  // TODO : reviews  = httpResource<Review[]>(() => ({ url: '/api/reviews', params: { locationId: ... } }))
  // TODO : agent    = httpResource<Agent>(() => ... ? `/api/agents/${...agentId}` : undefined)
  // TODO : ready    = computed(() => ... && ... && ...)
}
```

Indices : la fonction de requête est un contexte réactif, lire `this.locationId()` dedans est
sûr (contrairement à `toSignal` + `startWith`) ; `undefined` renvoyé par la fonction de requête =
la resource reste `idle`, aucune requête ; dès que `location` se résout, la fonction de `agent`
est réévaluée et la requête part : c'est le `switchMap` de RxJS, exprimé en dérivation.

> 📖 [forkJoin](https://rxjs.dev/api/index/function/forkJoin) ·
> [resource : params, loader, statuts](https://angular.dev/guide/signals/resource) ·
> [httpResource](https://angular.dev/guide/http/http-resource) ·
> [computed](https://angular.dev/guide/signals)

### Critère de réussite

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
  depuis le service (`rxResource` les éviterait, au prix d'un peu de plomberie).
</details>

---

## 💥 S3 — Détail : un appel sur trois échoue

**Contexte.** S3 se joue dans les deux composants de S2, sur la même page `/s2/:id` : il n'y a
pas de page S3. Dans `chaos.config.ts`, passez la règle `/\/api\/reviews/` à `errorRate: 0.5`
(la page se recharge toute seule). En production, un service d'avis en panne ne doit pas vider
la fiche logement : le logement et l'agent s'affichent, les avis montrent une erreur et un bouton
« réessayer ».

| Besoin | RxJS | Signals |
|---|---|---|
| Isoler l'erreur d'un flux | `catchError` **sur ce flux**, avant `forkJoin` : l'erreur devient une valeur | l'erreur est déjà locale : `reviews.error()` |
| Relancer seulement ce qui a échoué | il faut sortir le flux du `forkJoin` (ou tout recharger) | `reviews.reload()` |

### Côté RxJS (donné, déjà en place)

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

### Côté signals (à vous)

Dans le bloc avis de `s2-signals.ts` : un `@else if (reviews.error())` avec le message et un
bouton « Réessayer (les avis seulement) » qui fait `(click)="reviews.reload()"`. Rien d'autre à
changer par rapport à S2 : c'est le point.

> 📖 [catchError](https://rxjs.dev/api/operators/catchError) ·
> [Resource : `error`, `reload`](https://angular.dev/guide/signals/resource)

### Critère de réussite

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

## 🏁 S4 — Réserver : clics rapides

**Contexte.** Un bouton « Réserver » qui fait un `POST /bookings`. L'utilisateur clique trois fois
très vite. Selon l'opérateur, il se passe trois choses différentes, et une seule est acceptable
pour un paiement. Pour que « très vite » soit atteignable à la souris, **décommentez** la règle
`/\/api\/bookings/` (1000 à 2000 ms) dans `chaos.config.ts`.

| Opérateur | À chaque clic | Trois clics rapides = | Pour quoi |
|---|---|---|---|
| `switchMap` | on **abandonne** l'appel en cours et on relance | 1 réservation, 2 annulées (ou, en prod, 3 réservations côté serveur dont 2 inconnues du client) | une recherche, une navigation |
| `concatMap` | on **met en file**, dans l'ordre | 3 réservations, l'une après l'autre | une sauvegarde automatique, un journal |
| `exhaustMap` | on **ignore** tant que l'appel en cours n'est pas fini | 1 réservation, 2 clics ignorés | un paiement, une double soumission |

**Même geste qu'en S1 et S2** (page avec `[locationId]="id"`, route, lien) :

| Quoi | Nom |
|---|---|
| Dossier | `src/app/scenarios/s4-booking/` |
| Page | `s4-page.ts`, `S4Page`, `app-s4-page`, `<h1>S4 — Réserver : clics rapides</h1>` |
| Volets | `s4-rxjs.ts` (`S4Rxjs`, `app-s4-rxjs`) et `s4-signals.ts` (`S4Signals`, `app-s4-signals`) |
| Route | `{ path: 's4/:id', component: S4Page, title: 'S4 — Réserver : clics rapides' }` |
| Lien | `<a routerLink="/s4/3" routerLinkActive="active">S4 Réserver</a>` |

### Côté RxJS (donné)

Le **même** bouton écrit trois fois, avec un `Subject` de clics par version et un opérateur
différent. Ici le `subscribe()` est autorisé, c'est la première des deux exceptions : un clic est
un **événement**, pas un état. Créez
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
| `bookingsCount` : `combineLatest([toObservable(locationId), refresh$])` | le compteur côté serveur, relancé par « Compter » ; `toObservable(this.locationId)` parce que `startWith` émet à la construction (piège 3) |

### Côté signals (à vous)

Créez `src/app/scenarios/s4-booking/s4-signals.ts`, avec deux versions côte à côte :

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

Et `concatMap` ? Cherchez l'équivalent ; il n'y en a pas sans écrire une file à la main.

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

### Critère de réussite

Après trois clics rapides sur chaque bouton, le compteur et le log racontent l'histoire du
tableau, et « Compter » (`GET /bookings?locationId=3`) confirme ce que le serveur a reçu, une
fois les trois lignes `+NNNms` du `concatMap` passées. Côté signals : la version A logue des
`POST => annulée` (un `resource` se comporte comme `switchMap`), la version B ne compte même pas
les clics 2 et 3 (le bouton est désactivé). Vous savez dire **quel opérateur pour une recherche,
un paiement, une sauvegarde automatique**, et vous notez dans la grille que `resource` se comporte
comme `switchMap`.

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
> `npm run api:reset`, `npm run api`. Une fois S4 terminé, vous pouvez remettre la règle
> `/\/api\/bookings/` en commentaire.

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

## ⏱️ S5 — Disponibilité : polling, arrêt en quittant la page

**Contexte.** La disponibilité d'un logement change côté serveur (un autre agent réserve). Vous
interrogez `GET /availability/:id` toutes les 3 secondes tant que la page est ouverte, et **plus
du tout** une fois qu'on l'a quittée.

| Besoin | RxJS | Signals |
|---|---|---|
| Un tick toutes les 3 s | `timer(0, 3000)` ou `interval(3000)` | `setInterval` à la main |
| Un appel par tick, sans empiler si le précédent traîne | `switchMap(http)` | `reload()` (renvoie `false` et ne fait rien si un chargement est en cours) |
| Arrêter à la destruction | `takeUntilDestroyed()` (ou `toSignal`, qui se désabonne) | `onCleanup` dans un `effect`, à ne pas oublier |

**Même geste** (page avec `[locationId]="id"`, route, lien) :

| Quoi | Nom |
|---|---|
| Dossier | `src/app/scenarios/s5-polling/` |
| Page | `s5-page.ts`, `S5Page`, `app-s5-page`, `<h1>S5 — Disponibilité : polling, arrêt en quittant la page</h1>` |
| Volets | `s5-rxjs.ts` (`S5Rxjs`, `app-s5-rxjs`) et `s5-signals.ts` (`S5Signals`, `app-s5-signals`) |
| Route | `{ path: 's5/:id', component: S5Page, title: 'S5 — Disponibilité : polling, arrêt en quittant la page' }` |
| Lien | `<a routerLink="/s5/3" routerLinkActive="active">S5 Disponibilité</a>` |

### Côté RxJS (donné)

Le temps est un flux comme un autre. Créez `src/app/scenarios/s5-polling/s5-rxjs.ts` :

```ts
import { Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, timer } from 'rxjs';
import { Availability } from '../../housinglocation';
import { HousingService } from '../../housing.service';

@Component({
  selector: 'app-s5-rxjs',
  template: `
    <p>
      Disponible :
      <strong>{{ availability()?.available === undefined ? '…' : availability()?.available ? 'oui' : 'non' }}</strong>
    </p>
    <p class="status">appels : {{ calls() }} — dernier : {{ lastCall() }}</p>
  `,
})
export class S5Rxjs {
  readonly locationId = input.required<number>();
  private readonly housingService = inject(HousingService);

  readonly availability = signal<Availability | undefined>(undefined);
  readonly calls = signal(0);
  readonly lastCall = signal('');

  constructor() {
    toObservable(this.locationId)
      .pipe(
        switchMap((id) =>
          timer(0, 3000).pipe(
            switchMap(() =>
              this.housingService.getAvailability(id).pipe(catchError(() => EMPTY)),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((a) => {
        this.availability.set(a);
        this.calls.update((n) => n + 1);
        this.lastCall.set(new Date().toLocaleTimeString());
      });
  }
}
```

| Morceau | Pourquoi il est là |
|---|---|
| `timer(0, 3000)` | un tick tout de suite, puis toutes les 3 s ; `interval(3000)` attendrait 3 s avant le premier |
| `switchMap(() => http)` (et non `mergeMap`) | si l'appel précédent traîne plus de 3 s (chaos), on l'abandonne plutôt que d'empiler : « dernier gagne » |
| `catchError(() => EMPTY)` à l'intérieur | un 503 sur un tick ne doit pas arrêter le polling : `EMPTY` termine ce tick sans valeur, le `timer` continue |
| `takeUntilDestroyed()` puis `subscribe` | la deuxième exception à la règle : on veut **voir** l'opérateur couper le flux à la destruction. Avec `toSignal(...)` à la place, le désabonnement serait inclus : même garantie, écrite autrement |
| `toObservable(this.locationId)` en tête | comme en S2 et S4 : l'input requis n'est pas là au moment du `subscribe` dans le constructeur |

### Côté signals : essayez, constatez, puis lisez la solution

Ce scénario est celui où les signals **n'ont pas d'équivalent propre**, et le but est de le
constater par vous-même. Créez `src/app/scenarios/s5-polling/s5-signals.ts` avec la tentative
« signals seuls » :

- un `rxResource({ params: () => this.locationId(), stream: ({ params }) => this.housingService.getAvailability(params) })`
  pour charger une fois ;
- dans le constructeur, un `effect((onCleanup) => { ... })` qui pose un `setInterval` de 3 s
  appelant `this.availability.reload()`, et `onCleanup(() => clearInterval(handle))` ;
- affichez `availability.hasValue()` / `value().available`, `status()`, et un compteur de ticks.

Faites-la marcher (elle marche), puis répondez à trois questions avant d'ouvrir la solution : que
lit cet `effect` comme signal ? Comment feriez-vous une pause, un repli progressif (backoff), un
« dernier gagne » si un appel traîne ? Que se passe-t-il si vous oubliez `clearInterval` ?

Puis lisez `solution/src/app/scenarios/s5-polling/s5-signals.ts` : elle garde votre tentative
(version A) et ajoute la version B, **le pont** : un `rxResource` dont le `stream` est
`timer(0, 3000).pipe(switchMap(http))`. Le temps reste RxJS, la resource ne fait que consommer le
flux, et à la destruction elle se désabonne : le polling cesse. Les deux versions sont derrière un
bouton radio, pour les comparer dans la grille. Ajoutez la version B à votre fichier, à partir de
la solution si vous voulez.

Pourquoi pas d'équivalent ? Un `effect` est fait pour **réagir à des signals** ; ici il n'en lit
aucun, il sert de crochet de destruction déguisé. Rien ne se compose (pas de `retry`, pas de
`takeUntil`, pas de `switchMap`), et le nettoyage est manuel : oubliez `clearInterval` et le
polling survit à la page. Le temps est un flux ; les signals ne modélisent pas le temps.

> 📖 [timer](https://rxjs.dev/api/index/function/timer) ·
> [takeUntilDestroyed](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed) ·
> [effect et onCleanup](https://angular.dev/guide/signals) ·
> [rxResource](https://angular.dev/api/core/rxjs-interop/rxResource)

### Critère de réussite

Changez `available` (`PATCH` ci-dessous, ou éditez `api/db.json`) : l'affichage suit au tick
suivant, soit moins de 3 s plus la latence du chaos. Quittez la page (le logo, vers l'accueil,
ou « S1 Recherche ») : **plus aucune ligne** `availability` dans le log, ni dans l'onglet Réseau,
10 secondes plus tard.

> 💡 **Tester :** dans le terminal 3 :
>
> ```bash
> curl -s -X PATCH -H 'Content-Type: application/json' -d '{"available":false}' http://localhost:3000/availability/3
> ```
>
> La page passe de `Disponible : oui` à `Disponible : non` au tick suivant, et le compteur avance
> (`appels : 8 — dernier : 19:18:01`). Dans la console, une ligne
> `[chaos] GET /api/availability/3 +NNNms` toutes les 3 s environ ; une `=> annulée` apparaît quand
> vous détruisez un volet en pleine requête (bascule A/B, changement de volet) ; puis, après
> avoir cliqué sur le logo, la seule nouvelle ligne en 10 s est `[chaos] GET /api/locations +586ms`
> (celle de l'accueil), à part éventuellement un `availability/3 => annulée` au moment de quitter
> la page. Pour remettre `true` : le même `curl` avec `{"available":true}`, ou
> `npm run api:reset`.

<details>
<summary>Ce qu'on retient</summary>

- Le **temps** (polling, retry, backoff, websocket) est le domaine de RxJS : `timer` + `switchMap`
  + `takeUntilDestroyed`, et tout se compose.
- « Signals seuls » = `effect` + `setInterval` + `onCleanup` : ça marche, mais rien ne se
  compose et le nettoyage est manuel.
- La forme à retenir : **`rxResource({ stream: () => timer(0, 3000).pipe(switchMap(http)) })`**,
  le temps côté RxJS, l'état côté signals, le pont dans le composant.
</details>

---

## 🧮 S6 — Filtres : dérivation synchrone, sans requête

**Contexte.** La liste est chargée une fois. Trois critères, ville (texte, insensible à la
casse), prix max (nombre), tri (nom ou prix), se combinent **sans nouvel appel HTTP**. Il n'y a
pas d'asynchrone dans la combinaison elle-même : c'est le scénario qui montre où les signals sont
chez eux.

| Besoin | RxJS | Signals |
|---|---|---|
| Combiner trois sources qui changent indépendamment | `combineLatest([...])` + `map` ; attention, chaque source doit avoir émis une fois (`startWith`) | un `computed` qui lit trois signals |
| Le chargement initial | un flux de plus dans le `combineLatest` | `toSignal(http)` ou `httpResource`, une fois |

**Même geste qu'en S1** (pas d'`id` ici) :

| Quoi | Nom |
|---|---|
| Dossier | `src/app/scenarios/s6-filters/` |
| Page | `s6-page.ts`, `S6Page`, `app-s6-page`, `<h1>S6 — Filtres : dérivation synchrone, sans requête</h1>` |
| Volets | `s6-rxjs.ts` (`S6Rxjs`, `app-s6-rxjs`) et `s6-signals.ts` (`S6Signals`, `app-s6-signals`) |
| Route | `{ path: 's6', component: S6Page, title: 'S6 — Filtres : dérivation synchrone, sans requête' }` |
| Lien | `<a routerLink="/s6" routerLinkActive="active">S6 Filtres</a>` |

La logique de filtre et de tri est la même des deux côtés : seule la plomberie réactive change.
Créez d'abord `src/app/scenarios/s6-filters/filters.ts`, la fonction pure partagée :

```ts
import { HousingLocationInfo } from '../../housinglocation';

export type SortKey = 'name' | 'price';

export function applyFilters(
  list: HousingLocationInfo[],
  city: string,
  maxPrice: number,
  sort: SortKey,
): HousingLocationInfo[] {
  const q = city.trim().toLowerCase();
  return list
    .filter((l) => (!q || l.city.toLowerCase().includes(q)) && l.price <= maxPrice)
    .sort((a, b) => (sort === 'price' ? a.price - b.price : a.name.localeCompare(b.name)));
}
```

(`filter` renvoie un **nouveau** tableau, donc le `sort` en place qui suit ne mute pas la liste
reçue : voir le piège 2 en fin de lab.)

### Côté RxJS (donné)

Créez `src/app/scenarios/s6-filters/s6-rxjs.ts` :

```ts
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
import { HousingLocationInfo } from '../../housinglocation';
import { HousingService } from '../../housing.service';
import { SortKey, applyFilters } from './filters';

@Component({
  selector: 'app-s6-rxjs',
  imports: [ReactiveFormsModule],
  template: `
    <input type="text" [formControl]="city" placeholder="Ville" />
    <input type="number" [formControl]="maxPrice" step="100" />
    <select [formControl]="sort">
      <option value="name">Tri : nom</option>
      <option value="price">Tri : prix</option>
    </select>
    <ul>
      @for (l of filtered(); track l.id) {
        <li>{{ l.name }} — {{ l.city }} — {{ l.price }} $</li>
      } @empty {
        <li class="status">Aucun résultat.</li>
      }
    </ul>
  `,
})
export class S6Rxjs {
  private readonly housingService = inject(HousingService);

  readonly city = new FormControl('', { nonNullable: true });
  readonly maxPrice = new FormControl(2000, { nonNullable: true });
  readonly sort = new FormControl<SortKey>('name', { nonNullable: true });

  readonly filtered = toSignal(
    combineLatest([
      this.housingService.getAllHousingLocations(),
      this.city.valueChanges.pipe(startWith(this.city.value)),
      this.maxPrice.valueChanges.pipe(startWith(this.maxPrice.value)),
      this.sort.valueChanges.pipe(startWith(this.sort.value)),
    ]).pipe(map(([list, city, maxPrice, sort]) => applyFilters(list, city, maxPrice, sort))),
    { initialValue: [] as HousingLocationInfo[] },
  );
}
```

| Morceau | Pourquoi il est là |
|---|---|
| `combineLatest([liste, ville, prix, tri])` | réémet la combinaison dès qu'**une** source change ; mais seulement une fois que **chaque** source a émis au moins une fois |
| `startWith(control.value)` sur chaque `valueChanges` | d'où les trois `startWith` : sans eux, rien ne sort tant que l'utilisateur n'a pas touché aux trois champs |
| `getAllHousingLocations()` dans le `combineLatest` | la seule source asynchrone ; elle émet une fois, la combinaison attend cette émission |
| `map(... => applyFilters(...))` | la dérivation ; tout ce qui est synchrone ici n'a pas besoin d'un flux, comparez avec l'autre volet |

### Côté signals (à vous)

Créez `src/app/scenarios/s6-filters/s6-signals.ts`. Contraintes : la liste par
`toSignal(this.housingService.getAllHousingLocations(), { initialValue: [] })` (une fois, c'est le
seul pont) ; trois signals `city`, `maxPrice`, `sort` ; un `computed` `filtered` qui appelle
`applyFilters`. Liez les champs comme vous voulez : `(input)="city.set(c.value)"` avec une
variable de template `#c`, `(input)="maxPrice.set(p.valueAsNumber || 0)"`, `(change)` sur le
`select`. Pas de code à trou ici : le volet entier tient en cinq lignes de logique (une ligne de
pont, trois signals, un `computed`), et c'est ce qu'il faut constater. Comptez-les.

> 📖 [combineLatest](https://rxjs.dev/api/index/function/combineLatest) ·
> [startWith](https://rxjs.dev/api/operators/startWith) ·
> [computed](https://angular.dev/guide/signals)

### Critère de réussite

Les deux volets réagissent pareil : tapez « oak », prix max 1400, tri par prix : deux résultats,
dans l'ordre 890 puis 1390. L'onglet Réseau ne montre **aucune** requête pendant la saisie (une
seule ligne `GET /api/locations` par volet, à sa création). Le volet signals tient en cinq lignes
de logique.

> 💡 **Tester :** après la saisie, les deux volets affichent :
>
> ```
> Seriously Safe Towns — Oakland — 890 $
> Hopeful Housing Solutions — Oakland — 1390 $
> ```

<details>
<summary>Ce qu'on retient</summary>

- La **dérivation synchrone** est le terrain naturel des signals : trois signals, un `computed`,
  pas de `startWith`, pas de `combineLatest`, pas de `subscribe`.
- En RxJS, le piège est l'**émission initiale** : `combineLatest` attend que chaque source ait
  émis ; un `startWith` oublié et la liste reste vide sans erreur.
- Le seul pont est à l'entrée (`toSignal(http)` une fois) : dès que la donnée est en mémoire,
  plus de RxJS.
</details>

---

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
