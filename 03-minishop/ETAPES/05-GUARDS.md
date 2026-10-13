# 🚧 05 — Les guards côté FO

> **Scénario guidé, environ 20 minutes.** La commande ne doit être accessible qu'aux utilisateurs
> connectés. Vous écrivez un **guard** dans `@shop/auth`, vous le posez sur la route de la
> commande, puis vous affichez un lien de menu selon la **même règle**. Moins de code à trous que
> dans les étapes précédentes : un seul fichier à compléter, le reste se déduit de ce que vous avez
> déjà écrit. La solution est dans `solution/libs/auth/src/lib/guards/`.

## ✨ Objectifs

- Écrire un guard fonctionnel, `CanActivateFn`, qui renvoie `true` ou une redirection (`UrlTree`).
- Garder l'adresse demandée dans `returnUrl`, pour y revenir après la connexion.
- Partager une **règle** (`isLoggedIn()`) entre un guard et l'affichage du menu, sans appeler le
  guard depuis le menu.

## 📁 Point de départ

Vous partez du FO de l'étape 04 : la connexion fonctionne, mais `/cart/checkout` reste ouvert à
tous. Cette étape ajoute un fichier à `@shop/auth`, complète sa façade, et modifie trois fichiers du FO :

```
libs/auth/src/lib/guards/auth.guard.ts                 authGuard (section 2)
libs/auth/src/public-api.ts                            + l'export du guard (section 2)
apps/fo/src/app/features/cart/cart.routes.ts           le guard sur la commande (section 3)
apps/fo/src/app/features/cart/pages/checkout/checkout.ts   le nom de l'utilisateur dans la confirmation (section 3)
apps/fo/src/app/app.ts                                 le lien « Commande », visible si l'on est connecté (section 4)
```

---

## 🤔 1 — Ce qu'est un guard, et ce qu'il n'est pas

Un guard est une fonction que le routeur appelle **avant** une navigation. Elle répond « on
continue », « on reste », ou « on va ailleurs ». C'est de l'**ergonomie** : un guard évite
d'afficher une page qui ne servirait à rien. Ce n'est pas de la sécurité, puisque tout ce qui
s'exécute dans le navigateur peut être contourné ; à l'étape 06, vous verrez le serveur refuser
lui-même une écriture.

Angular propose trois guards fonctionnels, chacun pour une question :

| Type | Posé dans la route sous | Question posée |
|---|---|---|
| `CanActivateFn` | `canActivate` | peut-on **afficher** cette route ? (cette étape) |
| `CanMatchFn` | `canMatch` | cette route doit-elle même être **retenue** ? Si non, son code chargé à la demande n'est pas téléchargé (étape 06) |
| `CanDeactivateFn<T>` | `canDeactivate` | peut-on **quitter** le composant `T` ? (une saisie non enregistrée, par exemple) |

Un guard peut renvoyer trois sortes de réponses, directement, en promesse ou en Observable :

| Réponse | Effet | Quand l'utiliser |
|---|---|---|
| `true` / `false` | on continue / on reste sur la page actuelle | `false` laisse l'utilisateur sans explication : on lui préfère presque toujours une redirection |
| `UrlTree` (par `router.createUrlTree(…)`) | redirection vers cette adresse | le cas courant, celui de cette étape |
| `RedirectCommand` (`new RedirectCommand(urlTree, options)`) | redirection, **avec** des options de navigation | quand la redirection a besoin d'options, par exemple `skipLocationChange` pour ne pas changer l'URL affichée |

> 🏢 **En entreprise.** Dans le code v20, vous croiserez des guards écrits comme des **classes**
> (`implements CanActivate`), désignées par leur nom dans la route. Passer une classe à
> `canActivate` est déprécié depuis la v15.2 : on écrit aujourd'hui une fonction, avec `inject()`.

> 📖 [Guide : les guards de route](https://angular.dev/guide/routing/route-guards) ·
> [`RedirectCommand`](https://angular.dev/api/router/RedirectCommand)

---

## 🔒 2 — Écrire `authGuard`

Le guard sert au FO comme au BO : il vit dans `@shop/auth`, dans la famille `guards/`. Générez-le
avec le même séparateur que l'intercepteur, pour obtenir `auth.guard.ts` :

```bash
npx ng generate guard guards/auth --type-separator=. --project @shop/auth --skip-tests
```

La CLI génère un `CanActivateFn` qui laisse toujours passer :

```ts
import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  return true;
};
```

Le second paramètre, `state`, décrit la navigation en cours ; `state.url` est l'adresse demandée,
celle qu'on veut retrouver après la connexion. Remplacez le contenu de
`libs/auth/src/lib/guards/auth.guard.ts` et complétez le `TODO` :

🚧 **À compléter :**

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../services/session.store';

/** Connecté : on continue. Sinon : page de connexion, en gardant l'URL demandée dans returnUrl. */
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionStore);
  const router = inject(Router);
  // TODO : true si la session est ouverte (isLoggedIn), sinon un UrlTree vers ['/login'],
  //        avec queryParams: { returnUrl: state.url }
};
```

L'indice tient en une ligne : `return session.isLoggedIn() ? true : router.createUrlTree(…);`. Le
préfixe `_` de `_route` signale un paramètre volontairement inutilisé.

Le guard n'est visible des applications qu'une fois exporté. Ajoutez cette ligne à la fin de
`libs/auth/src/public-api.ts` :

```ts
export * from './lib/guards/auth.guard';
```

> ℹ️ **Pourquoi le guard connaît déjà la session après un F5 ?** Grâce à `provideAuth()` de
> l'étape 04 : `provideAppInitializer` attend `/api/auth/me` **avant** la première navigation, donc
> avant que le moindre guard ne s'exécute.

---

## 🧾 3 — Protéger la commande

Le guard se pose dans la route, sous la clé `canActivate`, qui accepte une liste. Dans
`apps/fo/src/app/features/cart/cart.routes.ts`, importez `authGuard` depuis `@shop/auth`, puis
modifiez la route de la commande :

```ts
  { path: 'checkout', component: Checkout, canActivate: [authGuard] },
