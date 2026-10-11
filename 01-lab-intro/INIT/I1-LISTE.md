# I1 — La liste des formations

> Vous partez de `starter/`. À la fin de cette étape, les 8 formations s'affichent sous forme de
> cartes. Un seul fichier à créer, un fichier à modifier.

## ✨ Objectif

Créer un composant `FormationList` qui affiche la liste avec `@for`, et l'utiliser dans `App`.

## 🧱 1 — Créer le composant

Créez le fichier **`src/app/formations/formation-list.ts`** (le dossier `formations/` n'existe pas
encore, créez-le). Complétez les `TODO` :

```ts
import { Component } from '@angular/core';
import { FORMATIONS } from '../data/formations.data';

@Component({
  selector: 'app-formation-list',
  template: `
    <h2>Formations</h2>
    <div class="cards">
      @for (f of formations; track f.id) {
        <article class="card">
          <h3>{{ f.titre }}</h3>
          <p class="meta"><!-- TODO : la ville, puis " · ", puis le prix HT suivi de " € HT" --></p>
        </article>
      } @empty {
        <p class="muted">Aucune formation.</p>
      }
    </div>
  `,
})
export class FormationList {
  formations = /* TODO : la constante importée en haut du fichier */;
}
```

| Morceau | Rôle |
|---|---|
| `selector: 'app-formation-list'` | le nom de la balise qu'on écrira dans `App` |
| `@for (f of formations; track f.id)` | répète le bloc pour chaque formation ; `track` dit à Angular comment reconnaître chaque élément (obligatoire) |
| `@empty` | ce qui s'affiche si le tableau est vide |
| `{{ f.titre }}` | interpolation : affiche une valeur de la classe |
| `class="card"`, `class="cards"` | des styles déjà écrits dans `src/styles.css` |

> ℹ️ Le composant lit la constante `FORMATIONS` directement. C'est un raccourci pour cette
> première étape : un composant ne devrait pas « savoir » d'où viennent les données. L'étape
> **I3** corrige ça avec un service.

> 📖 [Control flow : `@for`](https://angular.dev/guide/templates/control-flow#repeat-content-with-the-for-block) ·
> [Synthèse, section 1](../../00-intro-syntax-recap/index.html#s1) (le composant) et
> [section 6](../../00-intro-syntax-recap/index.html#s6) (`@for`, `track`, `@empty`)

## 🧩 2 — L'utiliser dans App

Ouvrez **`src/app/app.ts`**. Deux choses à faire, les deux sont indispensables :

```ts
import { Component } from '@angular/core';
// TODO : importer FormationList depuis './formations/formation-list'

@Component({
  selector: 'app-root',
  imports: [/* TODO : FormationList */],
  template: `
    <h1>Catalogue de formations</h1>
    <p class="muted">Lab Intro : à vous de jouer, suivez les étapes du README.</p>
    <!-- TODO : remplacer ce commentaire par la balise <app-formation-list /> -->
  `,
})
export class App {}
```

> 📖 [Synthèse, section 2](../../00-intro-syntax-recap/index.html#s2)

## 💡 Tester

```bash
npm start
```

Dans le navigateur : le titre, puis **8 cartes** (Angular 22 : les fondamentaux, Angular avancé…),
chacune avec sa ville et son prix. Dans le terminal, aucune erreur en rouge.

> ⚠️ **Piège : `'app-formation-list' is not a known element`.**
> Symptôme : la page est vide sous le titre et le terminal affiche cette erreur `NG8001`.
> Cause : la balise est dans le template, mais le composant n'est pas dans le tableau `imports`.
> Correctif : ajoutez `FormationList` dans `imports: []` de `App`.

> ⚠️ **Piège : `@for` refuse de compiler sans `track`.**
> Symptôme : `NG5002: @for loop must have a "track" expression`.
> Correctif : `track f.id`. C'est obligatoire, et c'est une bonne chose : Angular s'en sert pour ne
> redessiner que les cartes qui changent.

## Récap

- Un composant = `@Component({ selector, template })` + une classe.
- `@for (… ; track …)` répète un bloc ; `@empty` gère le cas vide.
- Pour utiliser un composant : `imports: [X]` **et** sa balise.

➡️ [I2 — La carte](I2-CARTE.md)
