# 02 — Le composant Home

> Votre app n'a qu'un composant, `App`. Vous en créez un second, `Home`, vous l'affichez dans la
> mise en page de `App` (un en-tête avec le logo, puis le contenu), et vous lui donnez son champ de
> recherche et son bouton, sans comportement pour l'instant.

## ✨ Ce que vous apprenez

- `ng generate component` crée les fichiers d'un composant ; `--dry-run` montre ce qu'il va faire sans le faire.
- Utiliser un composant dans un autre : l'importer, l'ajouter à `imports`, écrire sa balise.

> 📖 Étape officielle : [02-Home](https://angular.dev/tutorials/first-app/02-Home) ·
> [ng generate component](https://angular.dev/cli/generate/component) · [Synthèse, sections 1 et 2](../../00-intro-syntax-recap/index.html#s1)

## 🧱 1 — Générer le composant

Dans le second terminal, à la racine du projet (`homes/`), simulez d'abord la commande :

```bash
ng generate component home --dry-run
```

```
CREATE src/app/home/home.css (0 bytes)
CREATE src/app/home/home.ts (201 bytes)

NOTE: The "--dry-run" option means no changes were made.
```

Prenez l'habitude de ce `--dry-run` : il montre les fichiers que la CLI va créer, et surtout **où**.
Quand ça vous convient, relancez sans l'option :

```bash
ng generate component home
```

Ouvrez `src/app/home/home.ts` : c'est le fichier généré, un composant minimal (sélecteur
`app-home`, un template `<p>home works!</p>`, un `styleUrl` vers `home.css`, une classe `Home` vide).

> 💡 **Tester :** le navigateur affiche toujours **Hello world!** C'est normal : le composant existe,
> mais personne ne l'utilise encore.

## 🧩 2 — Afficher Home dans la mise en page de App

Un composant s'utilise en trois gestes dans le composant parent : l'**importer** (ligne `import`),
le déclarer dans **`imports`** du `@Component`, puis écrire sa **balise** dans le template.
**Remplacez tout le contenu** de `src/app/app.ts` par :

```ts
import { Component } from '@angular/core';
import { Home } from './home/home';

@Component({
  selector: 'app-root',
  imports: [Home],
  template: `
    <main>
      <header class="brand-name">
        <img class="brand-logo" src="/logo.svg" alt="logo" aria-hidden="true" />
      </header>
      <section class="content">
        <app-home />
      </section>
    </main>
  `,
  styleUrl: './app.css',
})
export class App {
  title = 'homes';
}
```

> ℹ️ Le tutoriel officiel écrit `src="/public/logo.svg"` : c'est le chemin de son éditeur en ligne.
> Dans un projet CLI, `public/` est servi à la racine, donc `/logo.svg`.

Puis les styles de l'en-tête : **remplacez le contenu** (vide) de `src/app/app.css` par celui de
`assets/02/app.css`, c'est-à-dire :

```css
:host {
  --content-padding: 10px;
}
header {
  display: block;
  height: 60px;
  padding: var(--content-padding);
  box-shadow: 0px 5px 25px var(--shadow-color);
}
.content {
  padding: var(--content-padding);
}
```

> 💡 **Tester :** le logo *Homes* en haut, une ombre sous l'en-tête, et le texte **home works!** en
> dessous : `Home` est bien affiché à l'intérieur de `App`.

## 🔍 3 — Le champ de recherche

Dans `src/app/home/home.ts`, remplacez le `template` par le formulaire de recherche (il ne fait
rien pour l'instant : la recherche est l'étape 13) :

```ts
  template: `
    <section>
      <form>
        <input type="text" placeholder="Filter by city" />
        <button class="primary" type="button">Search</button>
      </form>
    </section>
  `,
```

Puis **remplacez le contenu** (vide) de `src/app/home/home.css` par celui de `assets/02/home.css`
(40 lignes : la grille des résultats, le champ et le bouton). Ce fichier est pré-rempli dans
l'éditeur en ligne du tutoriel ; en local, vous le copiez.

> 💡 **Tester :** sous le logo, un champ « Filter by city » bordé de violet et un bouton **Search**
> violet. Si le bouton est gris, `styles.css` de l'étape 1 n'est pas en place (`button.primary`).

## ⚠️ Pièges

> ⚠️ **`NG8001: 'app-home' is not a known element`.**
> Symptôme : erreur rouge dans le terminal de `ng serve`, page blanche.
> Cause : la balise est dans le template, mais `Home` n'est pas dans `imports: [...]` du `@Component`.
> Correctif : ajoutez `Home` à `imports`, et vérifiez la ligne `import { Home } from './home/home';`.

> ⚠️ **Le logo ne s'affiche pas (icône cassée).**
> Symptôme : un carré vide à la place du logo ; dans l'onglet Réseau (F12), `logo.svg` en 404.
> Cause : `logo.svg` n'est pas dans `public/` (étape 1), ou le chemin est `/public/logo.svg`.
> Correctif : copiez `assets/01/logo.svg` dans `public/` et écrivez `src="/logo.svg"`.

## Récap

- `ng generate component nom` => `src/app/nom/nom.ts` + `nom.css`, classe `Nom`, sélecteur `app-nom`.
- Parent : `import`, `imports: [Enfant]`, `<app-enfant />`.

➡️ [03 — Le composant HousingLocation](03-HOUSING-LOCATION.md)
