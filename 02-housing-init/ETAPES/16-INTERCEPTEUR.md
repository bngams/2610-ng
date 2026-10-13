# 16 — Un premier intercepteur

> Depuis l'étape 15, toutes les requêtes de l'application passent par `HttpClient`. Cela permet
> de placer sur leur chemin un **intercepteur** : une fonction qui voit passer chaque requête à
> l'aller et sa réponse au retour, sans toucher aux composants ni au service. Vous en écrivez deux,
> comme dans la démo de ce matin : un qui écrit chaque requête dans la console avec sa durée, et un
> qui compte les requêtes en cours pour afficher « Loading… » en haut de la page.

> **Notion nouvelle, guidage complet.** Les fichiers sont générés par la CLI puis complétés ; chaque
> contenu est donné en entier. Gardez `npm run api` et `ng serve` lancés.

## ✨ Ce que vous apprenez

- `ng generate interceptor` et la forme d'un intercepteur fonctionnel (`HttpInterceptorFn`).
- `next(req).pipe(…)` avec `tap` et `finalize` : agir au retour d'une requête, qu'elle réussisse ou échoue.
- `withInterceptors([…])` dans `provideHttpClient()`, et l'ordre dans lequel les intercepteurs s'exécutent.
- Partager un état entre un intercepteur et un composant avec un service qui contient un `signal`.

