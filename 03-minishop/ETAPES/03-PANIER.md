# 🧺 03 — Le panier

> **Scénario guidé, environ 40 minutes.** Le panier est votre premier **store** : un service qui
> garde une donnée partagée par des composants éloignés les uns des autres. Vous écrivez le store
> à partir d'un squelette à trous (`// TODO`), puis vous le branchez sur le catalogue, sur un
> badge dans l'en-tête, et sur deux pages, le panier et la commande. La solution est dans
> `solution/apps/fo/src/app/features/cart/`, à n'ouvrir qu'en cas de blocage.

## ✨ Objectifs

- Écrire un **service qui sert de store** : un état privé dans un `signal`, une vue en lecture
  seule, des valeurs dérivées en `computed`, des actions qui produisent un nouvel état.
- **Persister** le panier dans `localStorage` avec un `effect`, et savoir pourquoi c'est acceptable
  pour un panier et pas pour un jeton.
- Placer un composant de l'application dans l'**emplacement** `<ng-content>` de l'en-tête de `ui`.
- Brancher l'`output()` d'un composant de bibliothèque sur un service de l'application.

## 📁 Point de départ

Vous partez du workspace de l'étape 02 : le catalogue s'affiche, l'API tourne dans le terminal 1
et le FO dans le terminal 2. Le panier est une **feature du FO** : il vit dans
`apps/fo/src/app/features/cart/`, et pas dans une bibliothèque, car le BO n'a pas de panier. On
extrait une bibliothèque le jour où une deuxième application en a besoin. À la fin de cette étape,
la feature ressemble à ceci :

```
apps/fo/src/app/features/cart/
├── cart.routes.ts                  /cart et /cart/checkout
├── services/cart.store.ts          CartStore : le store (section 2)
├── components/cart-badge/          le bouton « Panier » et sa pastille, dans l'en-tête (section 3)
└── pages/
    ├── cart/                       la page panier (section 5)
    └── checkout/                   la commande, simulée (section 5)
```

---

## 🤔 1 — Pourquoi un store

Le panier est lu et modifié par cinq composants qui ne sont pas parents les uns des autres : le
catalogue et la fiche produit **ajoutent**, le badge de l'en-tête **affiche le nombre** d'articles,
la page panier **liste et modifie** les lignes, la commande **lit le total puis vide** le panier.
Faire circuler ces données par des `input()` et des `output()` à travers toute l'application serait
fragile, et garder une copie dans chaque composant finirait par donner des chiffres différents.

Un store règle la question avec trois règles :

| Question | Réponse du store |
|---|---|
| Où est la donnée ? | à un seul endroit, le service : tout le monde lit la même valeur |
| Qui a le droit de la modifier ? | le store seul : les composants appellent ses méthodes, ils n'écrivent jamais l'état |
| Comment les lecteurs sont-ils prévenus ? | par les signals : quand l'état change, tout ce qui le lit se met à jour |

