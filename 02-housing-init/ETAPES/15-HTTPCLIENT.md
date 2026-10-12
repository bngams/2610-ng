# 15 — Passer à `HttpClient`

> Le tutoriel officiel s'arrête à l'étape 14 : l'application lit l'API avec `fetch`, et chaque
> composant prévient Angular à la main avec `markForCheck()`. Ce matin, vous avez vu en démo l'outil
> qu'Angular fournit pour cela, `HttpClient`. Dans cette étape, vous le mettez en pratique sur votre
> projet : le service renvoie des `Observable`, `Home` et `Details` les lisent avec `toSignal`, et
> `markForCheck()` disparaît.

> **Notion nouvelle, guidage complet.** Chaque fichier touché est donné en entier ou ligne par
> ligne, comme aux étapes 9 à 14. Gardez `npm run api` et `ng serve` lancés pendant toute l'étape.

## ✨ Ce que vous apprenez

- Activer `HttpClient` avec `provideHttpClient()` et l'injecter dans un service avec `inject(HttpClient)`.
- Ce qu'est un `Observable` **froid** : la requête ne part que lorsque quelqu'un s'y abonne.
- `toSignal()` : transformer un `Observable` en signal, lu dans le template avec `()`.
- `signal` + `computed` pour la recherche : la liste filtrée se recalcule toute seule.
- Pourquoi `markForCheck()` n'est plus nécessaire dans une application *zoneless*.

> 📖 [Configurer HttpClient](https://angular.dev/guide/http/setup) ·
> [Faire des requêtes](https://angular.dev/guide/http/making-requests) ·
> [`toSignal`](https://angular.dev/ecosystem/rxjs-interop) ·
> [`computed`](https://angular.dev/guide/signals)

## 🔌 1 — Activer `HttpClient`

`HttpClient` est le client HTTP d'Angular, dans le paquet `@angular/common/http` (déjà installé par
`ng new`). On le déclare dans `src/app/app.config.ts`, le fichier qui contient déjà
`provideRouter(routes)` depuis l'étape 10. **Remplacez tout son contenu** par celui-ci : il ajoute
une ligne d'import et une ligne dans `providers`.

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
  ]
};
```

| Morceau | Rôle |
|---|---|
| `provideHttpClient()` | déclare `HttpClient` pour toute l'application ; c'est aussi l'endroit où vous brancherez les intercepteurs à l'étape 16 |
| `providers: [ … ]` | la liste des services et réglages de l'application, lue au démarrage par `bootstrapApplication` (dans `main.ts`) |

> ℹ️ En Angular 22, `HttpClient` est fourni par défaut : sans cette ligne, l'application
> fonctionnerait aussi. On l'écrit pourtant, pour deux raisons :
> c'est là que se configure `HttpClient` (les intercepteurs de l'étape 16 passent par elle), et la
> documentation comme la plupart des projets existants la contiennent. Vous lirez aussi parfois
> `provideHttpClient(withFetch())` : en Angular 22, cette option est marquée obsolète, car
> `HttpClient` utilise déjà `fetch` en interne.

## 🌐 2 — Le service renvoie des `Observable`

Le service de l'étape 14 renvoie des `Promise` construites avec `fetch`. Avec `HttpClient`, chaque
méthode renvoie un `Observable` : un objet qui décrit la requête, et qui la lance quand on
s'abonne à lui. Ouvrez `src/app/housing.service.ts` et **remplacez tout son contenu** par celui-ci
(`submitApplication` ne change pas) :

```ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HousingLocationInfo } from './housinglocation';

@Injectable({ providedIn: 'root' })
export class HousingService {
  private readonly http = inject(HttpClient);
  readonly url = 'http://localhost:3000/locations';

  getAllHousingLocations(): Observable<HousingLocationInfo[]> {
    return this.http.get<HousingLocationInfo[]>(this.url);
  }