> 📖 [Les intercepteurs](https://angular.dev/guide/http/interceptors) ·
> [Configurer HttpClient](https://angular.dev/guide/http/setup) ·
> [Le contexte d'injection](https://angular.dev/guide/di/dependency-injection-context) ·
> [`tap`](https://rxjs.dev/api/operators/tap) · [`finalize`](https://rxjs.dev/api/operators/finalize)

## 🧭 1 — Où se place un intercepteur

Avant d'écrire du code, voici le chemin d'une requête à la fin de cette étape. Les intercepteurs
forment une chaîne entre `HttpClient` et le réseau ; chacun reçoit la requête, la passe au suivant
avec `next(req)`, puis voit revenir la réponse dans l'autre sens.

```
Home / Details
   │  toSignal(...) s'abonne
   ▼
HousingService ── http.get(...)
   ▼
HttpClient
   ▼  aller                                  ▲  retour
loggingInterceptor   (note l'heure de départ) │  (écrit la ligne de log)
   ▼                                          │
loadingInterceptor   (compteur + 1)           │  (compteur - 1)
   ▼                                          │
réseau ──────────────► json-server :3000 ─────┘
```

C'est ce qui rend les intercepteurs utiles : un seul endroit pour un comportement commun à toutes
les requêtes (un journal, un indicateur de chargement, un jeton d'authentification, la gestion des
erreurs). C'est aussi pour cela que `fetch` ne suffisait plus : un appel `fetch` ne passe par
aucun intercepteur.

## 🧱 2 — Générer l'intercepteur de log

Dans le second terminal, à la racine du projet, générez le premier intercepteur :

```bash
ng generate interceptor logging
```

La CLI crée un seul fichier, directement dans `src/app/`. Remarquez son nom : en Angular 22, le type est
ajouté au nom avec un tiret (`logging-interceptor.ts`), alors que le service de l'étape 9 avait un
point (`housing.service.ts`) parce que vous aviez demandé `--type=service`.

```
CREATE src/app/logging-interceptor.ts (152 bytes)
```

Ouvrez `src/app/logging-interceptor.ts`. La CLI y a écrit l'intercepteur le plus simple possible,
qui laisse passer la requête sans rien faire :

```ts
import { HttpInterceptorFn } from '@angular/common/http';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
```

| Morceau | Rôle |
|---|---|
| `HttpInterceptorFn` | le type d'un intercepteur **fonctionnel** : une simple fonction, pas une classe |
| `req` | la requête sortante (`req.method`, `req.url`…) ; elle est en lecture seule |
| `next(req)` | passe la requête à l'intercepteur suivant (ou au réseau) et renvoie un `Observable` de la réponse |
| `loggingInterceptor` | le nom de la fonction, déduit de `logging` ; c'est lui que vous déclarerez dans `app.config.ts` |

## 📝 3 — Écrire la ligne de log

L'objectif est d'obtenir, pour chaque requête, une ligne de la forme
`GET http://localhost:3000/locations => 200 (9 ms)`. Il faut donc noter l'heure au départ, lire le
code HTTP de la réponse, et écrire la ligne une fois la requête terminée. **Remplacez tout le
contenu** de `src/app/logging-interceptor.ts` par celui-ci :

```ts
import { HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { finalize, tap } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const started = Date.now();
  let status = 0;
  return next(req).pipe(
    tap({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          status = event.status;
        }
      },
      error: (error) => {
        status = error.status;
      },
    }),
    finalize(() => {
      const elapsed = Date.now() - started;
      console.log(`${req.method} ${req.urlWithParams} => ${status} (${elapsed} ms)`);
    }),
  );
};
```

| Morceau | Rôle |
|---|---|
| `const started = Date.now()` | exécuté à l'**aller**, au moment où la requête entre dans l'intercepteur |
| `let status = 0` | la valeur par défaut, gardée si aucune réponse n'arrive (serveur arrêté, réseau coupé) : `0` veut dire « pas de réponse HTTP du tout » |
| `next(req).pipe(…)` | on ne renvoie plus directement la réponse : on lui ajoute des étapes, les **opérateurs** RxJS, qui s'exécuteront au retour |
| `tap({ next, error })` | regarde passer ce qui revient sans le modifier : `next` pour chaque événement, `error` si la requête échoue |
| `event.type === HttpEventType.Response` | `HttpClient` émet plusieurs événements par requête : d'abord « requête envoyée » (`Sent`), puis la réponse (`Response`) ; seul ce dernier porte le code HTTP |
| `finalize(() => …)` | s'exécute **une seule fois**, quand la requête est terminée : succès, erreur ou annulation. C'est le bon endroit pour écrire la ligne |
| `req.urlWithParams` | l'URL complète, paramètres de recherche compris (`?city=…` s'il y en avait) |

## 🔗 4 — Déclarer l'intercepteur

Un intercepteur généré n'est utilisé par personne tant qu'il n'est pas déclaré auprès de
`HttpClient`. Cela se fait dans `src/app/app.config.ts`, dans le `provideHttpClient()` ajouté à
l'étape 15. **Remplacez tout son contenu** par celui-ci :

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { loggingInterceptor } from './logging-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([loggingInterceptor])),
  ]
};
```

| Morceau | Rôle |
|---|---|
| `withInterceptors([…])` | une option de `provideHttpClient` : la liste des intercepteurs fonctionnels, appliqués à **toutes** les requêtes de `HttpClient` |
| `loggingInterceptor` sans parenthèses | on donne la fonction à Angular, on ne l'appelle pas : c'est `HttpClient` qui l'appellera pour chaque requête |

> 💡 **Tester :** ouvrez la console du navigateur (F12, onglet *Console*) et rechargez la page
> d'accueil. Une ligne apparaît :
>
> ```
> GET http://localhost:3000/locations => 200 (9 ms)
> ```
>
> Cliquez **Learn More** sur la sixième carte : `GET http://localhost:3000/locations/5 => 200 (…)`.
> Tapez enfin http://localhost:4200/details/99 dans la barre d'adresse : ce logement n'existe pas,
> la ligne indique `=> 404`, suivie d'une erreur rouge `ERROR {… status: 404 …}`. C'est normal : le
> journal voit aussi les échecs. Gérer cette erreur proprement est le sujet du lab avancé.

## ⏳ 5 — Un service qui compte les requêtes en cours

Le second intercepteur doit prévenir l'en-tête de l'application qu'une requête est en cours.
Intercepteur et composant ne se connaissent pas : ils vont partager un **service** qui contient un
compteur. Dans le second terminal, générez-le :

```bash
ng generate service loading --type=service --injectable
```

La CLI répond par une seule ligne :

```
CREATE src/app/loading.service.ts (116 bytes)
```

L'option `--injectable` est nouvelle : elle demande à la CLI 22.2 d'écrire directement
`@Injectable({ providedIn: 'root' })` au lieu de `@Service()`. Vous n'avez donc pas à remplacer le
décorateur comme à l'étape 9. Ouvrez `src/app/loading.service.ts` et **remplacez tout son
contenu** par celui-ci, qui ajoute le compteur et deux méthodes :

```ts
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  readonly pending = signal(0);

  start() {
    this.pending.update((count) => count + 1);
  }

  stop() {
    this.pending.update((count) => count - 1);
  }
}
```

| Morceau | Rôle |
|---|---|
| `pending = signal(0)` | le nombre de requêtes en cours ; un signal, pour que l'écran se mette à jour seul (étape 15) |
| `update((count) => count + 1)` | calcule la nouvelle valeur à partir de l'ancienne ; `set(…)` remplacerait la valeur sans la lire |
| un compteur plutôt qu'un booléen | `Home` et `Details` peuvent avoir chacun une requête en cours ; avec un simple vrai/faux, la première terminée cacherait l'indicateur trop tôt |

## 🚦 6 — L'intercepteur de chargement

Ce second intercepteur incrémente le compteur à l'aller et le décrémente au retour. Générez-le
dans le second terminal :

```bash
ng generate interceptor loading
```

La CLI crée `src/app/loading-interceptor.ts`, avec la même fonction vide qu'en partie 2, nommée
cette fois `loadingInterceptor` :

```
CREATE src/app/loading-interceptor.ts (152 bytes)
```

Ouvrez `src/app/loading-interceptor.ts` et **remplacez tout son contenu** par celui-ci :

```ts
import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { LoadingService } from './loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  loadingService.start();
  return next(req).pipe(finalize(() => loadingService.stop()));
};
```

| Morceau | Rôle |
|---|---|
| `inject(LoadingService)` | un intercepteur fonctionnel peut demander un service avec `inject()`, mais **seulement dans son corps**, au moment où il est appelé (voir les pièges) |
| `loadingService.start()` | à l'aller : une requête de plus en cours |
| `finalize(() => loadingService.stop())` | au retour, dans tous les cas : sans `finalize`, une requête en erreur laisserait le compteur à 1 pour toujours |

Il reste à ajouter ce second intercepteur à la liste. **Remplacez tout le contenu** de
`src/app/app.config.ts` par celui-ci : par rapport à la partie 4, il ajoute l'import de
`loadingInterceptor` et le place en second dans le tableau de `withInterceptors`.

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { loggingInterceptor } from './logging-interceptor';
import { loadingInterceptor } from './loading-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([loggingInterceptor, loadingInterceptor])),
  ]
};
```

L'ordre du tableau compte. À l'**aller**, les intercepteurs s'exécutent dans l'ordre du tableau :
`loggingInterceptor` note l'heure, puis `loadingInterceptor` incrémente le compteur, puis la
requête part. Au **retour**, la réponse remonte dans l'ordre inverse : `loadingInterceptor`
décrémente le compteur, puis `loggingInterceptor` écrit sa ligne. Le premier de la liste est donc
le plus « extérieur » : la durée qu'il mesure englobe tout ce que font les suivants.

> **🧪 Manip — voir l'ordre d'exécution**
>
> 1. Dans `logging-interceptor.ts`, ajoutez `console.log('logging : aller');` juste avant
>    `const started = Date.now();`.
> 2. Dans `loading-interceptor.ts`, ajoutez `console.log('loading : aller');` avant
>    `loadingService.start();`, et remplacez le `finalize` par
>    `finalize(() => { console.log('loading : retour'); loadingService.stop(); })`.
> 3. Rechargez la page d'accueil et lisez la console.
>
> *Observé : `logging : aller`, `loading : aller`, puis `loading : retour`, et enfin la ligne
> `GET http://localhost:3000/locations => 200 (…)`. Inversez les deux noms dans le tableau de
> `withInterceptors` : les deux lignes `aller` s'inversent aussi.*
>
> Retirez les `console.log` ajoutés et remettez l'ordre `[loggingInterceptor, loadingInterceptor]`
> avant de continuer.

