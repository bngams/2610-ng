# 🧪 07 — Les tests

> **Scénario guidé, environ 45 minutes.** Vous écrivez les tests de la boutique avec **Vitest**,
> le lanceur de tests par défaut d'Angular 22, dans cet ordre : un composant simple (la carte
> produit), un composant qui charge des données (la liste de produits), puis deux services (le
> store du panier et `ProductsService`). Les fichiers de test sont fournis en **squelettes** : les
> titres des tests sont écrits, en `it.todo`, et c'est à vous d'écrire leur corps. Les tests du
> guard et de l'intercepteur sont en bonus. Les tests complets sont dans `solution/`, à côté de
> chaque fichier testé.

## ✨ Objectifs

- Lancer les tests **d'un projet** du workspace : `npx ng test fo`, `npx ng test @shop/products`.
- Tester un composant : lui donner un `input`, cliquer, vérifier un `output` avec une fonction
  espion `vi.fn()`.
- Tester un composant qui appelle HTTP, sans réseau : `provideHttpClientTesting` et
  `HttpTestingController`.
- Tester un store (logique pure, persistance) et un service HTTP.

## 📁 Point de départ

Vous partez du workspace de l'étape 06. Depuis l'étape 01, aucun fichier de test n'existe : vous
avez supprimé ceux de la CLI et généré vos composants avec `--skip-tests`. Les quatre squelettes
fournis viennent se placer **à côté** du fichier qu'ils testent, comme le veut la convention
Angular :

```
libs/products/src/lib/
├── components/product-card/product-card.spec.ts     (section 2)
├── components/product-list/product-list.spec.ts     (section 3)
└── services/products.service.spec.ts                (section 5)
apps/fo/src/app/features/cart/services/cart.store.spec.ts   (section 4)
```

---

## ▶️ 1 — Lancer les tests d'un projet

### 1.1 — Copier les squelettes

Le dossier [assets/07-tests/](../assets/07-tests/) a la même arborescence que votre workspace :
une seule commande, depuis `shop/`, place chaque fichier au bon endroit.

```bash
cp -R ../03-minishop/assets/07-tests/. .
```

Voici les quatre fichiers copiés, et ce que chacun prépare déjà :

| Fichier | Ce qu'il contient |
|---|---|
| [product-card.spec.ts](../assets/07-tests/libs/products/src/lib/components/product-card/product-card.spec.ts) | un produit de test (`KEYBOARD`) et trois `it.todo` |
| [product-list.spec.ts](../assets/07-tests/libs/products/src/lib/components/product-list/product-list.spec.ts) | la configuration HTTP de test (`beforeEach`), la vérification finale (`afterEach`) et deux `it.todo` |
| [cart.store.spec.ts](../assets/07-tests/apps/fo/src/app/features/cart/services/cart.store.spec.ts) | deux produits de test, le nettoyage de `localStorage` avant chaque test, et quatre `it.todo` |
| [products.service.spec.ts](../assets/07-tests/libs/products/src/lib/services/products.service.spec.ts) | un `beforeEach` à compléter et deux `it.todo` |

### 1.2 — Un projet à la fois

Dans un workspace, `ng test` attend le **nom d'un projet**, celui que vous avez donné à la
génération. Pour une bibliothèque, c'est le nom scopé : un nom court est refusé, avec la liste des
noms possibles.

```
$ npx ng test products
Error: Invalid values:
  Argument: project, Given: "products", Choices: "@shop/api", "@shop/auth", "@shop/products", "@shop/ui", "bo", "fo"
```

Lancez les tests de la bibliothèque des produits, une seule fois (`--watch=false`) :

```bash
npx ng test @shop/products --watch=false
```

Vitest trouve les trois fichiers et les sept tests, tous marqués « à faire » :

```
 Test Files  3 skipped (3)
      Tests  7 todo (7)
```

