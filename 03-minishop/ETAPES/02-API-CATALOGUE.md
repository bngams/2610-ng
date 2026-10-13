# 🔌 02 — L'API et le catalogue

> **Code fourni et commenté, 15 à 30 minutes.** Le catalogue, vous l'avez déjà écrit au jour 2
> avec le tutoriel Housing et `ResourceService` : ici, il est **donné**. Vous copiez les fichiers
> depuis [assets/02-catalogue/](../assets/02-catalogue/), vous les lisez avec les tableaux qui les accompagnent, et vous
> les branchez dans le FO. Rien n'est à écrire, à part quelques lignes de configuration. Votre
> formateur peut faire cette étape en démonstration, pendant que vous suivez : dans ce cas,
> reprenez ensuite ses commandes sur votre poste avant de passer à l'étape 03.

## ✨ Objectifs

- Lancer une **API de démonstration** qui gère les produits et une session par cookie.
- Faire passer les appels par le **proxy** du serveur de développement, pour que l'application et
  l'API soient sur la même origine.
- Découvrir les bibliothèques `@shop/api` et `@shop/products`, et ce qui y est rangé.
- Brancher la feature **catalogue** du FO : une liste et une fiche produit, chargées à la demande.

## 📁 Point de départ

Vous partez du workspace de l'étape 01, avec ses quatre bibliothèques vides (sauf `ui`). Voici
ce que cette étape ajoute ; tout vient de [assets/02-catalogue/](../assets/02-catalogue/), qui a
la même arborescence que votre workspace :

```
shop/
├── api/server.js, db.json                  <- l'API (section 1)
├── proxy.conf.json                         <- le proxy (section 2)
├── libs/api/src/                           <- API_URL, provideApi, ResourceService, l'intercepteur de retour d'erreur (section 3)
├── libs/products/src/                      <- Product, ProductsService, la carte et la liste de produits (section 4)
└── apps/fo/src/app/features/catalog/       <- les routes et les deux pages du catalogue (section 5)
```

---

## 🗄️ 1 — L'API de démonstration

### 1.1 — Copier et installer

L'API vit dans le workspace, dans un dossier `api/`, à côté des applications. Elle se compose de
deux fichiers :

| Fichier | Ce qu'il contient |
|---|---|
| [assets/02-catalogue/api/db.json](../assets/02-catalogue/api/db.json) | les données : trente produits (`id`, `name`, `price`, `category`, `description`, `thumbnail`), et rien d'autre |
| [assets/02-catalogue/api/server.js](../assets/02-catalogue/api/server.js) | le serveur : json-server 0.17.4 utilisé comme un **module** Express, avec trois routes d'authentification et une règle d'écriture |

Depuis `shop/`, copiez le dossier entier :

```bash
cp -R ../03-minishop/assets/02-catalogue/api .
```

Le serveur a besoin de json-server, en version 0.17.4 précisément : c'est la dernière version qui
s'utilise comme un module (la branche 1.x a changé d'API). Installez-le en dépendance de
développement :

```bash
npm install -D json-server@0.17.4
```

npm peut afficher des lignes `npm warn allow-scripts … have install scripts not yet covered by
allowScripts` : npm 11 n'exécute plus d'office les scripts d'installation des dépendances, et le
lab fonctionne sans. Il reste à donner un raccourci au serveur. Dans `package.json`, ajoutez une
ligne `"api"` à la fin du bloc `"scripts"`, sans oublier la virgule sur la ligne `"bo"` qui la
précède :

```json
    "fo": "ng serve fo",
    "bo": "ng serve bo",
    "api": "node api/server.js"
```

### 1.2 — Ce que fait le serveur

Ouvrez [server.js](../assets/02-catalogue/api/server.js). Le principe : json-server fournit
d'habitude toute l'API à partir de `db.json` ; utilisé comme un module, il garde ce routeur pour
`/api/products` et nous laisse ajouter nos propres routes **avant** lui. Voici les routes, toutes
sous le préfixe `/api` :