> 📖 [Synthèse : un service comme store](https://bngams.github.io/2610-ng/03-intro-store/)

---

## 🏪 2 — Écrire `CartStore`

### 2.1 — Générer le service

Le store est un service. On le génère dans la famille `services/` de la feature, avec l'option
`--type store` : le fichier s'appellera `cart.store.ts` et la classe `CartStore`, ce qui dit tout
de suite que ce service garde un état.

```bash
npx ng generate service features/cart/services/cart --type store --project fo --skip-tests
```

La CLI crée un fichier de trois lignes, avec le décorateur d'Angular 22 vu à l'étape 02 :

```ts
import { Service } from '@angular/core';

@Service()
export class CartStore {}
```

`@Service()` fournit une seule instance pour toute l'application : c'est précisément ce qu'il faut
pour un store (en v20 : `@Injectable({ providedIn: 'root' })`).

### 2.2 — Les cinq pièces du pattern

Avant de compléter le fichier, voici les cinq pièces qu'il assemble, dans l'ordre où elles y
apparaissent :

| Pièce | Écriture | Rôle |
|---|---|---|
| l'état | `private readonly _lines = signal<CartLine[]>(…)` | un signal **privé** : seul le store peut appeler `set` ou `update` |
| la vue publique | `readonly lines = this._lines.asReadonly()` | le même signal, sans `set` ni `update` : les composants lisent, c'est tout |
| les valeurs dérivées | `computed(() => …)` | le nombre d'articles et le total, recalculés seulement quand l'état change |
| la persistance | `effect(() => localStorage.setItem(…))` | un effet de bord : recopier l'état hors du monde des signals, à chaque changement |
| les actions | `add()`, `remove()`, `changeQty()`, `clear()` | les seules portes d'entrée, qui produisent toujours un **nouveau** tableau |

Le dernier point compte : un signal prévient ses lecteurs quand sa valeur **change de référence**.
Un tableau modifié en place (`push`, `splice`, `line.qty++`) reste le même tableau, et personne
n'est prévenu. On produit donc une copie : `[...lines, x]`, `map`, `filter`.

### 2.3 — Compléter le store

Remplacez le contenu de `apps/fo/src/app/features/cart/services/cart.store.ts` par ce squelette,
puis complétez les six `TODO`. Le type `CartLine` est déclaré dans le même fichier, car il
n'appartient qu'au panier.

🚧 **À compléter :**

```ts
import { Service, computed, effect, signal } from '@angular/core';
import { Product } from '@shop/products';

/** Une ligne du panier : un produit et sa quantité. */
export interface CartLine {
  product: Product;
  qty: number;
}

const STORAGE_KEY = 'minishop.cart';

/** Le panier : un service qui sert de store (une seule instance, un état privé, des signals). */
@Service() // Angular 22 : fourni à la racine (en v20 : @Injectable({ providedIn: 'root' }))
export class CartStore {
  // l'état : PRIVÉ, seul le store peut l'écrire ; relu dans localStorage au démarrage
  private readonly _lines = signal<CartLine[]>(readSavedCart());

  // la vue publique : le même signal, en lecture seule (pas de set ni d'update)
  // TODO 1 : readonly lines = …

  // les valeurs dérivées : des computed, recalculés quand _lines change
  // TODO 2 : readonly count = computed(…) -> la somme des qty
  // TODO 3 : readonly total = computed(…) -> la somme des qty * product.price

  constructor() {
    // effet de bord : recopier l'état dans localStorage à chaque changement
    // TODO 4 : un effect qui écrit JSON.stringify(this._lines()) sous STORAGE_KEY
  }

  // les actions : les seules portes d'entrée, qui produisent toujours un NOUVEAU tableau
  add(product: Product): void {
    this._lines.update((lines) => {
      const existing = lines.find((line) => line.product.id === product.id);
      return existing
        ? lines.map((line) => (line === existing ? { ...line, qty: line.qty + 1 } : line))
        : [...lines, { product, qty: 1 }];
    });
  }

  remove(productId: number): void {
    // TODO 5 : un nouveau tableau, sans la ligne de ce produit (filter)
  }

  changeQty(productId: number, qty: number): void {
    if (qty <= 0) {
      this.remove(productId);
      return;
    }
    // TODO 6 : un nouveau tableau, où seule la ligne de ce produit est remplacée par { ...line, qty }
  }

  clear(): void {
    this._lines.set([]);
  }
}

/** Relit le panier sauvegardé, sans jamais faire planter le démarrage. */
function readSavedCart(): CartLine[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as CartLine[]) : [];
  } catch {
    return []; // JSON corrompu, ou stockage indisponible
  }
}
```

Chaque `TODO` a son indice :

| TODO | Indice |
|---|---|
| 1 | `asReadonly()` sur le signal privé |
| 2 | `this._lines().reduce((n, line) => n + line.qty, 0)` |
| 3 | même forme que le 2, avec `line.qty * line.product.price` |
| 4 | `effect(() => localStorage.setItem(STORAGE_KEY, …))` : un `effect` relit les signals qu'il utilise, donc il se relance à chaque changement de `_lines` |
| 5 | `this._lines.update((lines) => lines.filter(…))` |
| 6 | `this._lines.update((lines) => lines.map(…))`, sur le modèle d'`add()` |

`add()` est donné en entier : il montre les deux cas d'une action immuable. Si le produit est déjà
dans le panier, `map` produit un nouveau tableau où seule sa ligne est remplacée par une copie
avec `qty + 1` ; sinon, on ajoute une ligne à une copie du tableau.

> ⚖️ **`localStorage` : bon pour un panier, pas pour un jeton.** Tout le JavaScript de la page peut
> lire `localStorage`, y compris un script injecté par une faille XSS. Pour un panier, ce n'est pas
> grave : il ne contient rien de secret. Pour un jeton d'authentification, ce serait le voler :
> c'est pourquoi l'étape 04 garde la session dans un cookie httpOnly. Autre conséquence : ce qu'on
> relit de `localStorage` a pu être modifié par l'utilisateur, prix compris. Le panier sert à
> l'affichage ; au moment d'une vraie commande, le serveur recalcule les prix.

> 📖 [`signal`, `computed`, `asReadonly`](https://angular.dev/guide/signals) ·
> [`effect`, et quand ne pas l'utiliser](https://angular.dev/guide/signals/effect) ·
> [`localStorage` (MDN)](https://developer.mozilla.org/fr/docs/Web/API/Window/localStorage)

---

## 🏷️ 3 — Le badge du panier, dans l'en-tête

Le badge est un composant du FO qui lit `count()` et mène vers la page panier. Il se range dans
la famille `components/` de la feature. Générez-le :

```bash
npx ng generate component features/cart/components/cart-badge --project fo --skip-tests
```

Le badge injecte le store et n'a aucune donnée à lui. La pastille vient du module `MatBadge` de
Material, importé par le barrel de `@shop/ui`. Remplacez le contenu de
`apps/fo/src/app/features/cart/components/cart-badge/cart-badge.ts` :

```ts
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatBadgeModule, MatButtonModule } from '@shop/ui';
import { CartStore } from '../../services/cart.store';

@Component({
  imports: [RouterLink, MatButtonModule, MatBadgeModule],
  selector: 'app-cart-badge',
  styleUrl: './cart-badge.css',
  templateUrl: './cart-badge.html',
})
export class CartBadge {
  // le badge LIT le store, il ne possède aucune donnée
  protected readonly cart = inject(CartStore);
}
```

Le template est un bouton « Panier » qui porte la pastille ; elle est masquée tant que le panier
est vide. Remplacez le contenu de `cart-badge.html` par ce squelette, et complétez les deux `TODO` :

🚧 **À compléter :**

```html
<a
  mat-button
  routerLink="/cart"
  [matBadge]="/* TODO 1 : le nombre d'articles du store */"
  [matBadgeHidden]="/* TODO 2 : vrai quand ce nombre vaut 0 */"
  matBadgeOverlap="false"
  >Panier</a
>
```

La pastille déborde à droite du bouton : pour lui laisser de la place, remplacez le contenu de
`cart-badge.css` :

```css
/* de la place pour la pastille, qui déborde à droite du bouton */
:host {
  margin-right: 16px;
}
```

C'est le moment d'utiliser l'**emplacement libre** de l'en-tête, préparé à l'étape 01. Dans
`apps/fo/src/app/app.html`, l'en-tête n'est plus fermé tout de suite : il entoure le badge, qui
sera projeté à la place de `<ng-content />`.

```html
<lib-header title="MiniShop" [menuItems]="menu">
  <app-cart-badge />
</lib-header>
<main>
  <router-outlet />
</main>
```

Dans `apps/fo/src/app/app.ts`, importez le composant
(`import { CartBadge } from './features/cart/components/cart-badge/cart-badge';`) et ajoutez
`CartBadge` au tableau `imports` du décorateur.

> ℹ️ **`ui` ne connaît toujours pas le panier.** L'en-tête de `@shop/ui` n'importe pas `CartBadge` :
> c'est l'application qui compose les deux. C'est ce qui permet au BO d'utiliser le même en-tête
> sans panier.

> 📖 [Angular Material : badge](https://material.angular.dev/components/badge/overview)

---

## ➕ 4 — Ajouter au panier depuis le catalogue

Depuis l'étape 02, la carte produit sait afficher un bouton « Ajouter » (`canAdd`) et émettre le
produit cliqué (`add`). Le catalogue est l'endroit où l'on branche cet événement sur le store.
Dans `apps/fo/src/app/features/catalog/pages/catalog/catalog.ts`, injectez le store, à côté des
produits :

```ts
import { CartStore } from '../../../cart/services/cart.store';
// ...
  protected readonly products = inject(ProductsService).listResource();
  protected readonly cart = inject(CartStore);
```

Le catalogue importe ainsi une autre feature du même FO : c'est permis à l'intérieur d'une
application. Dans le template `catalog.html`, la balise de la carte reçoit deux liaisons de plus :

🚧 **À compléter :**

```html
      <lib-product-card [product]="product" [canAdd]="true" (add)="/* TODO : ajouter $event au panier */">
        <a mat-button [routerLink]="['/catalog', product.id]">Détails</a>
      </lib-product-card>
```

Rappel : dans une liaison d'événement `(add)`, `$event` est la valeur émise par l'`output()`, ici
le produit.

La fiche produit mérite le même bouton. Dans
`features/catalog/pages/product-detail/product-detail.ts`, injectez aussi le store
(`protected readonly cart = inject(CartStore);`, avec le même import), puis dans
`product-detail.html`, ajoutez cette ligne juste après le paragraphe de la description, à
l'intérieur du bloc `@else if` :

```html
  <button mat-flat-button type="button" (click)="cart.add(p)">Ajouter au panier</button>
```

---

## 🧾 5 — La page panier et la commande

### 5.1 — Générer les deux pages et leurs routes

Les deux pages vivent dans la famille `pages/` de la feature. Générez-les :

```bash
npx ng generate component features/cart/pages/cart --project fo --skip-tests
npx ng generate component features/cart/pages/checkout --project fo --skip-tests
```

La feature déclare ses routes dans son propre fichier, comme le catalogue. Créez
`apps/fo/src/app/features/cart/cart.routes.ts` :

```ts
import { Routes } from '@angular/router';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';

export const CART_ROUTES: Routes = [
  { path: '', component: Cart },
  { path: 'checkout', component: Checkout },
];
```

Puis, dans `apps/fo/src/app/app.routes.ts`, chargez-la à la demande, après la route `catalog` et
avant `**` :

```ts
  {
    path: 'cart',
    loadChildren: () => import('./features/cart/cart.routes').then((m) => m.CART_ROUTES),
  },
```

### 5.2 — La page panier

La page lit `lines()` et `total()`, et ses boutons appellent les actions : elle ne modifie jamais
l'état elle-même. Remplacez le contenu de `features/cart/pages/cart/cart.ts` :

```ts
import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@shop/ui';
import { CartStore } from '../../services/cart.store';

@Component({
  imports: [CurrencyPipe, RouterLink, MatButtonModule],
  selector: 'app-cart',
  styleUrl: './cart.css',
  templateUrl: './cart.html',
})
export class Cart {
  protected readonly cart = inject(CartStore);
}
```

Le template affiche une ligne par produit, avec « - », la quantité, « + », le prix de la ligne et
« Retirer ». Complétez les trois actions de `cart.html` :

🚧 **À compléter :**

```html
<h1>Mon panier</h1>
@for (line of cart.lines(); track line.product.id) {
  <div class="line">
    <span class="name">{{ line.product.name }}</span>
    <button mat-stroked-button type="button" (click)="/* TODO 1 : une unité de moins */">-</button>
    <span class="qty">{{ line.qty }}</span>
    <button mat-stroked-button type="button" (click)="/* TODO 2 : une unité de plus */">+</button>
    <span class="price">{{ line.qty * line.product.price | currency: 'USD' }}</span>
    <button mat-button type="button" (click)="/* TODO 3 : retirer la ligne */">Retirer</button>
  </div>
} @empty {
  <p>Votre panier est vide. <a routerLink="/catalog">Voir le catalogue</a></p>
}
@if (cart.count() > 0) {
  <p class="total">Total : {{ cart.total() | currency: 'USD' }}</p>
  <a mat-flat-button routerLink="/cart/checkout">Passer commande</a>
}
```

`changeQty()` retire la ligne quand la quantité tombe à 0 : les boutons « - » et « + » n'ont pas
besoin d'autre action. La mise en page aligne chaque ligne ; remplacez le contenu de `cart.css` :

```css
.line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--mat-sys-outline-variant);
}
.name {
  flex: 1;
}
.qty {
  min-width: 2em;
  text-align: center;
}
.price {
  min-width: 6em;
  text-align: right;
}
.total {
  font: var(--mat-sys-title-large);
}
```

### 5.3 — La commande, simulée

Il n'y a pas d'API de commandes : la commande est **simulée**. Un clic sur « Confirmer » affiche
un message de confirmation, puis vide le panier. Remplacez le contenu de
`features/cart/pages/checkout/checkout.ts` :

```ts
import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@shop/ui';
import { CartStore } from '../../services/cart.store';

@Component({
  imports: [CurrencyPipe, RouterLink, MatButtonModule],
  selector: 'app-checkout',
  styleUrl: './checkout.css',
  templateUrl: './checkout.html',
})
export class Checkout {
  protected readonly cart = inject(CartStore);
  /** Le message affiché une fois la commande confirmée. */
  protected readonly confirmation = signal('');

  /** Commande simulée : pas d'API de commandes, un message puis un panier vide. */
  confirm(): void {
    this.confirmation.set(
      `Merci ! Votre commande de ${this.cart.count()} article(s) est confirmée.`,
    );
    this.cart.clear();
  }
}
```

Le message est calculé **avant** `clear()` : après, `count()` vaudrait 0. Le template a trois
états, la confirmation, le panier vide et le récapitulatif ; remplacez le contenu de
`checkout.html` :

```html
<h1>Commande</h1>
@if (confirmation()) {
  <p class="confirmation">{{ confirmation() }}</p>
  <a mat-button routerLink="/catalog">Retour au catalogue</a>
} @else if (cart.count() === 0) {
  <p>Votre panier est vide. <a routerLink="/catalog">Voir le catalogue</a></p>
} @else {
  <p>{{ cart.count() }} article(s), pour un total de {{ cart.total() | currency: 'USD' }}.</p>
  <button mat-flat-button type="button" (click)="confirm()">Confirmer la commande</button>
}
```

Une seule règle de style met la confirmation en valeur ; remplacez le contenu de
`checkout.css` :

```css
.confirmation {
  font: var(--mat-sys-title-medium);
  color: var(--mat-sys-primary);
}
```

Pour l'instant, n'importe qui peut commander : l'étape 05 réservera cette page aux utilisateurs
connectés.

---

## 🚀 6 — Vérifier

Commencez par le build : une deuxième feature chargée à la demande apparaît.

```bash
npx ng build fo
```

La sortie liste maintenant deux chunks à la demande :

```
Lazy chunk files    | Names          |  Raw size | Estimated transfer size
chunk-45F5EJB3.js   | catalog-routes |  12.83 kB |                 3.11 kB
chunk-GB3SPI4K.js   | cart-routes    |   3.40 kB |                 1.20 kB
```

Vérifiez ensuite le comportement dans le navigateur, en partant d'un panier vide.

> 💡 **Tester :** sur http://localhost:4200/catalog, cliquez deux fois sur « Ajouter » du premier
> produit (le mascara) et une fois sur celui du deuxième (la palette) : la pastille du bouton
> « Panier » passe à **3**. Dans la console, `localStorage.getItem('minishop.cart')` renvoie les
> deux lignes (le mascara avec `"qty":2`, la palette avec `"qty":1`). Appuyez sur F5 : la pastille
> affiche toujours 3. La page `/cart` affiche les deux lignes, `$19.98` et `$19.99`, et
> « Total : $39.97 » ; « - » sur la palette retire sa ligne, et la pastille passe à 2 **sans autre code**, puisque le badge lit le
> même store. Enfin, « Passer commande » puis « Confirmer la commande » affiche « Merci ! Votre
> commande de 2 article(s) est confirmée. », la pastille disparaît, et `localStorage` contient
> `[]`.

> 🧪 **Manip — un `localStorage` corrompu**
>
> 1. Dans la console, `localStorage.setItem('minishop.cart', '{pas du json')`.
> 2. Rechargez la page (F5).
> 3. Observez la pastille et la console.
>
> *Observé : l'application démarre normalement, avec un panier vide : le `try/catch` de
> `readSavedCart()` a joué son rôle. Sans lui, `JSON.parse` lèverait une erreur pendant la
> construction du store, et le FO ne démarrerait pas.*

---

## 🎉 Challenge final

- [ ] `CartStore` n'expose aucun `WritableSignal` : `lines` est en lecture seule, `count` et
      `total` sont des `computed`.
- [ ] Les actions produisent toujours un nouveau tableau (aucun `push`, aucune modification
      d'une ligne existante).
- [ ] Le badge, la page panier et la commande affichent les mêmes chiffres, et ils survivent à un
      F5.
- [ ] `@shop/ui` et `@shop/products` n'importent rien du panier.

## ✅ Bonus

- Ajoutez au store un `computed` `isEmpty`, et utilisez-le dans la page panier à la place de
  `cart.count() > 0`.
- Lisez la section « Quand passer à NgRx SignalStore » de la
  [synthèse store](https://bngams.github.io/2610-ng/03-intro-store/) : comment s'écrirait le même
  panier avec `signalStore` ?

## 🧠 Récap

- Un store est un service unique, qui garde un état **privé** dans un signal, l'expose par une vue
  `asReadonly()`, en dérive des valeurs par des `computed`, et le modifie par des méthodes qui
  produisent toujours une copie.
- `effect` sert aux effets de bord hors des signals, comme écrire dans `localStorage` ; jamais à
  calculer une valeur dérivée.
- `localStorage` convient à un panier, jamais à un jeton.
- L'en-tête de `ui` reçoit le badge par **projection** : la bibliothèque reste indépendante de
  l'application.

---

➡️ [04 — La session](04-SESSION.md)
