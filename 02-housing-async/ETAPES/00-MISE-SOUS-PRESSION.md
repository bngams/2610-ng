# 🌪️ Étape 0 — Mise sous pression

Vous repartez de l'application Housing terminée : dix logements, une recherche, une fiche, un
formulaire, des données servies par json-server et lues avec `fetch`. Elle marche, mais elle vit
dans un monde idéal : une seule ressource, une API qui répond en quelques millisecondes et ne se
trompe jamais. Dans ce monde-là, aucun problème asynchrone n'est visible.

Cette étape rend l'application plus réaliste en six gestes : plus de données, un proxy, des
modèles, un service sur `HttpClient`, un intercepteur qui ralentit et fait échouer certaines
requêtes, et des composants qui lisent des Observables. Rien de ce qui suit n'est un exercice : le
code est **donné**, vous le copiez et le lisez avec les tableaux qui l'accompagnent. Les
expériences commencent à l'étape suivante.

## 0.1 — L'API enrichie

Aujourd'hui, `api/db.json` ne contient que `/locations`. Les expériences de ce lab ont besoin de
plus : des avis et un agent à afficher sur la fiche, une disponibilité qui change, des
réservations à créer, et un prix sur chaque logement pour filtrer.

Ces données sont prêtes dans le dossier `assets/` du lab. Depuis la racine de votre projet `homes`,
remplacez la base par la version enrichie :

```bash
cp ../02-housing-async/assets/api/db.json api/db.json
```

json-server **écrit dans ce fichier** à chaque création ou modification, par exemple quand vous
réserverez un logement. Après quelques essais, la base ne sera donc plus dans son état de départ.
Pour pouvoir y revenir, gardez une copie de référence à côté :

```bash
cp ../02-housing-async/assets/api/db.seed.json api/db.seed.json
```

Il reste à rendre ce retour à zéro facile. Dans `package.json`, ajoutez un script `api:reset` à la
fin du bloc `"scripts"`, sans oublier la virgule sur la ligne `"api"` qui le précède :

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

| Ligne | Rôle |
|---|---|
| `"api"` | inchangée depuis le lab Init : json-server sert `api/db.json` sur le port 3000 et relit le fichier s'il change (`--watch`) |
| `"api:reset"` | recopie `db.seed.json` sur `db.json` avec Node, sans dépendre de `cp` (que l'invite de commandes Windows ne connaît pas, et c'est elle qui exécute les scripts npm) |

Voici ce que la base enrichie expose désormais, et à quoi chaque ressource servira :

| Endpoint | Ce qu'il renvoie | Servira à |
|---|---|---|
| `GET /locations` | les 10 logements, avec trois champs en plus : `price`, `type`, `agentId` | toute l'application |
| `GET /locations?city_like=chi` | les logements dont la ville contient « chi », sans tenir compte de la casse | la recherche |
| `GET /locations/:id` | un logement | la fiche détail |
| `GET /reviews?locationId=:id` | 3 à 5 avis pour ce logement | la fiche détail |
| `GET /agents/:id` | l'agent référencé par `location.agentId` | la fiche détail |
| `GET /availability/:locationId` | `{ available: boolean }` (l'`id` vaut le `locationId`) | le suivi de disponibilité |
| `PATCH /availability/:locationId` | bascule `available` sans éditer le fichier à la main | le suivi de disponibilité |
| `POST /bookings` | crée une réservation `{ locationId, at }` | la réservation |
| `GET /bookings?locationId=:id` | les réservations que le serveur a vraiment reçues | la réservation |

> ℹ️ json-server reste **épinglé en 0.17.4**, comme dans le lab Init. C'est cette version qui
> connaît le filtre `_like` utilisé par la recherche ; la branche 1.x a changé ses opérateurs.

Pour que json-server charge la nouvelle base, relancez-le : `Ctrl-C` puis `npm run api` dans le
terminal 1.

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
> Dans le terminal 3, `curl -s "http://localhost:3000/locations?city_like=chi" | grep '"city"'`
> renvoie deux lignes `"city": "Chicago",`. Et `curl -s http://localhost:3000/availability/3`
> renvoie :
>
> ```json
> {
>   "id": 3,
>   "locationId": 3,
>   "available": true,
>   "updatedAt": "2026-10-11T08:00:00Z"
> }
> ```

Gardez ce geste en tête, il servira plusieurs fois : pour repartir d'une base propre, faites
`Ctrl-C` sur le terminal de l'API, puis `npm run api:reset`, puis `npm run api`.

## 0.2 — Le proxy de développement

Le service du lab Init appelle `http://localhost:3000/locations` : une adresse absolue, celle de
json-server. Cela fonctionne en local, mais deux choses vont nous gêner. L'application et l'API
sont sur deux ports différents, donc deux origines, ce qui oblige à gérer CORS. Et l'intercepteur
que vous ajouterez en 0.5 a besoin de reconnaître les appels à l'API par un préfixe commun.

La solution est de faire passer les appels par le serveur de développement : l'application appelle
`/api/...` sur son propre port, et `ng serve` relaie vers json-server. Cette règle de relais tient
dans un petit fichier, à copier à la racine du projet :

```bash
cp ../02-housing-async/assets/proxy.conf.json proxy.conf.json
```

Voici son contenu :

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "pathRewrite": { "^/api": "" }
  }
}
```

| Clé | Rôle |
|---|---|
| `"/api"` | les requêtes concernées : toutes celles dont le chemin commence par `/api` |
| `target` | où les relayer : json-server |
| `secure: false` | json-server est en `http`, pas en `https` : on n'exige pas de certificat |
| `pathRewrite` | retire le préfixe au passage : `/api/locations` arrive chez json-server comme `/locations` |

Un fichier de proxy ne sert à rien tant que `ng serve` ne le connaît pas. Ouvrez `angular.json` :
dans le projet `homes`, la cible `serve` contient deux clés, `configurations` et
`defaultConfiguration`. Ajoutez-lui une troisième clé, `options`, qui pointe vers le fichier :

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

`ng serve` ne surveille pas `angular.json` : une modification de ce fichier n'est prise en compte
qu'au redémarrage. Faites `Ctrl-C` puis `npm start` dans le terminal 2.

> 💡 **Tester :** `curl -s http://localhost:4200/api/locations/3 | head -3` renvoie
> `{ "id": 3, "name": "Homesteady Housing", …`. La requête est partie vers le port 4200, celui de
> l'application, et c'est json-server qui a répondu.

