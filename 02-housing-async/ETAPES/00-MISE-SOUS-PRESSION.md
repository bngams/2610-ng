# 🌪️ Étape 0 — Mise sous pression

Vous repartez de l'application Housing telle que le lab Init la laisse à l'étape 17 : dix
logements, une recherche, une fiche, un formulaire, des données servies par json-server et lues
avec `HttpClient`, deux intercepteurs (le journal et « Loading… ») et l'adresse de l'API dans
`environment.ts`. Elle marche, mais elle vit dans un monde idéal : une seule ressource, une API
qui répond en quelques millisecondes et ne se trompe jamais. Dans ce monde-là, aucun problème
asynchrone n'est visible.

> ℹ️ **Vous n'avez pas fait le lab Init, ou pas son étape 17 (facultative) ?** Partez de
> `02-housing-init/solution` : c'est exactement le projet que cette étape suppose (voir la mise
> en place du [README](../README.md)).

Cette étape rend l'application plus réaliste en cinq gestes : plus de données, un proxy, des
modèles, un service qui couvre toute l'API, et un intercepteur qui ralentit et fait échouer
certaines requêtes. Une ligne ajoutée à la fiche détail termine l'étape. Rien de ce qui suit n'est un exercice : le code est **donné**, vous le copiez
et le lisez avec les tableaux qui l'accompagnent. Les expériences commencent à l'étape suivante.

## 0.1 — L'API enrichie

Aujourd'hui, `api/db.json` ne contient que `/locations`. Les expériences de ce lab ont besoin de
plus : des avis et un agent à afficher sur la fiche, une disponibilité qui change, des
réservations à créer, et un prix sur chaque logement pour filtrer.

Ces données sont prêtes dans [`assets/api/db.json`](../assets/api/db.json) : ouvrez-le pour voir
les cinq ressources et leurs champs. Depuis la racine de votre projet `homes`, remplacez la base
par cette version enrichie :

```bash
cp ../02-housing-async/assets/api/db.json api/db.json
```

json-server **écrit dans ce fichier** à chaque création ou modification, par exemple quand vous
réserverez un logement. Après quelques essais, la base ne sera donc plus dans son état de départ.
Pour pouvoir y revenir, gardez à côté une copie de référence,
[`assets/api/db.seed.json`](../assets/api/db.seed.json), identique à la base de départ :

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

## 0.2 — Le proxy de développement, et `apiUrl: '/api'`

Depuis l'étape 17 du lab Init, le service construit ses adresses à partir de
`environment.apiUrl`, qui vaut `http://localhost:3000` : une adresse absolue, celle de
json-server. Cela fonctionne en local, mais deux choses vont nous gêner. L'application (port 4200)
et l'API (port 3000) sont deux **origines** différentes, ce qui oblige le navigateur à appliquer
les règles CORS. Et l'intercepteur « chaos », que vous ajouterez plus loin dans cette étape, a
besoin de reconnaître les appels à l'API par un préfixe commun.

La solution est de faire passer les appels par le serveur de développement : l'application appelle
`/api/...` sur son propre port, et `ng serve` relaie vers json-server. Cette règle de relais tient
dans un petit fichier, [`assets/proxy.conf.json`](../assets/proxy.conf.json), à copier à la racine
du projet :

```bash
cp ../02-housing-async/assets/proxy.conf.json proxy.conf.json
```

Il ne contient qu'une règle : toute requête dont le chemin commence par `/api` part vers
json-server, sans ce préfixe. La voici, détaillée clé par clé dans le tableau qui suit :

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
dans le projet `homes`, la cible `serve` contient `builder`, `configurations` et
`defaultConfiguration`. Ajoutez-lui une clé `options`, qui pointe vers le fichier :

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

Le relais existe, mais l'application appelle toujours `http://localhost:3000` en direct. C'est le
moment de changer la valeur d'environnement, et non le service : le service lit déjà
`environment.apiUrl`, c'est précisément à cela que sert l'étape 17. Remplacez le contenu de
`src/environments/environment.development.ts` par celui-ci :

```ts
export const environment = {
  apiUrl: '/api',
};
```

Faites de même dans `src/environments/environment.ts`, avec exactement le même contenu : les deux
fichiers doivent garder les mêmes propriétés, et ici la même valeur.

