# 14 — HTTP : les données viennent d'une API

> Dernière étape du tutoriel officiel : les 10 logements quittent le code pour une **API locale**, `json-server`, qui
> les sert sur http://localhost:3000/locations. Le service va les chercher avec `fetch`, et comme
> une requête réseau prend du temps, `Home` et `Details` apprennent à attendre une réponse.

## ✨ Ce que vous apprenez

- Lancer une API REST factice en une commande (`json-server`), et la lire dans le navigateur.
- `async` / `await` / `fetch` : une méthode de service qui renvoie une `Promise`.
- Pourquoi `markForCheck()` : prévenir Angular qu'une donnée a changé après une attente.

> 📖 Étape officielle : [14-http](https://angular.dev/tutorials/first-app/14-http) ·
> [json-server 0.17 (npm)](https://www.npmjs.com/package/json-server/v/0.17.4) ·
> [fetch (MDN)](https://developer.mozilla.org/docs/Web/API/Fetch_API/Using_Fetch)

## 🗄️ 1 — L'API locale

Dans le second terminal, à la racine du projet, installez `json-server` **dans le projet** (le
tutoriel officiel l'installe en global avec `-g` ; en dépendance du projet, chacun a la même version) :

```bash
npm install -D json-server@0.17.4
```

| Morceau | Rôle |
|---|---|
| `-D` | dépendance de développement : utile pour travailler, pas livrée avec l'app |
| `@0.17.4` | la version pinnée : la version 1 de json-server a changé ses options (`--watch` a disparu) ; on reste sur celle du tutoriel |

Créez le dossier `api/` à la racine du projet (à côté de `src/`) et dedans le fichier `db.json`,
avec le contenu de [`assets/db.json`](../assets/db.json) : un objet `{ "locations": [ … ] }` avec les 10 logements, les
mêmes qu'à l'étape 8, photos comprises (toujours sur `angular.dev`). Puis ajoutez un script dans
`package.json` : le bloc `"scripts"` doit devenir celui-ci (la ligne `"api"` est nouvelle, et la
virgule à la fin de la ligne `"test"` aussi) :

```json
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "api": "json-server --watch api/db.json --port 3000"
  },
```

Lancez l'API dans un **troisième terminal** (elle doit tourner en même temps que `ng serve`) :

```bash
npm run api
```

json-server affiche sa bannière ; elle liste les ressources qu'il a trouvées dans `db.json`, ici
une seule :

```
  \{^_^}/ hi!

  Loading api/db.json
  Done

  Resources
  http://localhost:3000/locations
```

> 💡 **Tester :** ouvrez http://localhost:3000/locations : le navigateur affiche les 10 logements
> en JSON. Et http://localhost:3000/locations/3 : le seul logement d'`id` 3. Chaque clé de `db.json`
> devient une ressource ; `/locations/:id` est offert par json-server.

## 🌐 2 — Le service interroge l'API

Dans `src/app/housing.service.ts`, **supprimez** `readonly baseUrl = …` et tout le tableau
`housingLocationList` (de `protected` à `];`). Remplacez les deux méthodes de lecture par leur
version asynchrone ; gardez `submitApplication`. Le service complet doit ressembler à ceci :

```ts
import { Injectable } from '@angular/core';
import { HousingLocationInfo } from './housinglocation';

@Injectable({ providedIn: 'root' })
export class HousingService {
  url = 'http://localhost:3000/locations';

  async getAllHousingLocations(): Promise<HousingLocationInfo[]> {
    const data = await fetch(this.url);
    return (await data.json()) ?? [];
  }

  async getHousingLocationById(id: number): Promise<HousingLocationInfo | undefined> {
    const data = await fetch(`${this.url}/${id}`);
    const locationJson = await data.json();
    // json-server renvoie {} pour un id inconnu : on garde le code du tutoriel,
    // un vrai service renverrait undefined (d'où le `| undefined` de l'étape 11)
    return locationJson ?? {};
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
| `async … : Promise<…>` | la méthode ne renvoie plus la liste, mais une **promesse** de liste : la réponse arrivera plus tard |
| `await fetch(this.url)` | envoie la requête GET et attend la réponse HTTP |
| `await data.json()` | lit le corps de la réponse et le convertit en objets JavaScript |
| `` `${this.url}/${id}` `` | `http://localhost:3000/locations/3` : l'URL d'un seul logement |

> 💡 **Tester :** le terminal de `ng serve` affiche des erreurs dans `home.ts` et `details.ts`
> (une erreur de type `Promise<…>` dans chacun : `TS2740` dans `home.ts`, `TS2322` dans `details.ts`) : les composants attendent encore une
> liste, ils reçoivent une promesse. C'est la partie 3.

## ⏳ 3 — Les composants attendent la réponse

Dans `src/app/home/home.ts`, la modification se fait en trois temps. Commencez par la ligne
d'import de `@angular/core`, en haut du fichier : remplacez-la par celle-ci, qui ajoute
`ChangeDetectorRef` :

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';
```

Ajoutez ensuite cette ligne dans la classe `Home`, juste sous `housingService`. Elle demande à
Angular l'outil qui permet de le prévenir d'un changement (le tableau plus bas explique pourquoi).

```ts
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
```

Enfin, remplacez tout le constructeur par celui-ci : au lieu de recevoir la liste directement, il
attend la réponse de l'API, puis remplit les deux listes.

```ts
  constructor() {
    this.housingService
      .getAllHousingLocations()
      .then((housingLocationList: HousingLocationInfo[]) => {
        this.housingLocationList = housingLocationList;
        this.filteredLocationList = housingLocationList;
        this.changeDetectorRef.markForCheck();
      });
  }
```

Faites les mêmes gestes dans `src/app/details/details.ts` : ajoutez `ChangeDetectorRef` dans la
ligne d'import de `@angular/core`, ajoutez la même ligne
`private readonly changeDetectorRef = inject(ChangeDetectorRef);` sous `housingService`, puis
remplacez le constructeur par celui-ci :

```ts
  constructor() {
    const housingLocationId = Number(this.route.snapshot.params['id']);
    this.housingService.getHousingLocationById(housingLocationId).then((housingLocation) => {
      this.housingLocation = housingLocation;
      this.changeDetectorRef.markForCheck();
    });
  }
```

| Morceau | Rôle |
|---|---|
| `.then((liste) => { … })` | le code entre accolades s'exécute **quand la réponse arrive** ; le constructeur, lui, se termine tout de suite |
| `this.changeDetectorRef.markForCheck()` | votre app est *zoneless* (sans zone.js, le défaut depuis la v21) : Angular n'est pas prévenu qu'une propriété ordinaire a changé dans un `then`. Cet appel le prévient, et la page se met à jour |

> 💡 **Tester :** avec `npm run api` et `ng serve` lancés, la liste des 10 cartes revient, la
> recherche et la page de détail marchent comme avant. Dans l'onglet *Réseau* (F12), vous voyez la
> requête `locations` vers `localhost:3000`. Enlevez `this.changeDetectorRef.markForCheck();` dans
> `Home`, rechargez : plus aucune carte, sans erreur ; remettez-le.

## 📊 `fetch` ou `HttpClient` ?

`fetch` n'est pas la seule façon d'appeler une API dans une application Angular. Ce tableau le
compare à `HttpClient`, l'outil fourni par Angular lui-même :

| | `fetch` (ce lab) | `HttpClient` d'Angular |
|---|---|---|
| Vient de | le navigateur | `@angular/common/http`, à activer avec `provideHttpClient()` |
| Renvoie | une `Promise` | un `Observable` (RxJS), ou un signal avec `httpResource` |
| Pour | découvrir, un script simple | une vraie app : intercepteurs (jeton d'auth, erreurs), tests, annulation |

Le tutoriel officiel choisit `fetch` pour sa simplicité. L'étape 15 migre l'application sur
`HttpClient` ; avec un `signal` à la place des propriétés, `markForCheck()` y devient inutile.

## ⚠️ Pièges

> ⚠️ **`TypeError: Failed to fetch`** (console du navigateur), plus aucune carte.
> Symptôme : liste vide, erreur rouge dans la console.
> Cause : `json-server` n'est pas lancé, ou pas sur le port 3000.
> Correctif : `npm run api` dans son terminal, puis rechargez.

> ⚠️ **`npm run api` répond `Missing script: "api"`.**
> Symptôme : le script n'existe pas.
> Cause : la ligne n'est pas dans `package.json`, ou vous n'êtes pas dans le dossier `homes/`.
> Correctif : vérifiez le JSON (virgules !) et le dossier courant.

## Récap

- Une API REST factice : `json-server --watch api/db.json`, chaque clé de `db.json` devient une ressource.
- Service `async` + `fetch` ; composant `.then(...)` + `markForCheck()` (ou un signal).
- Vous avez terminé le tutoriel officiel : 3 composants, 1 interface, 1 service, 2 routes, 1 formulaire, 1 API.

➡️ [15 — Passer à `HttpClient`](15-HTTPCLIENT.md)