| Route | Réponse |
|---|---|
| `GET /api/products`, `GET /api/products/:id` | les produits : lecture **publique**, sans connexion |
| `POST`, `PUT`, `PATCH`, `DELETE` sur `/api/products` | `401` sans session ; `403` avec une session qui n'a pas le rôle `admin` ; sinon json-server écrit dans `db.json` |
| `POST /api/auth/login` | avec `{ username, password }` corrects : pose le cookie de session et renvoie `{ username, roles }` ; sinon `401` |
| `GET /api/auth/me` | la session en cours, `{ username, roles }`, ou `401` s'il n'y en a pas |
| `POST /api/auth/logout` | supprime la session et efface le cookie (`204`) |

Trois choix de ce serveur serviront aux étapes 04 et 06, et méritent d'être lus dès maintenant :

| Choix | Pourquoi |
|---|---|
| les comptes `alice` et `admin` sont **dans `server.js`**, pas dans `db.json` | tout ce qui est dans `db.json` est exposé par json-server ; les utilisateurs, eux, ne sont lisibles par aucune route |
| la session est un identifiant aléatoire, rangé dans un cookie `sid` **httpOnly** et **SameSite=Strict** | httpOnly : aucun JavaScript de la page ne peut le lire, donc un script malveillant ne peut pas le voler. SameSite=Strict : le navigateur ne l'envoie jamais depuis un autre site. Angular n'a **aucun jeton** à stocker |
| la règle d'écriture est appliquée **par le serveur** | les guards d'Angular (étapes 05 et 06) améliorent l'ergonomie ; la sécurité, c'est le serveur qui la décide |

Les sessions sont gardées en mémoire : **redémarrer l'API les efface toutes**. Vous utiliserez ce
détail à l'étape 04 pour simuler une session expirée.

### 1.3 — D'où viennent les produits, et pourquoi l'API reste locale