Les tests du panier sont dans le projet `fo` : `npx ng test fo --watch=false` affiche
`1 skipped (1)` et `4 todo (4)`. Un `it.todo` est un test **déclaré mais pas écrit** : le lanceur le
compte sans échouer. Sans `--watch=false`, Vitest reste ouvert et relance les tests à chaque
enregistrement : c'est le mode le plus confortable pendant que vous écrivez.

> ⚠️ **Piège : `ng test` sans nom de projet.** Il lance les tests de **tous** les projets, l'un
> après l'autre. Ceux qui n'ont aucun fichier de test (`bo`, `@shop/api`, `@shop/ui`) s'arrêtent
> sur `Error: No tests found matching the following patterns: - Included: **/*.spec.ts,
> **/*.test.ts`. Nommez le projet.

### 1.3 — La boîte à outils

Les tests de cette étape utilisent une poignée d'outils, résumés ici et rappelés là où ils
servent. `describe`, `it`, `expect` et `vi` sont disponibles sans import (globales de Vitest).

| Outil | Rôle |
|---|---|
| `TestBed.createComponent(X)` | crée le composant `X` dans un environnement de test, et renvoie sa `fixture` |
| `fixture.componentRef.setInput('nom', valeur)` | donne une valeur à un `input()` |
| `await fixture.whenStable()` | attend que l'affichage soit à jour (Angular 22 n'a plus zone.js : rien n'est automatique) |
| `fixture.detectChanges()` | force un rendu, tout de suite, sans attendre |
| `fixture.nativeElement` | l'élément HTML du composant, pour `querySelector`, `textContent`, `click()` |
| `vi.fn()` | une fonction **espion** : elle enregistre ses appels (`toHaveBeenCalledWith(…)`) |
| `TestBed.inject(X)` | l'instance de `X` (un service, un store) |
| `provideHttpClientTesting()` + `HttpTestingController` | remplace le réseau : aucune requête ne part, et c'est le test qui répond (`expectOne(url).flush(données)`) |
| `TestBed.tick()` | exécute les `effect` en attente |