| Choix | Pourquoi |
|---|---|
| `'/api'` et plus `http://localhost:3000` | une adresse **relative** : le navigateur appelle la même origine que la page (`localhost:4200`), donc plus de CORS ; c'est `ng serve` qui relaie |
| la même valeur dans les **deux** fichiers | en production il n'y a pas de `ng serve`, donc pas de proxy : c'est alors le serveur web qui sert l'application (nginx, un reverse proxy…) qui jouerait ce rôle sur `/api`. Si votre API publique est ailleurs, `environment.ts` recevrait son adresse complète |
| `'/api'` et pas `'/api/'` | le service ajoute lui-même le `/` : `` `${environment.apiUrl}/locations` `` donne `/api/locations` |

Les fichiers d'environnement sont du code source, pas de la configuration de `ng serve` : cette
fois, pas besoin de redémarrer, l'application se recharge seule.

> 💡 **Tester :** `curl -s http://localhost:4200/api/locations/3 | head -3` renvoie
> `{ "id": 3, "name": "Homesteady Housing", …`. La requête est partie vers le port 4200, celui de
> l'application, et c'est json-server qui a répondu. Dans la console du navigateur, l'intercepteur
> de journal du lab Init écrit maintenant `GET /api/locations => 200 (13 ms)` : l'adresse est
> relative, la réponse arrive par le proxy.

## 0.3 — Les modèles

Les nouvelles ressources ont besoin de types. Remplacez `src/app/housinglocation.ts` par la
version complète : `HousingLocationInfo` gagne les trois champs de la base enrichie, et quatre
interfaces arrivent pour les nouvelles ressources.

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

## 0.4 — Le service couvre toute l'API

Le `HousingService` du lab Init sait lire la liste et un logement. Les expériences ont besoin de
six méthodes de plus : la recherche par ville, les avis, l'agent, la disponibilité, la création et
la lecture des réservations. Remplacez `src/app/housing.service.ts` en entier : les deux méthodes
du lab Init et `submitApplication` sont inchangées, `environment.apiUrl` reste la seule source de
l'adresse.