Les trente produits de `db.json` ont été copiés **une fois**, à la préparation du lab, depuis
[dummyjson.com](https://dummyjson.com/docs/products), une API publique de données de test. On
aurait pu appeler dummyjson directement depuis Angular ; on ne le fait pas, pour deux raisons qui
sont au cœur des étapes 04 à 06 :

| Ce dont le lab a besoin | Avec notre API locale | Avec dummyjson |
|---|---|---|
| une session dans un cookie **httpOnly**, posé sur **notre** origine | le serveur pose le cookie `sid`, le proxy met tout sur `localhost:4200` | sa route de connexion renvoie un jeton JWT **dans le corps** de la réponse : il faudrait le ranger soi-même, typiquement dans `localStorage`, exactement ce que la [synthèse authentification](https://bngams.github.io/2610-ng/03-intro-auth/) conseille d'arrêter |
| des règles décidées **par le serveur** (401 sans session, 403 sans le rôle `admin`) | quelques lignes dans `server.js` | impossible : on ne contrôle pas son serveur |

dummyjson n'est donc qu'une **source de données**. Ses prix sont en dollars, et la boutique les
affiche tels quels, avec le pipe `currency: 'USD'`. Les images, elles, restent
hébergées sur internet : le champ `thumbnail` de chaque produit pointe vers `cdn.dummyjson.com`.
Sans réseau, le catalogue fonctionne toujours (les données sont locales), simplement sans photos :
le navigateur affiche alors le texte de l'attribut `alt`, le nom du produit.

> 🔐 **Pas de stockage du jeton côté client.** La [synthèse authentification](https://bngams.github.io/2610-ng/03-intro-auth/)
> explique pourquoi on arrête les jetons dans `localStorage`, et ce que le serveur ajoute en
> production (`secure: true`, jeton XSRF).

### 1.4 — Lancer l'API

Ouvrez le **terminal 1**, placez-le dans `shop/`, et lancez le serveur :

```bash
npm run api
```

Il annonce son adresse, puis journalise chaque requête reçue :

```
API MiniShop sur http://localhost:3000
```

> 💡 **Tester :** dans le terminal 4, `curl -s http://localhost:3000/api/products/1` renvoie le
> premier produit, `{ "id": 1, "name": "Essence Mascara Lash Princess", "price": 9.99, … }`.
> `curl -s http://localhost:3000/api/auth/me` répond `{ "error": "Non authentifié" }` : personne
> n'est connecté. Et `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/users`
> affiche `404` : les utilisateurs ne sont pas exposés.

> 📖 [json-server 0.17 : utilisation en module](https://github.com/typicode/json-server/tree/v0.17.4#module) ·
> [Express : `res.cookie`](https://expressjs.com/en/api.html#res.cookie)

---

## 🔀 2 — Le proxy : une seule origine

L'application tourne sur le port 4200 (ou 4201 pour le BO), l'API sur le port 3000 : deux
**origines** différentes. Le navigateur appliquerait alors les règles CORS, et surtout, le cookie
de session ne suivrait pas sans configuration supplémentaire. La solution est de faire passer les
appels par le serveur de développement : l'application appelle `/api/...` sur son propre port, et
`ng serve` relaie vers l'API. Pour le navigateur, tout vient de la même origine.

Cette règle de relais tient dans [assets/02-catalogue/proxy.conf.json](../assets/02-catalogue/proxy.conf.json),
à copier à la racine du workspace :

```bash
cp ../03-minishop/assets/02-catalogue/proxy.conf.json .
```

Il ne contient qu'une règle, détaillée clé par clé dans le tableau qui suit :

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false
  }
}
```

Chaque clé a un rôle précis :

| Clé | Rôle |
|---|---|
| `"/api"` | les requêtes concernées : toutes celles dont le chemin commence par `/api` |
| `target` | où les relayer : l'API. Le chemin est gardé tel quel, `/api/products` arrive en `/api/products` |
| `secure: false` | l'API est en `http`, pas en `https` : on n'exige pas de certificat |

Le même fichier sert aux **deux** applications. Dans `angular.json`, ajoutez la clé `proxyConfig`
aux `options` de la cible `serve` du projet `fo`, que vous avez créées à l'étape 01 pour le port :

```json
          "options": {
            "port": 4200,
            "proxyConfig": "proxy.conf.json"
          }
```

Faites de même dans le projet `bo` (avec son port, 4201). `ng serve` ne surveille pas
`angular.json` : relancez le FO dans le terminal 2 (`Ctrl-C`, puis `npm run fo`).

> 📖 [Angular : proxy du serveur de développement](https://angular.dev/tools/cli/serve#proxying-to-a-backend-server)

---

## 🧱 3 — La bibliothèque `@shop/api`

Cette bibliothèque contient la **mécanique HTTP**, sans aucun métier : l'adresse de l'API, la
configuration de `HttpClient`, la classe générique du jour 2 et un intercepteur. Les trois fichiers
et la façade se copient d'un coup, dans `libs/api/src/` :

```bash
cp -R ../03-minishop/assets/02-catalogue/libs/api/src/. libs/api/src/
```

Le point final de `src/.` copie le **contenu** du dossier, et remplace au passage la façade vide
de l'étape 01. Voici ce que vous venez de copier :

| Fichier | Ce qu'il contient |
|---|---|
| [lib/api.config.ts](../assets/02-catalogue/libs/api/src/lib/api.config.ts) | le jeton `API_URL` (l'adresse de l'API) et `provideApi({ url, interceptors })`, qui configure `HttpClient` en un appel |
| [lib/services/resource.service.ts](../assets/02-catalogue/libs/api/src/lib/services/resource.service.ts) | `ResourceService<I, T>`, la classe abstraite du jour 2 : `list`, `get`, `create`, `patch` en Observables, `getResource` et `listResource` en `httpResource` |
| [lib/interceptors/feedback.interceptor.ts](../assets/02-catalogue/libs/api/src/lib/interceptors/feedback.interceptor.ts) | l'intercepteur de retour d'erreur : chaque appel qui échoue est signalé dans la console |
| [public-api.ts](../assets/02-catalogue/libs/api/src/public-api.ts) | la façade, qui exporte les trois |

### 3.1 — `API_URL` et `provideApi()`

Au jour 2, `API_URL` avait une valeur par défaut, lue dans `environment.ts`. Une bibliothèque ne
peut pas faire cela : elle ne connaît pas les fichiers d'environnement des applications qui
l'utilisent. Le jeton n'a donc **pas** de valeur par défaut, et c'est l'application qui la fournit,
par `provideApi()` :

```ts
export function provideApi(config: ApiConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: API_URL, useValue: config.url },
    provideHttpClient(withInterceptors([...(config.interceptors ?? []), feedbackInterceptor])),
  ]);
}
```

C'est le même principe que `provideRouter()` ou `provideHttpClient()` : une **fonction de
configuration** qui regroupe les providers d'une bibliothèque, et que l'application appelle une
fois dans `app.config.ts`. Ses deux options sont les suivantes :

| Option | Rôle |
|---|---|
| `url` | l'adresse de base de l'API : `'/api'` pour nous, grâce au proxy |
| `interceptors` | facultatif : les intercepteurs d'**autres** bibliothèques, placés avant celui de l'api. Vous l'utiliserez à l'étape 04, pour celui de `@shop/auth` |

### 3.2 — `ResourceService<I, T>`

C'est la classe que vous avez écrite au jour 2, à une différence près : l'API de ce lab répond
avec les données directement, sans enveloppe `{ data, meta }`, donc il n'y a plus de `unwrap`. Une
sous-classe ne donne que son chemin (`path = 'products'`) et hérite de tout le reste.

### 3.3 — L'intercepteur de retour d'erreur

Un intercepteur voit passer **toutes** les requêtes de l'application. Celui-ci attend la réponse
et, si c'est une erreur, la signale à un seul endroit, la fonction `report()` :

```ts
export const feedbackInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: unknown) => {
      // 401 n'est pas une panne : « personne n'est connecté », c'est l'affaire de @shop/auth
      if (err instanceof HttpErrorResponse && err.status !== 401) {
        report(`${req.method} ${req.urlWithParams} : erreur ${err.status}`);
      }
      return throwError(() => err); // l'erreur continue son chemin jusqu'à l'appelant
    }),
  );
