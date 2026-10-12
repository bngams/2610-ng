# 🔎 S1 — Recherche : anti-rebond et annulation

> Cette première expérience sert de modèle. La section « Comment une expérience est construite »
> ci-dessous ne se fait qu'une fois : les expériences suivantes réutilisent le même geste.

## 🧱 Comment une expérience est construite

L'application du tutoriel reste intacte : chaque expérience vit sur une **page** à part. Cette
page tient en quatre morceaux : une route `/sN`, un composant de page qui porte le titre, la
consigne et une bascule **RxJS / Signals**, et deux composants, `sN-rxjs.ts` et `sN-signals.ts`,
un par volet.

Un seul volet est affiché à la fois : quand vous basculez, le composant de l'autre volet est
**détruit**. C'est voulu, pour deux raisons. D'abord, le log chaos ne montre que les requêtes du
volet affiché, sinon tout apparaîtrait en double. Ensuite, la destruction est le moyen de vérifier
qu'un flux s'arrête bien, ce que vous ferez avec le suivi de disponibilité (étape 05).

Pour la recherche, tout est montré, fichier par fichier. Les étapes suivantes vous diront « même
geste que pour la recherche » et ne donneront plus que les noms.

### La mise en page et la bascule

Les pages d'expérience ont besoin d'un peu de mise en forme qui n'existe pas dans le tutoriel : la
bascule RxJS / Signals, le cadre de chaque volet (rouge pour RxJS, bleu pour signals), les messages
d'état et d'erreur, et un squelette gris pendant le chargement. Ces règles sont écrites pour vous
dans [`assets/scenarios.css`](../assets/scenarios.css), une centaine de lignes de CSS sans rien de
spécifique à Angular : ouvrez-la pour voir ce qu'elle contient. Depuis la racine de votre projet
`homes`, copiez-la à côté de `src/styles.css` :

```bash
cp ../02-housing-async/assets/scenarios.css src/scenarios.css
```

Copier le fichier ne suffit pas : Angular ne charge que les feuilles déclarées dans `angular.json`.
Dans la cible `build` du projet, ajoutez-la au tableau `styles`, juste après `src/styles.css`
(depuis l'étape 17 du lab Init, la CLI a écrit ce tableau sur une seule ligne) :

```json
            "styles": ["src/styles.css", "src/scenarios.css"]
```

Comme pour le proxy, `angular.json` n'est pas surveillé : faites `Ctrl-C` puis `npm start` dans le
terminal 2. Cette feuille apporte les classes que vous utiliserez dans les templates : `.scenario`,
`.hint`, `.pane` (+ `.rxjs` / `.signals`), `.status`, `.error` et `.skeleton`.

Il manque encore la bascule entre les deux volets, un petit composant que toutes les pages
réutiliseront. Créez le dossier `src/app/scenarios/`, puis, dedans, le fichier `mode-toggle.ts` :

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

### La page de la recherche, la route et le lien

La bascule existe, il faut maintenant une page pour l'accueillir. Cette page porte le titre et la
consigne de l'expérience, et affiche l'un ou l'autre volet selon la bascule. Créez
`src/app/scenarios/s1-search/s1-page.ts` :

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
| `imports: [ModeToggle, S1Rxjs, S1Signals]` | les deux composants de volet n'existent pas encore : vous les créez dans la suite de cette étape, et le build restera rouge jusque-là |

Une page n'est atteignable que si une route y mène. Dans `src/app/app.routes.ts`, ajoutez
l'import de `S1Page` sous les deux imports existants, puis une troisième route après celles du
tutoriel (`''` et `'details/:id'`, que vous gardez telles quelles) :

```ts
import { S1Page } from './scenarios/s1-search/s1-page';

export const routes: Routes = [
  // … les routes '' et 'details/:id' du tutoriel, inchangées …
  { path: 's1', component: S1Page, title: 'S1 — Recherche : anti-rebond et annulation' },
];
```

Reste à rendre cette route accessible d'un clic. Le `app.ts` du tutoriel enveloppe tout l'en-tête
dans un `<a>` vers l'accueil : il n'y a pas de place pour d'autres liens. On le restructure donc
pour loger une barre de navigation à côté du logo, en gardant le bandeau « Loading… » de l'étape
16 du lab Init. Remplacez `src/app/app.ts` en entier :

```ts
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LoadingService } from './loading.service';

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
      @if (loadingService.pending() > 0) {
        <p class="loading">Loading…</p>
      }
      <section class="content">
        <router-outlet />
      </section>
    </main>
  `,
  styleUrl: './app.css',
})
export class App {
  title = 'homes';
  loadingService = inject(LoadingService);
}
```

Le lien vers l'accueil n'entoure plus que le logo, et le `<nav class="scenarios">` accueille les
liens des expériences ; `routerLinkActive="active"` ajoute la classe `active` au lien de la page
courante. Le bloc `@if` et l'injection de `LoadingService` sont repris du lab Init sans
changement.

Cette nouvelle structure a besoin de styles : sans eux, le logo et les liens s'empileraient. Dans
la nouvelle version de `src/app/app.css`, l'en-tête passe en `flex` pour aligner le logo et les
liens, le lien actif est souligné, et la règle `.loading` du lab Init reste à la fin. Remplacez
le fichier en entier :

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
.loading {
  padding: 4px var(--content-padding);
  background: var(--accent-color);
  color: var(--primary-color);
}
```