  getHousingLocationById(id: number): Observable<HousingLocationInfo> {
    return this.http.get<HousingLocationInfo>(`${this.url}/${id}`);
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
| `inject(HttpClient)` | demande le client HTTP à Angular, comme `inject(HousingService)` à l'étape 9 ; `private` : seul le service s'en sert |
| `this.http.get<HousingLocationInfo[]>(url)` | prépare une requête GET ; le type entre `< >` dit ce que contiendra la réponse, et `HttpClient` convertit le JSON lui-même (plus de `data.json()`) |
| `Observable<…>` | le type de retour : une réponse **à venir**, comme la `Promise` de l'étape 14, mais qui ne part qu'à l'abonnement (voir la manip plus bas) |
| plus de `async` / `await` | la méthode renvoie l'`Observable` tout de suite ; c'est le composant qui décidera quand s'abonner |

Les noms des méthodes ne changent pas : seul leur type de retour change. Ce qui va casser, ce sont
les deux composants, qui appellent encore `.then(…)`.

> 💡 **Tester :** enregistrez. Le terminal de `ng serve` affiche trois erreurs :
> `TS2339: Property 'then' does not exist on type 'Observable<HousingLocationInfo[]>'` dans
> `home.ts`, la même avec `Observable<HousingLocationInfo>` dans `details.ts`, et, toujours dans
> `details.ts`, `TS7006: Parameter 'housingLocation' implicitly has an 'any' type`, une
> conséquence de la précédente. Un `Observable` n'a pas de `then` : les parties 3 et 4 font
> disparaître les trois erreurs.

## 🏠 3 — `Home` lit la liste avec `toSignal`

Dans `Home`, la liste va devenir un **signal** : une valeur qu'Angular surveille, et dont il sait
qu'elle a changé sans que vous le préveniez. La recherche suit le même chemin : le texte saisi
devient un signal, et la liste filtrée un `computed`, un signal calculé à partir des deux autres.

Ouvrez `src/app/home/home.ts`. Commencez par les imports, en haut du fichier : **remplacez toutes
les lignes `import`** par celles-ci. `ChangeDetectorRef` disparaît, `computed`, `signal` et
`toSignal` arrivent, et l'import de `HousingLocationInfo` n'est plus utile (le type est déduit du
service).

```ts
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HousingLocation } from '../housing-location/housing-location';
import { HousingService } from '../housing.service';
```

Dans le `template`, une seule ligne change, celle du `@for` : la liste filtrée est maintenant un
signal, on la lit donc avec des parenthèses. Remplacez la ligne `@for` par celle-ci :

```ts
      @for (housingLocation of filteredLocationList(); track $index) {
```

On garde `track $index`, celui du tutoriel, pour ne changer qu'une chose à la fois. Maintenant que
chaque logement vient de l'API avec un `id` unique, `track housingLocation.id` serait un meilleur
choix : Angular reconnaîtrait chaque carte quand la liste filtrée change, au lieu de se fier à sa
position.

Enfin, **remplacez toute la classe `Home`** (de `export class Home {` jusqu'à la dernière `}` du
fichier) par celle-ci. Le constructeur disparaît : tout se déclare dans les propriétés.

```ts
export class Home {
  housingService: HousingService = inject(HousingService);
  housingLocationList = toSignal(this.housingService.getAllHousingLocations(), {
    initialValue: [],
  });
  filterText = signal('');
  filteredLocationList = computed(() => {
    const text = this.filterText().toLowerCase();
    if (!text) {
      return this.housingLocationList();
    }
    return this.housingLocationList().filter((housingLocation) =>
      housingLocation.city.toLowerCase().includes(text),
    );
  });

  filterResults(text: string) {
    this.filterText.set(text);
  }
}
```

| Morceau | Rôle |
|---|---|
| `toSignal(obs, { initialValue: [] })` | **s'abonne** à l'`Observable` (c'est ce qui envoie la requête) et renvoie un signal qui contiendra la réponse ; `initialValue: []` est sa valeur tant que la réponse n'est pas arrivée, pour que le `@for` ait toujours un tableau |
| l'ordre des propriétés | `housingService` doit être déclaré **avant** `housingLocationList`, qui l'utilise : les propriétés sont initialisées de haut en bas |
| `filterText = signal('')` | le texte de recherche, vide au départ ; `filterResults` le remplace avec `.set(text)` |
| `computed(() => …)` | un signal **calculé** : Angular le recalcule quand `filterText()` ou `housingLocationList()` change. Le corps reprend la logique de l'étape 13 |
| `filteredLocationList()` dans le template | on lit un signal en l'appelant ; Angular note que le template en dépend |

Pourquoi `markForCheck()` n'est plus nécessaire ? Votre application est *zoneless* : Angular ne
surveille pas les propriétés ordinaires, c'est pourquoi l'étape 14 devait le prévenir après le
`then`. Un signal, lui, prévient Angular à chaque nouvelle valeur. Quand la réponse arrive,
`toSignal` écrit dans son signal, le `computed` se recalcule, et le template qui les lit est
redessiné, sans aucun appel de votre part.

> 💡 **Tester :** la page d'accueil affiche de nouveau 10 cartes. `oak` puis **Search** donne
> 4 cartes, `chicago` en donne 2, et un champ vide puis **Search** fait revenir les 10. Dans
> l'onglet *Réseau* (F12), la requête `locations` vers `localhost:3000` part une seule fois, au
> chargement : la recherche filtre la liste déjà reçue.

Un `Observable` est dit **froid** : tant que personne ne s'abonne, il ne fait rien. La manip
suivante vous le montre en deux temps, sur le bouton **Search**.

> **🧪 Manip — pas d'abonnement, pas de requête**
>
> 1. Dans `filterResults`, ajoutez provisoirement une ligne sous `this.filterText.set(text);` :
>    `this.housingService.getAllHousingLocations();`
> 2. Ouvrez l'onglet *Réseau* (F12), filtrez sur `locations`, puis cliquez trois fois sur **Search**.
> 3. Ajoutez `.subscribe()` au bout de la ligne (`…getAllHousingLocations().subscribe();`),
>    enregistrez, puis cliquez de nouveau trois fois sur **Search**.
>
> *Observé : au point 2, aucune nouvelle requête, l'`Observable` a été créé puis oublié. Au
> point 3, trois nouvelles requêtes `locations`, une par abonnement. `toSignal` fait ce
> `subscribe()` pour vous, une seule fois, et se désabonne quand le composant est détruit.*
>
> Supprimez la ligne ajoutée avant de continuer.

## 🔎 4 — `Details` lit un logement avec `toSignal`

`Details` suit le même schéma, avec une différence : pas de `initialValue`. Tant que la réponse
n'est pas arrivée, le signal vaut `undefined`, ce que le template sait déjà gérer grâce à `?.`
(étape 11).

Ouvrez `src/app/details/details.ts`. **Remplacez toutes les lignes `import`** par celles-ci :
`ChangeDetectorRef` et `HousingLocationInfo` disparaissent, `toSignal` arrive.

```ts
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HousingService } from '../housing.service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
```

**Remplacez ensuite toute la classe `Details`** (de `export class Details {` jusqu'à la dernière
`}` du fichier) par celle-ci. Le constructeur disparaît ;
`applyForm` et `submitApplication` ne changent pas.

```ts
export class Details {
  route: ActivatedRoute = inject(ActivatedRoute);
  housingService = inject(HousingService);
  housingLocationId = Number(this.route.snapshot.params['id']);
  housingLocation = toSignal(this.housingService.getHousingLocationById(this.housingLocationId));

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

| Morceau | Rôle |
|---|---|
| `housingLocationId = Number(…)` | la lecture de l'`id` de l'étape 11, devenue une propriété ; `route` est déclaré avant elle, puisqu'elle l'utilise |
| `toSignal(…)` sans `initialValue` | le signal vaut `undefined` jusqu'à la réponse ; son type est `Signal<HousingLocationInfo \| undefined>` |

Reste le template : `housingLocation` est maintenant un signal, chaque lecture doit donc l'appeler.
Avec la fonction *Rechercher et remplacer* de votre éditeur (Ctrl+H, ou Cmd+Alt+F sur Mac),
**dans `details.ts` uniquement**, remplacez `housingLocation?.` par `housingLocation()?.`. Il y a
8 remplacements ; le début du template doit alors ressembler à ceci :

```html
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
```

> 💡 **Tester :** le terminal de `ng serve` n'affiche plus d'erreur. Cliquez **Learn More** sur la
> sixième carte : `/details/5` affiche *Hopeful Apartment Group*, *Oakland, CA* et ses trois
> caractéristiques. Le formulaire écrit toujours `Homes application received: …` dans la console.
> Vérifiez enfin qu'il ne reste rien de l'étape 14 : recherchez `ChangeDetectorRef`, puis
> `markForCheck`, puis `fetch` dans `src/app/` avec la recherche globale de votre éditeur
> (Ctrl+Shift+F) ; aucune ne doit rien trouver.

## 📊 Ce que `HttpClient` vous apporte

Les deux versions affichent la même chose. Ce tableau résume ce que vous avez gagné en passant à
`HttpClient`, et pourquoi c'est l'outil qu'on choisit dans une vraie application Angular :

| | `fetch` (étape 14) | `HttpClient` (cette étape) |
|---|---|---|
| Ce que renvoie le service | une `Promise`, lancée dès l'appel | un `Observable` froid, lancé à l'abonnement |
| Conversion JSON et typage | `await data.json()`, à la main | automatique, typée par `get<T>()` |
| Intercepteurs (log, jeton, erreurs) | aucun : chaque appel est isolé | oui, pour toutes les requêtes : c'est l'étape 16 |
| Annulation | possible, mais à la main (`AbortController`) | se désabonner annule la requête ; `toSignal` le fait à la destruction du composant |
| Mise à jour de l'écran | `markForCheck()` après le `then` | automatique, via `toSignal` |
| Tests | il faut simuler `fetch` | `HttpTestingController` est fourni par Angular |

Les deux ne s'opposent pas complètement : depuis Angular 22, `HttpClient` envoie ses requêtes avec
`fetch`, en ajoutant tout ce qui précède. Il existe aussi une troisième forme, `httpResource`, qui
renvoie directement un signal ; elle repose sur `HttpClient` et ses intercepteurs, voir
[la documentation de `httpResource`](https://angular.dev/guide/http/http-resource).

## ⚠️ Pièges

> ⚠️ **`TS2729: Property 'housingService' is used before its initialization`.**
> Symptôme : erreur dans le terminal de `ng serve`, sur la ligne `toSignal(this.housingService…)`.
> Cause : la propriété `housingService` est déclarée **après** `housingLocationList`, qui l'utilise.
> Correctif : remontez `housingService: HousingService = inject(HousingService);` en première
> ligne de la classe (même règle pour `route` dans `Details`).

> ⚠️ **`TS2488: Type 'Signal<HousingLocationInfo[]>' must have a '[Symbol.iterator]()' method`.**
> Symptôme : erreur sur la ligne du `@for` de `Home`.
> Cause : `filteredLocationList` sans parenthèses : on parcourt le signal lui-même, pas sa valeur.
> Correctif : `@for (housingLocation of filteredLocationList(); track $index)`.

> ⚠️ **`TS2339: Property 'city' does not exist on type 'Signal<HousingLocationInfo | undefined>'`.**
> Symptôme : erreur dans le template de `Details`.
> Cause : un `housingLocation?.` a échappé au remplacement.
> Correctif : `housingLocation()?.city`. Attention, `housingLocation?.name` sans parenthèses ne
> donne **aucune** erreur (un signal est une fonction, et toute fonction a une propriété `name`),
> mais affiche un texte faux : relisez les 8 lectures.

## Récap

- `provideHttpClient()` dans `app.config.ts` ; `inject(HttpClient)` dans le service ; `http.get<T>(url)` renvoie un `Observable<T>`.
- Un `Observable` est froid : la requête part à l'abonnement, que `toSignal` fait pour vous.
- `toSignal` + `signal` + `computed` : le rendu suit les signals, `markForCheck()` disparaît.

➡️ [16 — Un premier intercepteur](16-INTERCEPTEUR.md)