## 🖥️ 7 — Afficher « Loading… » dans `App`

Le compteur existe, il reste à l'afficher. Le composant racine `App` est le bon endroit : il est
toujours à l'écran, quelle que soit la page. **Remplacez tout le contenu** de `src/app/app.ts` par
celui-ci ; par rapport à l'étape 10, il ajoute l'import et l'injection de `LoadingService`, et un
bloc `@if` sous l'en-tête.

```ts
import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LoadingService } from './loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  template: `
    <main>
      <a [routerLink]="['/']">
        <header class="brand-name">
          <img class="brand-logo" src="/logo.svg" alt="logo" aria-hidden="true" />
        </header>
      </a>
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

| Morceau | Rôle |
|---|---|
| `loadingService = inject(LoadingService)` | la **même** instance que celle de l'intercepteur, grâce à `providedIn: 'root'` |
| `@if (loadingService.pending() > 0)` | le bandeau n'existe que tant qu'au moins une requête est en cours ; le signal prévient Angular à chaque `start()` / `stop()` |

Pour que le bandeau se voie, ajoutez ces lignes **à la fin** de `src/app/app.css`. Elles
réutilisent les couleurs définies dans `styles.css` et la marge `--content-padding` déjà déclarée
en haut d'`app.css` :

```css
.loading {
  padding: 4px var(--content-padding);
  background: var(--accent-color);
  color: var(--primary-color);
}
```