```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Agent, Availability, Booking, HousingLocationInfo, Review } from './housinglocation';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class HousingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  readonly url = `${this.apiUrl}/locations`;

  getAllHousingLocations(): Observable<HousingLocationInfo[]> {
    return this.http.get<HousingLocationInfo[]>(this.url);
  }

  getHousingLocationById(id: number): Observable<HousingLocationInfo> {
    return this.http.get<HousingLocationInfo>(`${this.url}/${id}`);
  }

  /** Recherche par ville, côté serveur (json-server 0.17 : `?city_like=` est une regex insensible à la casse). */
  searchByCity(query: string): Observable<HousingLocationInfo[]> {
    return this.http.get<HousingLocationInfo[]>(this.url, { params: { city_like: query } });
  }

  getReviews(locationId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/reviews`, { params: { locationId } });
  }

  getAgent(agentId: number): Observable<Agent> {
    return this.http.get<Agent>(`${this.apiUrl}/agents/${agentId}`);
  }

  getAvailability(locationId: number): Observable<Availability> {
    return this.http.get<Availability>(`${this.apiUrl}/availability/${locationId}`);
  }

  /** Réserve : un POST qui crée une ligne dans /bookings (json-server l'écrit dans db.json). */
  book(locationId: number): Observable<Booking> {
    const body: Booking = { locationId, at: new Date().toISOString() };
    return this.http.post<Booking>(`${this.apiUrl}/bookings`, body);
  }

  getBookings(locationId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/bookings`, { params: { locationId } });
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
| `apiUrl = environment.apiUrl` | `'/api'` depuis 0.2 ; privé, la base commune à toutes les ressources |
| `url` | inchangé depuis le lab Init : l'adresse des logements, `/api/locations` |
| `{ params: { city_like: query } }` | `HttpClient` encode la query string ; les intercepteurs verront `/api/locations?city_like=Jun` |
| `this.http.post<T>(url, body)` | une mutation : le serveur crée une ligne ; cliquée trois fois vite, elle en crée peut-être trois |
| un `Observable` par méthode | **froid et annulable** : rien ne part avant l'abonnement, et se désabonner abandonne la requête. C'est le cœur de la recherche et de la réservation |

> ⚖️ Ce service répète huit fois le même motif, `` this.http.get<T>(`${…}/ressource`) `` (ou
> `post` pour la réservation), et chaque
> nouvelle ressource ajoutera ses méthodes. On l'accepte pour les expériences ; l'étape 08 le
> factorise en une classe générique.

L'application tourne toujours à l'identique : `Home` et `Details` appellent les deux méthodes qui
n'ont pas changé.

## 0.5 — L'intercepteur chaos

Sans latence ni erreur, aucun problème asynchrone n'est visible : une recherche annulée sur une
API qui répond en 5 ms ne s'annule jamais, un `forkJoin` sur trois appels instantanés ne montre
pas de squelette, et un bouton cliqué trois fois sur un POST de 2 ms ne fait pas de course. D'où
l'intercepteur « chaos » : il ajoute une attente aléatoire avant chaque requête et peut la
remplacer par une erreur. Ses deux fichiers sont prêts dans `assets/chaos/` :
[`chaos.interceptor.ts`](../assets/chaos/chaos.interceptor.ts), l'intercepteur lui-même, et
[`chaos.config.ts`](../assets/chaos/chaos.config.ts), ses réglages par route. Créez leur dossier et
copiez-les :

```bash
mkdir -p src/app/chaos
cp ../02-housing-async/assets/chaos/chaos.config.ts ../02-housing-async/assets/chaos/chaos.interceptor.ts src/app/chaos/
```

### Où le placer dans la chaîne

Copier l'intercepteur ne suffit pas : il faut l'ajouter au tableau `withInterceptors([...])` de
`src/app/app.config.ts`, qui contient déjà vos deux intercepteurs du lab Init. Ne remplacez pas le
fichier : vous perdriez le journal et « Loading… ». Ajoutez l'import sous les deux existants,
puis `chaosInterceptor` **à la fin** du tableau :

```ts
import { loggingInterceptor } from './logging-interceptor';
import { loadingInterceptor } from './loading-interceptor';
import { chaosInterceptor } from './chaos/chaos.interceptor';

// …dans providers :
    provideHttpClient(withInterceptors([loggingInterceptor, loadingInterceptor, chaosInterceptor])),
```

Pourquoi à la fin ? Vous l'avez vu à l'étape 16 du lab Init : le premier du tableau est le plus
« extérieur », il voit passer tout ce que font les suivants. Le chaos attend **avant** d'appeler
`next(req)` ; placé en dernier, cette attente se passe **à l'intérieur** des deux autres :

| Ordre | `loggingInterceptor` mesure… | « Loading… » s'affiche… | un 503 du chaos… |
|---|---|---|---|
| `[logging, loading, chaos]` (retenu) | la latence du chaos + le réseau, ce que vit l'utilisateur | pendant toute l'attente | est journalisé `=> 503` |
| `[chaos, logging, loading]` | le réseau seul, quelques millisecondes | quelques millisecondes, invisible | n'est **pas** journalisé : le chaos lève l'erreur sans jamais appeler `next`, les deux autres ne sont pas exécutés |

Le chaos simule une API lente ou en panne : il doit se placer au plus près du réseau, là où
serait la vraie lenteur. Les intercepteurs qui observent (journal, indicateur) restent au-dessus.

> **🧪 Manip — voir l'effet de l'ordre**
>
> 1. Avec l'ordre retenu, cliquez sur **Learn More** d'une carte : la console montre une paire de
>    lignes, `[chaos] GET /api/locations/0 +391ms` puis `GET /api/locations/0 => 200 (408 ms)`, et
>    « Loading… » reste affiché pendant ces 400 ms environ.
> 2. Mettez `chaosInterceptor` en **premier** dans le tableau et refaites le même clic.
> 3. Observez la durée du journal et le bandeau.
>
> *Observé : `[chaos] GET /api/locations/0 +892ms` suivi de `GET /api/locations/0 => 200 (10 ms)` :
> le journal ne voit plus que le réseau, et « Loading… » ne s'affiche plus pendant l'attente.*
>
> Remettez `chaosInterceptor` en dernier avant de continuer.

### Le réglage

Le réglage est dans `src/app/chaos/chaos.config.ts`, et c'est le seul fichier du chaos que vous
toucherez pendant le lab. En voici l'essentiel, simplifié (le fichier complet, avec l'interface
`ChaosRule` et les types, est celui que vous venez de copier) :

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
| `match` | une RegExp testée sur l'URL complète (avec query string), ou un préfixe de chaîne ; la première règle qui correspond gagne, sinon `CHAOS_DEFAULT`. C'est ici que sert le préfixe `/api` du proxy |
| `minDelayMs` / `maxDelayMs` | la fourchette de latence, tirée au hasard à chaque appel |
| `errorRate` | la probabilité (0 à 1) de remplacer la requête par une `HttpErrorResponse` 503 |

`CHAOS_ENABLED = false` rend l'API normale : utile pour vérifier qu'un bug vient bien du chaos.

### Lire le log

Un point d'implémentation compte pour toute la suite, à lire dans `chaos.interceptor.ts` :
**le délai est placé avant l'envoi** (`timer(délai)` puis `switchMap(() => next(req))`), pas après
la réponse. Conséquence : quand un `switchMap` ou un `resource` se désabonne pendant l'attente, la
requête **ne part jamais**, et l'intercepteur le logue. Vous verrez l'une de ces trois lignes du
chaos dans la console du navigateur, chacune suivie de la ligne du journal :

```
[chaos] GET /api/reviews?locationId=3 +842ms                  <- partie, répondue, après 842 ms d'attente
[chaos] GET /api/reviews?locationId=3 => 503 (après 537 ms)   <- remplacée par une erreur
[chaos] GET /api/locations?city_like=Jun => annulée           <- désabonnée avant la réponse
```

Le journal du lab Init ajoute sa propre ligne à chaque fois : `=> 200 (…)`, `=> 503 (…)`, ou
`=> 0 (…)` pour une requête annulée, puisqu'aucune réponse n'est arrivée. Pour ne lire que le
chaos, filtrez la console sur `chaos` ; pour voir les deux, filtrez sur `/api/`.

Il faut deux précisions pour lire les preuves correctement. Une requête désabonnée **après**
l'envoi est aussi loguée « annulée » (la réponse est jetée) : c'est l'onglet Réseau qui dit si
elle est partie (elle y apparaît *canceled*) ou non (elle n'y est pas). Et un 503 du chaos
**n'apparaît jamais dans l'onglet Réseau**, puisque la requête n'est pas envoyée : pour les
erreurs, la preuve est la console.

## 0.6 — `Home` et `Details`

`Home` et `Details` lisent déjà un Observable avec `toSignal` : c'est déjà fait à l'étape 15 du
lab Init, et c'est la forme que ce lab garde partout où la donnée est un **état** à afficher. Il
n'y a donc rien à migrer. Seule la fiche gagne une ligne, pour afficher le loyer que la base
enrichie vient d'apporter. Dans le template de `src/app/details/details.ts`, ajoutez cette ligne
juste après celle de `laundry`, dans la liste `<ul>` :

```html
          <li>Monthly rent: {{ housingLocation()?.price }} $</li>
```

Le `?.` reste nécessaire : sans `initialValue`, le signal vaut `undefined` le temps de la requête,
donc maintenant aussi le temps du chaos (jusqu'à 1,5 s : vous le verrez).

**Critère de réussite de l'étape 0.** L'app fait exactement ce qu'elle faisait à la fin du lab
Init (dix cartes, recherche, fiche, formulaire, « Loading… »), avec un délai visible avant chaque
affichage, et la console montre le chaos à l'œuvre.

> 💡 **Tester :** ouvrez `http://localhost:4200/`, console ouverte avec le filtre `/api/` :
>
> ```
> [chaos] GET /api/locations +1127ms
> GET /api/locations => 200 (1452 ms)
> ```
>
> avec un délai différent à chaque rechargement, et « Loading… » visible pendant l'attente.
> `/details/3` affiche `Monthly rent: 1100 $` (la base enrichie est bien servie). Puis passez
> `errorRate` à `1` dans `CHAOS_DEFAULT` et rechargez `/details/3` : la fiche reste vide, avec
> `[chaos] GET /api/locations/3 => 503 (après 995 ms)`, `GET /api/locations/3 => 503 (998 ms)`
> et une erreur rouge `ERROR {headers: HttpHeaders, status: 503, statusText: Service Unavailable
> (chaos), …}` (`toSignal` relance l'erreur quand le template lit le signal : c'est attendu).
> **Remettez `0`** avant de continuer.

---

➡️ [01 — Recherche : anti-rebond et annulation](01-RECHERCHE.md)
