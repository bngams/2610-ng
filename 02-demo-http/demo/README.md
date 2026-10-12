# Démo HTTP — Angular 22

Le projet montré en direct le jour 2. Il contient **tout le code** de la page
[HTTP en pratique](../index.html) : chaque extrait de la page est copié d'un fichier d'ici.

Il lit l'API publique [dummyjson.com](https://dummyjson.com/docs) : une liste de produits paginée,
le détail d'un produit, et une écriture simulée (dummyjson répond aux POST et PATCH mais n'enregistre rien).
Il faut donc une connexion internet.

## Lancer

Il faut **Node.js 22.22 ou 24.15 minimum** (`node -v` ; sinon `nvm install 24 && nvm use 24`).

```bash
npm install
npm start          # ng serve, puis ouvrir http://localhost:4200
```

Les autres commandes utiles : `npx ng build` produit le bundle de production dans `dist/demo/`
(il utilise `environment.ts`), et `npm test` lance l'unique test Vitest, celui de l'adaptateur `toPage`.

## Ce qu'il faut montrer, dans l'ordre

Gardez les outils de développement ouverts (onglets **Console** et **Réseau**) : chaque requête y laisse une
ligne `[HTTP] ...` écrite par l'intercepteur de log.

| # | Écran / fichier | Ce qu'on montre | Section de la page |
|---|---|---|---|
| 1 | [`src/app/app.config.ts`](src/app/app.config.ts) | les providers : routeur avec `withComponentInputBinding()`, `provideHttpClient(withInterceptors([...]))` | 1 |
| 2 | [`src/app/app.routes.ts`](src/app/app.routes.ts), puis l'onglet Réseau | `loadComponent` : le chunk d'un écran n'arrive qu'à sa première visite | 2 |
| 3 | **Bases HttpClient** ([`src/app/pages/http-basics.ts`](src/app/pages/http-basics.ts)) | deux abonnements au même Observable => deux `GET /products/1` dans la console | 3 |
| 4 | **Produits (RxJS)** puis **Produits (httpResource)** | la même pagination écrite deux fois : `toSignal` + `switchMap`, puis `httpResource` | 3 et 5 |
| 5 | **Bases HttpClient**, le tableau « Le piège de la classe » | `get<ProductModel>()` ne crée pas d'instance : `instanceof` vaut `false` | 4 |
| 6 | [`src/app/core/page.ts`](src/app/core/page.ts) et [`resource.service.ts`](src/app/core/resource.service.ts) | l'enveloppe `{ products, total, skip, limit }` devient `Page<T>`, déballée dans le service | 5 |
| 7 | [`src/app/products/products.service.ts`](src/app/products/products.service.ts) | la sous-classe de trois lignes de `ResourceService<number, Product>` | 6 |
| 8 | Un produit, puis **Produit suivant** | `input()` et `paramMap` passent à l'id suivant, le `snapshot` reste figé | 2 |
| 9 | Le bouton **Baisser le prix** cliqué trois fois vite | `exhaustMap` : un seul `PATCH` dans la console | 6 |
| 10 | L'en-tête de l'appli, [`src/environments/`](src/environments/), [`angular.json`](angular.json) | `env : development` avec `npm start` ; `fileReplacements` | 7 |
| 11 | Réseau, une requête vers dummyjson, en-têtes | `Authorization: Bearer faux-jeton-de-demo` | 8 |
| 12 | **Bases HttpClient**, boutons 404 puis 401 | 404 : `error` écrit avant `logging` (ordre inverse au retour) ; 401 : redirection vers `/connexion` | 8 |

Pour la section 7, le « pas de secret dans le front » se prouve après un build :

```bash
npx ng build
grep -o 'faux-jeton-de-demo' dist/demo/browser/*.js    # le faux jeton est dans le bundle, en clair
```

## Avertissement

`FAKE_DEMO_TOKEN`, dans [`src/app/core/interceptors/auth.interceptor.ts`](src/app/core/interceptors/auth.interceptor.ts), est un **faux jeton** écrit en dur pour
la démo. Dans une vraie application, le jeton vient d'un service d'authentification après la connexion, jamais
d'une constante dans le code.