```

Pour l'instant, `report()` écrit dans la console avec `console.error`. Afficher un vrai message à
l'écran demanderait un composant visuel, donc une dépendance de `api` vers `ui`, que les règles du
workspace interdisent : l'étape bonus 09 montrera comment le faire proprement. Le code est déjà
prêt pour ce changement, puisqu'une seule fonction décide **comment** on signale.

> 📖 [Intercepteurs](https://angular.dev/guide/http/interceptors) ·
> [`makeEnvironmentProviders`](https://angular.dev/api/core/makeEnvironmentProviders) ·
> [`httpResource`](https://angular.dev/guide/http/http-resource)

---

## 🛍️ 4 — La bibliothèque `@shop/products`

Les produits sont affichés par le FO (le catalogue) et par le BO (son accueil, à l'étape 06) : leur
modèle, leur service et leurs composants vivent donc dans une bibliothèque. Copiez son contenu
dans `libs/products/src/` :

```bash
cp -R ../03-minishop/assets/02-catalogue/libs/products/src/. libs/products/src/
```

La bibliothèque est rangée par famille, comme toutes celles du lab. Voici chaque fichier :

| Fichier | Ce qu'il contient |
|---|---|
| [lib/models/product.ts](../assets/02-catalogue/libs/products/src/lib/models/product.ts) | l'interface `Product` : `id`, `name`, `price` (en dollars), `category`, `description` et `thumbnail` (l'adresse de la photo) |
| [lib/services/products.service.ts](../assets/02-catalogue/libs/products/src/lib/services/products.service.ts) | `ProductsService`, qui hérite de `ResourceService<number, Product>` et ne déclare que son chemin |
| [lib/components/product-card/](../assets/02-catalogue/libs/products/src/lib/components/product-card/) | `ProductCard` (`product-card.ts`, `.html`, `.css`) : une carte Material qui affiche la photo (avec son `alt`), le nom, la catégorie, le prix et la description d'un produit |
| [lib/components/product-list/](../assets/02-catalogue/libs/products/src/lib/components/product-list/) | `ProductList` (`product-list.ts`, `.html`, `.css`) : la liste de tous les produits, en lecture seule |
| [public-api.ts](../assets/02-catalogue/libs/products/src/public-api.ts) | la façade, qui exporte les quatre |

### 4.1 — `@Service()`, le décorateur d'Angular 22

Ouvrez `products.service.ts` : le service tient en quatre lignes utiles.

```ts
@Service() // Angular 22 : fourni à la racine (en v20 : @Injectable({ providedIn: 'root' }))
export class ProductsService extends ResourceService<number, Product> {
  protected readonly path = 'products';
}
```

`@Service()` est nouveau en Angular 22 : c'est un service fourni à la racine de l'application, une
seule instance partagée, sans option `providedIn`. C'est d'ailleurs ce que génère désormais
`ng generate service`. Dans un projet v20, vous écrirez la forme équivalente,
`@Injectable({ providedIn: 'root' })`, que vous retrouverez dans tout le code existant.

### 4.2 — Une carte qui ne connaît pas le panier

La carte est un composant de **présentation** : elle reçoit un produit et signale des clics, sans
savoir d'où vient le produit ni ce que deviendra le clic. Ses entrées et sorties sont les
suivantes :

| Membre | Rôle |
|---|---|
| `product = input.required<Product>()` | le produit à afficher |
| `canAdd = input(false)` | affiche le bouton « Ajouter » ; `false` par défaut, par exemple dans le back-office |
| `add = output<Product>()` | émis au clic sur « Ajouter », avec le produit de la carte |
| `<ng-content />` dans les actions | un emplacement pour les boutons de l'application, comme un lien « Détails » |

Pourquoi un `output()` plutôt que d'injecter le panier ? Le panier est une feature du **FO**, et une
bibliothèque n'importe jamais une application. La carte dit « on a cliqué sur Ajouter » ; c'est
le FO qui décidera, à l'étape 03, de brancher ce signal sur son panier. Le BO, lui, ne le
branchera pas. Notez aussi que la carte importe ses modules Material depuis `@shop/ui` : c'est le
barrel de l'étape 01 qui sert, et la dépendance `products => ui` est autorisée.

### 4.3 — Une liste qui charge ses données

`ProductList`, à l'inverse, va chercher les produits elle-même, avec un `httpResource` fourni par
le service :

```ts
export class ProductList {
  // un httpResource : la requête part toute seule, value(), isLoading() et error() sont des signals
  protected readonly products = inject(ProductsService).listResource();
}
```

Son template affiche « Chargement des produits… », puis une carte par produit, ou « Les produits
sont indisponibles. » en cas d'erreur. Le FO ne l'utilisera pas (son catalogue a besoin de liens
et de boutons sur chaque carte) ; le BO, si, à l'étape 06.

> 📖 [`@Service`](https://angular.dev/api/core/Service) ·
> [`output()`](https://angular.dev/guide/components/outputs) ·
> [Projection de contenu](https://angular.dev/guide/components/content-projection)

---

## 📖 5 — La feature catalogue du FO

Le catalogue est une **feature** du FO : un dossier `features/catalog/` qui regroupe ses routes et
ses pages. Copiez-le dans l'application :

```bash
cp -R ../03-minishop/assets/02-catalogue/apps/fo/src/app/features apps/fo/src/app/
```

Il contient trois éléments :

| Fichier | Ce qu'il contient |
|---|---|
| [features/catalog/catalog.routes.ts](../assets/02-catalogue/apps/fo/src/app/features/catalog/catalog.routes.ts) | les routes de la feature : `''` pour la liste, `':id'` pour la fiche |
| [features/catalog/pages/catalog/](../assets/02-catalogue/apps/fo/src/app/features/catalog/pages/catalog/) | `Catalog` : charge les produits avec `listResource()` et affiche une `lib-product-card` par produit, avec un lien « Détails » projeté dans la carte |
| [features/catalog/pages/product-detail/](../assets/02-catalogue/apps/fo/src/app/features/catalog/pages/product-detail/) | `ProductDetail` : reçoit l'`id` de l'URL dans un `input()`, charge le produit avec `getResource()` et l'affiche en grand, photo comprise |

Ces pages n'apparaissent nulle part tant que l'application ne les connaît pas. Trois fichiers du
FO sont à modifier, dans l'ordre où Angular les lit.

### 5.1 — `app.config.ts` : l'API, et les paramètres de route en `input()`

L'application doit appeler `provideApi()`, et activer `withComponentInputBinding()` pour que le
paramètre `:id` de l'URL arrive dans l'`input()` de la fiche produit. Remplacez le contenu de
`apps/fo/src/app/app.config.ts` :

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideApi } from '@shop/api';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding : le paramètre :id de la route arrive dans un input() du composant
    provideRouter(routes, withComponentInputBinding()),
    // HttpClient + l'adresse de l'API + l'intercepteur de retour d'erreur, en un appel
    provideApi({ url: '/api' }),
  ],
};
```