Les liens des expériences suivantes viendront s'ajouter dans `<nav>`, un par expérience, au moment
où leur route existe : un `routerLink` vers une route absente lève `NG04002: Cannot match any
routes` au clic.

---

## 🔎 L'expérience : chercher pendant la frappe

Le cadre est en place, passons à l'expérience elle-même. L'écran est un champ texte : à chaque
frappe, on cherche côté serveur avec `searchByCity`, soit `GET /locations?city_like=`. Il y a deux
problèmes à résoudre. Le premier est de ne pas envoyer une requête par lettre : c'est
l'anti-rebond. Le second est de ne jamais afficher le résultat d'une requête plus ancienne que la
dernière saisie : c'est l'annulation, ou « dernier gagne ».

Voici comment chaque besoin s'exprime de part et d'autre :

| Besoin | RxJS | Signals |
|---|---|---|
| Attendre que l'utilisateur ait fini de taper | `debounceTime(300)` | rien de natif : un `resource` réagit à chaque changement |
| Ne pas relancer la même recherche | `distinctUntilChanged` | inutile : un signal ne notifie pas si la valeur est identique |
| Abandonner la requête précédente | `switchMap` | `resource` le fait seul quand sa requête change |

## Côté RxJS (donné)

Le volet RxJS est donné : il exprime les deux besoins par une chaîne d'opérateurs branchée sur le
champ du formulaire. Créez `src/app/scenarios/s1-search/s1-rxjs.ts` :

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

## Côté signals (à vous)

Vous écrivez maintenant le même écran avec des signals, dans
`src/app/scenarios/s1-search/s1-signals.ts`. Le volet doit respecter trois contraintes. La saisie
est un signal `query`, alimenté par `(input)`. La recherche est un `httpResource` dont la fonction
de requête lit la saisie. Le template lit l'indicateur sur `isLoading()`, l'erreur sur `error()`
et la liste sur `value()`.

Le debounce, lui, **n'existe pas** dans `resource`. Il passe par le pont,
`toSignal(toObservable(query).pipe(debounceTime(300)))`, et c'est ce signal débouncé que lit la
fonction de requête. Dans le fichier ci-dessous, le template est donné et la logique est à
compléter.

🚧 **À compléter :**

```ts
import { Component, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { httpResource } from '@angular/common/http';
import { debounceTime } from 'rxjs';
import { HousingLocationInfo } from '../../housinglocation';
import { environment } from '../../../environments/environment';

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

Quelques indices pour écrire les deux `TODO` :

- `httpResource` accepte un objet `{ url, params }`, comme `HttpClient` dans `searchByCity`. Une resource
  prend une URL, pas un Observable : construisez-la comme le service, avec
  `` `${environment.apiUrl}/locations` `` (l'import d'`environment` est déjà dans le squelette).
  L'étape 08 supprimera cette duplication.
- L'option `{ defaultValue: [] }` joue le rôle de l'`initialValue` de `toSignal`, et évite un
  `@for` sur `undefined`.
- Pas besoin de `distinctUntilChanged` : un signal ne notifie pas une valeur identique.
- Le `@else` autour de la liste n'est pas décoratif : `value()` **lève** quand la resource est en
  erreur (voir « Le format » dans le [README](../README.md)).

Pourquoi `httpResource` et pas `resource` + `fetch` avec `abortSignal` ? Ça marche aussi, mais
`fetch` contourne `HttpClient`, donc l'intercepteur : vous ne verriez ni latence, ni « annulée »
dans le log. Si vous voulez voir l'`abortSignal` à l'œuvre, faites-le en bonus et comparez l'onglet
Réseau : la requête y apparaît *canceled*, puisqu'elle est partie.

> 📖 [httpResource](https://angular.dev/guide/http/http-resource) ·
> [toObservable](https://angular.dev/api/core/rxjs-interop/toObservable) ·
> [toSignal](https://angular.dev/api/core/rxjs-interop/toSignal) ·
> [debounceTime](https://rxjs.dev/api/operators/debounceTime) ·
> [switchMap](https://rxjs.dev/api/operators/switchMap)

## Critère de réussite

Sur chaque volet, tapez « Jun », marquez une pause d'environ 400 ms (assez pour passer le
debounce, pas assez pour que le chaos laisse partir la requête), puis tapez « eau ». La liste
n'affiche que Juneau, et le log montre `Jun => annulée`. Dans l'onglet Réseau, il n'y a que
**deux** requêtes, `city_like=` (la liste complète, à la création du volet) et `city_like=Juneau` :
celle de `Jun` n'est jamais partie.

Si `Jun` apparaît en `+NNNms`, le chaos a tiré un délai court : recommencez (videz le champ,
attendez que la liste complète revienne). Et sans le debounce (essayez en retirant `debounceTime`
côté RxJS), vous verriez une ligne par lettre, chacune annulée par la suivante.

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

➡️ [S2 — Détail, trois appels en parallèle](02-DETAIL-PARALLELE.md)
