# 10 — Les routes : deux pages dans une seule page

> Jusqu'ici l'app n'a qu'un écran. Vous ajoutez une page de détail (`Details`) et vous activez le
> routeur : selon l'URL (`/` ou `/details/3`), Angular affiche `Home` ou `Details` **sans recharger
> la page**. C'est le principe d'une application monopage (SPA).

> **Notion nouvelle, guidage complet.** Les trois morceaux : la liste des routes, l'emplacement où
> le routeur affiche la page (`<router-outlet>`), et un lien qui ne recharge pas (`routerLink`).

## ✨ Ce que vous apprenez

- Une route = un chemin d'URL + un composant ; `details/:id` contient un paramètre.
- `<router-outlet />` dans `App` : « affiche ici le composant de la route courante ».
- `routerLink` à la place de `href`.

> 📖 Étape officielle : [10-routing](https://angular.dev/tutorials/first-app/10-routing) ·
> [Le routing](https://angular.dev/guide/routing) · [Synthèse, section 9](../../00-intro-syntax-recap/index.html#s9)

## 🧱 1 — Générer le composant Details

Dans le second terminal, à la racine du projet :

```bash
ng generate component details
```

```
CREATE src/app/details/details.css (0 bytes)
CREATE src/app/details/details.ts (213 bytes)
```

Son template contient « details works! » : vous le verrez à l'écran une fois la route créée (section 3),
et vous le remplirez à l'étape 11.

## 🗺️ 2 — Où est le routeur dans un projet CLI ?

Le tutoriel officiel crée un fichier `routes.ts` et ajoute `provideRouter(…)` dans `main.ts`. Dans
votre projet, **`ng new` l'a déjà fait**, sous deux autres noms. Ouvrez-les pour le voir, sans les
modifier :

| Fichier | Ce qu'il contient déjà |
|---|---|
| `src/app/app.config.ts` | `provideRouter(routes)` : active le routeur avec la liste `routes` |
| `src/app/app.routes.ts` | `export const routes: Routes = [];` : la liste, vide |
| `src/main.ts` | `bootstrapApplication(App, appConfig)` : démarre l'app avec cette configuration |

Vous n'avez donc qu'un fichier à remplir : `app.routes.ts`. **Remplacez tout son contenu** par :

```ts
import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Details } from './details/details';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'Home page',
  },
  {
    path: 'details/:id',
    component: Details,
    title: 'Home details',
  },
];
```

| Morceau | Rôle |
|---|---|
| `path: ''` | l'URL racine `http://localhost:4200/` affiche `Home` |
| `path: 'details/:id'` | `/details/3`, `/details/7`… : `:id` est un **paramètre**, sa valeur sera lue à l'étape 11 |
| `title` | le titre de l'onglet du navigateur pour cette route |

## 🧩 3 — Brancher le routeur dans App

`App` affichait `<app-home />` en dur. Il affiche maintenant le composant choisi par le routeur, et
le logo devient un lien vers l'accueil. **Remplacez tout le contenu** de `src/app/app.ts` par :

```ts
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

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
      <section class="content">
        <router-outlet />
      </section>
    </main>
  `,
  styleUrl: './app.css',
})
export class App {
  title = 'homes';
}
```

| Morceau | Rôle |
|---|---|
| `<router-outlet />` | l'emplacement où le routeur insère `Home` ou `Details` ; `RouterOutlet` doit être dans `imports` |
| `[routerLink]="['/']"` | un lien géré par Angular : pas de rechargement ; `RouterLink` dans `imports` |
| plus de `Home` dans `imports` | `App` n'écrit plus `<app-home />` : c'est la route qui l'affiche. Le tutoriel officiel le laisse, ce qui produit un avertissement `NG8113: Home is not used` |

> 💡 **Tester :** la liste est toujours là sur http://localhost:4200/. Tapez
> http://localhost:4200/details/1 dans la barre d'adresse : la page affiche **details works!**
> sous le logo, et l'onglet s'appelle « Home details ». Cliquez sur le logo : retour à la liste.

## ⚠️ Pièges

> ⚠️ **Page vide sous l'en-tête, avertissement `NG8113: RouterOutlet is not used within the template of App`.**
> Symptôme : plus de liste, un avertissement jaune dans le terminal.
> Cause : `<router-outlet />` manque dans le template.
> Correctif : ajoutez-le dans `<section class="content">`.

> ⚠️ **`Can't bind to 'routerLink' since it isn't a known property of 'a'`** (`NG8002`).
> Symptôme : erreur rouge.
> Cause : `RouterLink` n'est pas dans `imports`.
> Correctif : `imports: [RouterLink, RouterOutlet]`.

## Récap

- `app.routes.ts` : `{ path, component, title }` ; `app.config.ts` : `provideRouter(routes)` (déjà fait).
- `App` = en-tête + `<router-outlet />` ; les pages sont `Home` et `Details`.

➡️ [11 — La page de détail](11-DETAILS-PAGE.md)