### 5.2 — `app.routes.ts` : une route chargée à la demande

La feature est chargée **à la demande** : son code n'est téléchargé que lorsqu'on visite
`/catalog`. Dans `apps/fo/src/app/app.routes.ts`, ajoutez cette route entre l'accueil et `**` :

```ts
  {
    path: 'catalog',
    loadChildren: () => import('./features/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES),
  },
```

### 5.3 — `app.ts` : le lien du menu

Il reste à rendre le catalogue accessible depuis l'en-tête. Dans `apps/fo/src/app/app.ts`,
complétez le menu :

```ts
  protected readonly menu: MenuItem[] = [
    { title: 'Accueil', path: '/' },
    { title: 'Catalogue', path: '/catalog' },
  ];
```

> 📖 [Routes chargées à la demande](https://angular.dev/guide/routing/define-routes#lazily-loaded-components-and-routes) ·
> [`withComponentInputBinding`](https://angular.dev/api/router/withComponentInputBinding)

---

## 🚀 6 — Vérifier

Commencez par le build : la feature catalogue doit apparaître comme un fichier à part, chargé à
la demande.

```bash
npx ng build fo
```

La sortie liste ce fichier dans les **Lazy chunk files** :

```
Lazy chunk files    | Names          |  Raw size | Estimated transfer size
chunk-MXY676LM.js   | catalog-routes |  12.46 kB |                 3.01 kB

Application bundle generation complete. [1.920 seconds]
```

Vérifiez ensuite dans le navigateur, avec l'API lancée dans le terminal 1 et le FO dans le
terminal 2.

> 💡 **Tester :** http://localhost:4200/catalog affiche trente cartes, chacune avec sa photo
> (« Essence Mascara Lash Princess », « beauty · $9.99 »…),
> chacune avec un lien « Détails », et le lien « Catalogue » du menu est souligné. « Détails » sur
> la troisième carte mène à `/catalog/3` : la photo, « Powder Canister », « beauty », « $14.99 » et la
> description.
> Ouvrez maintenant http://localhost:4200/catalog/99 : la page affiche « Ce produit est
> introuvable. », et la console du navigateur montre la ligne de l'intercepteur,
> `[api] GET /api/products/99 : erreur 404`. Dans le terminal 1, l'API a journalisé chaque requête
> (`GET /api/products 200 …`) : elles sont bien passées par le proxy.

> ℹ️ Les prix s'affichent `$9.99` : le pipe `currency: 'USD'` suit la locale par défaut (en-US),
> point décimal et symbole devant. Pour un affichage à la française (`9,99 $US`), il faudrait
> enregistrer la locale française (`registerLocaleData`) et fournir `LOCALE_ID` ; ce n'est pas le
> sujet du lab.

---

## 🎉 Challenge final

- [ ] `npm run api` répond, et `curl -s http://localhost:3000/api/auth/me` renvoie
      `Non authentifié`.
- [ ] Le FO passe par le proxy : les requêtes de l'onglet Réseau vont vers `localhost:4200/api/…`.
- [ ] Le catalogue et la fiche produit s'affichent ; `catalog-routes` est un chunk chargé à la
      demande.
- [ ] Une erreur HTTP est signalée par `[api] …` dans la console.

## ✅ Bonus

- Dans l'onglet Réseau, filtrez sur `chunk-` puis cliquez sur « Catalogue » depuis l'accueil :
  le fichier de la feature n'est téléchargé qu'à ce moment-là.
- Lisez `product-detail.ts` : quel est le type de l'`input()` `id`, et pourquoi le code
  l'entoure-t-il de `Number(…)` ?

## 🧠 Récap

- C'est l'API qui décide : la lecture est publique, l'écriture est réservée à `admin`, et la session
  vit dans un cookie httpOnly que le JavaScript ne peut pas lire.
- Le **proxy** met l'application et l'API sur la même origine, pour les deux applications.
- `@shop/api` contient la mécanique HTTP (`provideApi`, `ResourceService`, l'intercepteur) ;
  `@shop/products` contient le modèle, le service et les composants des produits.
- La carte produit est une brique de présentation : `input()` pour entrer, `output()` pour sortir,
  jamais d'import d'une application.

---

➡️ [03 — Le panier](03-PANIER.md)