> 📖 [Angular : tester avec Vitest](https://angular.dev/guide/testing) ·
> [tester les composants](https://angular.dev/guide/testing/components-basics) ·
> [Vitest : `vi.fn`](https://vitest.dev/api/vi.html#vi-fn)

---

## 🃏 2 — Un composant simple : la carte produit

La carte produit est le cas le plus simple : pas de service, pas de HTTP, un `input()` qui entre et
un `output()` qui sort. Le premier test sert de modèle : il crée la carte, lui donne le produit de
test, attend l'affichage, et vérifie le texte. Dans
`libs/products/src/lib/components/product-card/product-card.spec.ts`, remplacez le premier
`it.todo` par ce test complet :

```ts
  it('affiche le nom du produit reçu en input', async () => {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', KEYBOARD); // un input se donne par setInput
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Clavier');
  });
```

Les deux tests suivants sont à vous. Le second vérifie qu'il n'y a **pas** de bouton quand `canAdd`
n'est pas donné ; le troisième est le cœur de la section : le clic sur « Ajouter » doit envoyer le
produit au panier. Le panier n'existe pas dans la bibliothèque (c'est une feature du FO) : il est
remplacé par une fonction espion, `vi.fn()`, branchée sur l'`output()` `add`. Remplacez les deux
`it.todo` restants par ces squelettes, et complétez les `TODO` :

🚧 **À compléter :**

```ts
  it("n'affiche pas « Ajouter » par défaut", async () => {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', KEYBOARD);
    await fixture.whenStable();
    // TODO 1 : aucun <button> dans la carte (querySelector('button') vaut null)
  });

  it('un clic sur « Ajouter » envoie le produit au panier', async () => {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', KEYBOARD);
    // TODO 2 : donner la valeur true à l'input canAdd
    // le panier est remplacé par une fonction espion, branchée sur l'output add
    const cartAdd = vi.fn();
    fixture.componentInstance.add.subscribe(cartAdd);
    await fixture.whenStable();

    // TODO 3 : cliquer sur le bouton (querySelector('button')!.click())

    expect(cartAdd).toHaveBeenCalledTimes(1);
    // TODO 4 : vérifier que cartAdd a reçu KEYBOARD (toHaveBeenCalledWith)
  });
```

Pour le `TODO 1`, `expect(…querySelector('button')).toBeNull()`. Notez le `!` du `TODO 3` : il dit
à TypeScript que l'élément existe, ce que le `TODO 2` garantit justement (`canAdd` vaut `true`).

> 💡 **Tester :** `npx ng test @shop/products --watch=false` affiche
> `Tests  3 passed | 4 todo (7)`. Pour vérifier qu'un test sait échouer, remplacez
> provisoirement `add.emit(product())` par `add.emit({ ...product(), id: 99 })` dans
> `product-card.html` : le troisième test passe au rouge sur `toHaveBeenCalledWith`. Remettez le
> code.

---

## 📋 3 — Un composant qui charge ses données : la liste de produits

`ProductList` appelle l'API par `ProductsService.listResource()`. Dans un test, on ne veut ni
réseau, ni API lancée : `provideHttpClientTesting()` remplace le transport HTTP, et
`HttpTestingController` permet de **répondre à la main**, au moment choisi. Le squelette configure
déjà tout cela dans son `beforeEach`, avec aussi l'adresse de l'API, `API_URL`, que `provideApi()`
fournirait dans une vraie application. Son `afterEach` appelle `http.verify()`, qui échoue s'il
reste une requête sans réponse.

Le déroulé d'un test HTTP a trois temps : provoquer la requête (ici, afficher le composant), y
répondre (`expectOne(url).flush(données)`), puis vérifier l'affichage. Remplacez les deux `it.todo`
de `product-list.spec.ts` par ces squelettes et complétez les `TODO` :

🚧 **À compléter :**

```ts
  it('affiche « Chargement » puis une carte par produit reçu', async () => {
    const fixture = TestBed.createComponent(ProductList);
    // pas de whenStable ici : la requête en attente empêcherait l'application d'être « stable »
    fixture.detectChanges(); // premier rendu : la requête part
    const element = fixture.nativeElement as HTMLElement;
    // TODO 1 : le texte contient « Chargement »

    // on répond à la main à la requête que le composant a envoyée
    http.expectOne('/api/products').flush([
      { id: 1, name: 'Clavier', price: 89, category: 'test', description: '', thumbnail: '' },
      { id: 2, name: 'Souris', price: 45, category: 'test', description: '', thumbnail: '' },
    ]);
    await fixture.whenStable();

    // TODO 2 : deux éléments lib-product-card (querySelectorAll(…).length)
  });

  it("affiche un message si l'API répond en erreur", async () => {
    const fixture = TestBed.createComponent(ProductList);
    fixture.detectChanges();

    // TODO 3 : répondre par une erreur 500 :
    //          http.expectOne('/api/products').flush('boom', { status: 500, statusText: 'Server Error' })
    await fixture.whenStable();

    // TODO 4 : le texte contient « indisponibles »
  });
```

> ⚠️ **Piège : `whenStable()` avant d'avoir répondu.**
> - *Symptôme :* le test reste bloqué, puis échoue sur `Error: Test timed out in 5000ms.`, suivi de
>   `Error: Expected no open requests, found 1: GET /api/products`.
> - *Cause :* tant qu'une requête HTTP est en attente, Angular considère que l'application n'est
>   pas « stable ». Or c'est le test qui doit répondre, et il attend que l'application soit stable
>   avant de le faire : chacun attend l'autre.
> - *Correctif :* avant la réponse, `fixture.detectChanges()` (un rendu immédiat, qui fait partir
>   la requête) ; après `flush()`, `await fixture.whenStable()`.

> 💡 **Tester :** `npx ng test @shop/products --watch=false` affiche
> `Tests  5 passed | 2 todo (7)`.

> 📖 [Tester les requêtes HTTP](https://angular.dev/guide/http/testing)

---

## 🧺 4 — Un service, de la logique pure : le store du panier

Un store se teste sans afficher le moindre composant : on l'obtient avec `TestBed.inject`, on
appelle ses actions, on vérifie ses valeurs dérivées. Aucune configuration n'est nécessaire, car
le store est un `@Service()` : `TestBed` sait le fabriquer. Chaque test repart d'un `TestBed` neuf,
donc d'un store neuf ; comme le store relit `localStorage` à sa construction, le squelette vide le
stockage avant chaque test.

Les deux produits de test, `PEN` (1,5) et `NOTEBOOK` (4), rendent les calculs faciles à vérifier
de tête. Dans `apps/fo/src/app/features/cart/services/cart.store.spec.ts`, écrivez les quatre tests
à partir des indices :

| Test | Actions | Vérifications |
|---|---|---|
| calcule `count` et `total` après des ajouts | `add(PEN)` deux fois, `add(NOTEBOOK)` une fois | `lines()` a 2 lignes, `count()` vaut 3, `total()` vaut 7 |
| `changeQty` à 0 retire la ligne | `add(PEN)`, puis `changeQty(PEN.id, 0)` | `lines()` vaut `[]` (`toEqual([])`) |
| `clear` vide le panier | `add(NOTEBOOK)`, puis `clear()` | `count()` vaut 0 |
| sauvegarde dans `localStorage`, et relit au démarrage | voir ci-dessous | voir ci-dessous |

Le premier s'écrit ainsi ; les deux suivants ont la même forme.

```ts
  it('calcule count et total après des ajouts', () => {
    const cart = TestBed.inject(CartStore);
    cart.add(PEN);
    cart.add(PEN);
    cart.add(NOTEBOOK);
    expect(cart.lines()).toHaveLength(2); // deux lignes : le stylo (x2) et le cahier
    expect(cart.count()).toBe(3);
    expect(cart.total()).toBe(7); // 2 x 1,5 + 4
  });
```

Le dernier test vérifie la persistance, en deux temps. D'abord, l'`effect` qui écrit dans
`localStorage` ne s'exécute pas tout seul dans un test : `TestBed.tick()` le déclenche. Ensuite,
pour simuler un F5, `TestBed.resetTestingModule()` jette l'injecteur : le `TestBed.inject` suivant
fabrique un **nouveau** store, qui relit le stockage.

🚧 **À compléter :**

```ts
  it('sauvegarde dans localStorage, et relit au démarrage', () => {
    TestBed.inject(CartStore).add(NOTEBOOK);
    // TODO 1 : laisser l'effect s'exécuter
    expect(JSON.parse(localStorage.getItem('minishop.cart')!)).toHaveLength(1);

    // TODO 2 : une « nouvelle application », comme après F5
    // TODO 3 : un nouveau store, dont count() vaut 1
  });
```

> 💡 **Tester :** `npx ng test fo --watch=false` affiche `Test Files  1 passed (1)` et
> `Tests  4 passed (4)`.

---

## 🛰️ 5 — Un service HTTP : `ProductsService`

Dernier fichier : `ProductsService`, sans composant. Ce qu'on vérifie, c'est la **requête** qu'il
envoie (l'adresse, la méthode), puis ce qu'il renvoie une fois qu'on a répondu.

Le `beforeEach` du squelette contient un `TODO` : la même configuration que dans
`product-list.spec.ts` (`provideHttpClient()`, `provideHttpClientTesting()` et `API_URL`). Une
fois ce `TODO` fait, remplacez les deux `it.todo` en suivant ce modèle, qui teste `list()` :

```ts
  it('list() fait un GET sur /api/products', () => {
    let received: Product[] = [];
    service.list().subscribe((products) => (received = products));

    const req = http.expectOne('/api/products');
    expect(req.request.method).toBe('GET');
    req.flush([
      { id: 1, name: 'Clavier', price: 89, category: 'test', description: '', thumbnail: '' },
    ]);

    expect(received).toHaveLength(1);
  });
```

Le test de `get(3)` suit la même forme : s'abonner à `service.get(3)`, répondre à
`expectOne('/api/products/3')` avec un produit dont le nom est `'Écran'`, puis vérifier le nom
reçu. Ici, `subscribe` reçoit la réponse **pendant** `flush()` : pas besoin d'`async` ni d'attente.

> 💡 **Tester :** `npx ng test @shop/products --watch=false` affiche tous les tests de la
> bibliothèque au vert :
>
> ```
>  Test Files  3 passed (3)
>       Tests  7 passed (7)
> ```

---

## 🎉 Challenge final

- [ ] `npx ng test @shop/products --watch=false` : `7 passed`.
- [ ] `npx ng test fo --watch=false` : `4 passed`.
- [ ] Aucun test ne dépend de l'API lancée : arrêtez-la (terminal 1) et relancez les tests.
- [ ] Vous avez fait échouer au moins un test exprès, puis réparé le code.

## ✅ Bonus : le guard et l'intercepteur

Les deux pièces de `@shop/auth` se testent aussi, avec deux outils de plus. La solution contient
leurs tests, à lire puis à réécrire de mémoire, chacun **à côté du fichier qu'il teste** :

| Fichier à créer dans votre workspace | Modèle dans la solution |
|---|---|
| `libs/auth/src/lib/guards/auth.guard.spec.ts` | [solution/libs/auth/src/lib/guards/auth.guard.spec.ts](../solution/libs/auth/src/lib/guards/auth.guard.spec.ts) |
| `libs/auth/src/lib/interceptors/auth.interceptor.spec.ts` | [solution/libs/auth/src/lib/interceptors/auth.interceptor.spec.ts](../solution/libs/auth/src/lib/interceptors/auth.interceptor.spec.ts) |

Voici ce que montre chacun de leurs tests :

| Test | Ce qu'il montre |
|---|---|
| `authGuard`, anonyme | un guard fonctionnel s'exécute avec `TestBed.runInInjectionContext(() => authGuard(…))` ; le résultat est un `UrlTree`, dont `String(…)` vaut `/login?returnUrl=%2Fcart%2Fcheckout` |
| `authGuard`, connecté | `vi.spyOn(session, 'isLoggedIn').mockReturnValue(true)` remplace la réponse du store, et le guard renvoie `true` |
| l'intercepteur, 401 métier | `provideHttpClient(withInterceptors([authInterceptor]))`, un `DELETE` qui reçoit `401`, et des espions sur `Router.navigate` et `SessionStore.logout` |
| l'intercepteur, 401 sur `/auth/login` | le même `401`, sans aucune navigation |

> 💡 **Tester :** une fois les deux fichiers en place, `npx ng test @shop/auth --watch=false`
> affiche `Test Files  2 passed (2)` et `Tests  4 passed (4)`.

## 🧠 Récap

- Dans un workspace, `ng test <projet>` : `fo`, `@shop/products`, `@shop/auth`. Vitest est le
  lanceur par défaut d'Angular 22 ; un `it.todo` est compté sans échouer.
- Un composant : `setInput`, `whenStable`, `nativeElement`, et `vi.fn()` sur un `output()`.
- HTTP sans réseau : `provideHttpClientTesting()`, `expectOne(url).flush(…)`, `verify()` ; avant la
  réponse, `detectChanges()`, pas `whenStable()`.
- Un store : `TestBed.inject`, des actions, des valeurs dérivées ; `TestBed.tick()` pour les
  `effect`, `resetTestingModule()` pour simuler un F5.

---

Vous avez terminé le cœur du lab. La suite assemble la boutique autrement : une bannière promo
livrée par une autre application, chargée à l'exécution.

➡️ [08 — Une bannière promo en micro-frontend](08-MICRO-FRONTEND.md)