> ⚖️ **Deux simplifications assumées.** `pending` est un signal public : n'importe quel composant
> pourrait le modifier avec `set()`. Dans un vrai projet, on le garderait privé dans le service et
> on exposerait un `computed`, par exemple `isLoading = computed(() => this.count() > 0)`, que
> `App` lirait sans pouvoir l'écrire. De même, `loggingInterceptor` écrit dans la console en
> production aussi ; on le réserve en général au développement.

> 💡 **Tester :** rechargez la page. Vous ne voyez probablement **rien** de nouveau : json-server
> répond en moins de 10 ms, le bandeau apparaît et disparaît trop vite pour l'œil. C'est la partie
> suivante.

## 🐢 8 — Ralentir l'API pour voir l'indicateur

json-server 0.17.4 sait retarder ses réponses avec l'option `--delay`, en millisecondes
(`npx json-server --help` la liste : `-d, --delay  Add delay to responses (ms)`). Inutile de
modifier le script `api` de `package.json` : npm transmet au script tout ce qui suit `--`. Dans le
terminal de l'API, arrêtez json-server (Ctrl+C), puis relancez-le avec une seconde et demie de
délai :

```bash
npm run api -- --delay 1500
```

npm affiche la commande réellement exécutée, avec l'option ajoutée au bout, puis la bannière
habituelle de json-server :

```
> homes@0.0.0 api
> json-server --watch api/db.json --port 3000 --delay 1500
```

> 💡 **Tester :** rechargez la page d'accueil. Pendant environ une seconde et demie, un bandeau
> violet clair **Loading…** s'affiche sous le logo, au-dessus d'une page sans cartes ; puis les
> 10 cartes arrivent et le bandeau disparaît. La console indique
> `GET http://localhost:3000/locations => 200 (1507 ms)`. Cliquez sur **Learn More**, puis sur le
> logo : le bandeau revient à chaque navigation, puisque chaque page lance sa requête.

Quand vous avez vu l'indicateur, revenez à une API rapide : Ctrl+C dans le terminal de l'API, puis
`npm run api`, sans option.

## ⚠️ Pièges

> ⚠️ **Aucune ligne de log dans la console.**
> Symptôme : l'application marche, mais la console n'affiche aucune ligne `GET … => …`.
> Cause : l'intercepteur n'est pas dans le tableau de `withInterceptors`, ou le service utilise
> encore `fetch` (une requête `fetch` ne passe par aucun intercepteur).
> Correctif : vérifiez `provideHttpClient(withInterceptors([loggingInterceptor, loadingInterceptor]))`
> dans `app.config.ts`, et `inject(HttpClient)` dans `housing.service.ts` (étape 15).

> ⚠️ **« Loading… » ne disparaît jamais, et la console ne montre aucune erreur.**
> Symptôme : les cartes s'affichent, mais le bandeau reste.
> Cause : `inject(LoadingService)` a été écrit **dans** le `finalize`, par exemple
> `finalize(() => inject(LoadingService).stop())`. Ce code s'exécute plus tard, hors du contexte
> d'injection : `inject()` lève l'erreur `NG0203` (« `inject()` function must be called from an
> injection context »), qui n'apparaît pas dans la console, et `stop()` n'est jamais appelé.
> Correctif : appelez `inject()` une seule fois, en première ligne de l'intercepteur, et gardez
> le service dans une constante, comme dans la partie 6.

> ⚠️ **`npm run api --delay 1500` ne ralentit rien.**
> Symptôme : les réponses restent instantanées, et npm affiche
> `npm warn Unknown cli config "--delay"` ; la commande exécutée se termine par `--port 3000 1500`.
> Cause : sans le `--` isolé, npm prend `--delay` pour une de ses propres options, et ne transmet
> au script que `1500`, que json-server ignore.
> Correctif : `npm run api -- --delay 1500`, avec les deux tirets seuls, séparés par des espaces.

## Récap

- Un intercepteur fonctionnel : `(req, next) => next(req).pipe(…)` ; le code avant `next` s'exécute à l'aller, les opérateurs au retour.
- `tap` regarde passer la réponse, `finalize` s'exécute une fois à la fin, quoi qu'il arrive.
- `provideHttpClient(withInterceptors([a, b]))` : `a` puis `b` à l'aller, `b` puis `a` au retour.
- Un service avec un `signal` partage un état entre un intercepteur et un composant.

➡️ [17 — L'URL de l'API dans `environment.ts` (facultative)](17-ENVIRONNEMENTS.md)

Vous sautez l'étape facultative ? Passez directement à [18 — Le dossier de candidature](18-DOSSIER.md).