## 0.3 — Les modèles

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
  /** Loyer mensuel (ajouté pour ce lab : les filtres). */
  price: number;
  /** 'apartment' | 'studio' | 'house' (ajouté pour ce lab). */
  type: 'apartment' | 'studio' | 'house';
  /** Référence vers /agents/:id (ajouté pour ce lab : la fiche détail). */
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

## 0.4 — Le service : de `fetch` à `HttpClient`

Le lab Init termine sur `fetch` + `await`. On le remplace par `HttpClient`, pour trois raisons qui
sont exactement ce dont les expériences auront besoin :

| Pourquoi | Ce que ça change pour la suite |
|---|---|
| Un `Observable` est **froid et annulable** : se désabonner, c'est abandonner la requête | sans ça, impossible d'abandonner une requête devenue inutile : c'est le cœur de la recherche et de la réservation |
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
| `this.http.post<T>(url, body)` | une mutation : le serveur crée une ligne ; cliquée trois fois vite, elle en crée peut-être trois |

Le terminal de `ng serve` affiche maintenant des erreurs dans `home.ts` et `details.ts` : les
composants attendent une `Promise`, ils reçoivent un `Observable`. C'est 0.6 ; d'abord
l'intercepteur, puisque c'est lui qu'on branche dans `app.config.ts`.

## 0.5 — L'intercepteur chaos

Sans latence ni erreur, aucun problème asynchrone n'est visible : une recherche annulée sur une API qui
répond en 5 ms ne s'annule jamais, un `forkJoin` sur trois appels instantanés ne montre pas de
squelette, et un bouton cliqué trois fois sur un POST de 2 ms ne fait pas de course. D'où
l'intercepteur « chaos » : il ajoute une attente aléatoire avant chaque requête et peut la remplacer
par une erreur. Ses deux fichiers sont prêts dans `assets/`. Créez leur dossier et copiez-les :

```bash
mkdir -p src/app/chaos
cp ../02-housing-async/assets/chaos/chaos.config.ts ../02-housing-async/assets/chaos/chaos.interceptor.ts src/app/chaos/
```

Copier l'intercepteur ne suffit pas : il faut le déclarer là où Angular fournit `HttpClient`.
Remplacez `src/app/app.config.ts` en entier :

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
  // Les avis : passez errorRate à 0.5 pour qu'ils échouent une fois sur deux.
  { match: /\/api\/reviews/, minDelayMs: 300, maxDelayMs: 1500, errorRate: 0 },
  // Les réservations : décommentez pour que trois clics rapides soient faisables à la souris.
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

## 0.6 — `Home` et `Details` lisent un Observable

Le lab Init faisait `then(...)` puis `markForCheck()` pour prévenir Angular qu'une propriété
ordinaire avait changé. Avec un Observable, deux formes sont possibles dans un composant ; ce lab
prend la première partout où la donnée est un **état** à afficher, et réserve la seconde aux
**événements** (un clic, un minuteur) :

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

➡️ [01 — Recherche : anti-rebond et annulation](01-RECHERCHE.md)