```

La page de commande peut maintenant compter sur un utilisateur connecté, et le remercier par son
nom. C'est le lien `Checkout ..> SessionStore` du diagramme de classes. Dans
`apps/fo/src/app/features/cart/pages/checkout/checkout.ts`, injectez le store de session (avec
`import { SessionStore } from '@shop/auth';`) :

```ts
  protected readonly cart = inject(CartStore);
  private readonly session = inject(SessionStore);
```

Puis, dans `confirm()`, utilisez le nom de l'utilisateur dans le message :

```ts
  confirm(): void {
    // l'authGuard garantit qu'un utilisateur est connecté sur cette page
    const name = this.session.user()?.username;
    this.confirmation.set(
      `Merci ${name} ! Votre commande de ${this.cart.count()} article(s) est confirmée.`,
    );
    this.cart.clear();
  }
```

---

## 🧭 4 — Un lien de menu, la même règle

Un lien « Commande » dans le menu n'a de sens que pour un utilisateur connecté. La tentation
serait d'appeler `authGuard` depuis le menu pour savoir s'il passe ; c'est une mauvaise idée : un
guard attend une route et une navigation, et peut renvoyer une redirection, pas un simple oui ou
non. Ce qu'on partage, c'est la **règle** sur laquelle le guard s'appuie : `isLoggedIn()`. C'est
précisément à cela que sert le champ `visible` de `MenuItem`, préparé à l'étape 01.

Dans `apps/fo/src/app/app.ts`, injectez le store de session (importez `SessionStore` avec
`SessionButton`, depuis `@shop/auth`, et `inject` depuis `@angular/core`), puis ajoutez le lien.
Le champ `session` doit être déclaré **avant** `menu`, car la fonction `visible` l'utilise :

```ts
export class App {
  private readonly session = inject(SessionStore);

  protected readonly menu: MenuItem[] = [
    { title: 'Accueil', path: '/' },
    { title: 'Catalogue', path: '/catalog' },
    // la MÊME règle que l'authGuard de la route : isLoggedIn()
    { title: 'Commande', path: '/cart/checkout', visible: () => this.session.isLoggedIn() },
  ];
}
```

Rien d'autre à faire : l'en-tête filtre ses liens dans un `computed` (étape 01, section 9.3) qui
appelle `visible()`. Comme `isLoggedIn()` est un signal, le `computed` se recalcule tout seul à la
connexion et à la déconnexion.

---

## 🚀 5 — Vérifier

Compilez le FO pour vérifier les imports :

```bash
npx ng build fo
```

Le build se termine par `Application bundle generation complete.` (avec l'avertissement de budget
déjà vu à l'étape 04). Vérifiez ensuite le parcours, en partant déconnecté, avec trois articles
dans le panier (ajoutez-les depuis le catalogue si besoin).

> 💡 **Tester :**
> 1. Le menu affiche « Accueil » et « Catalogue », pas « Commande ».
> 2. Sur `/cart`, « Passer commande » mène à `/login?returnUrl=%2Fcart%2Fcheckout` : le guard a
>    redirigé.
> 3. Connectez-vous en `alice` : vous arrivez directement sur `/cart/checkout`, qui affiche
>    « 3 article(s), pour un total de … ». Le menu affiche maintenant « Accueil », « Catalogue » et
>    « Commande ».
> 4. F5 sur `/cart/checkout` : la page reste affichée, la session a été rechargée avant le guard.
> 5. « Confirmer la commande » affiche « Merci alice ! Votre commande de 3 article(s) est
>    confirmée. », et le panier est vide.
> 6. « Se déconnecter » : le lien « Commande » disparaît du menu.

---

## 🎉 Challenge final

- [ ] `/cart/checkout` redirige un visiteur anonyme vers la connexion, puis le ramène à la
      commande.
- [ ] Le guard et le menu s'appuient sur la même règle, `isLoggedIn()` ; le menu n'appelle aucun
      guard.
- [ ] Un F5 sur une page protégée ne déconnecte pas.

## ✅ Bonus

- Écrivez une variante de `authGuard` qui renvoie une `RedirectCommand` avec
  `{ skipLocationChange: true }` : quelle URL voyez-vous dans la barre d'adresse pendant la
  connexion, et que devient le retour après ?
- Que se passe-t-il si vous ouvrez `/cart/checkout` connecté, avec un panier vide ? Le guard
  devrait-il aussi vérifier le panier ? (Indice : ce serait une seconde règle, propre au FO, donc
  un guard du FO, pas de `@shop/auth`.)

## 🧠 Récap

- Un guard fonctionnel est une fonction avec `inject()` ; il renvoie `true`, un `UrlTree`, ou une
  `RedirectCommand` quand il faut des options de navigation.
- `returnUrl` garde la page demandée ; la page de connexion y revient.
- Le menu partage la **règle** (`isLoggedIn()`), pas le guard.
- Un guard améliore l'ergonomie ; la sécurité, c'est le serveur (étape 06).

---

➡️ [06 — Le BO minimal](06-BO.md)
