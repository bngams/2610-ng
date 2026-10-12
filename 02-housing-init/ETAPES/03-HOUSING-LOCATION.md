# 03 — Le composant HousingLocation

> Chaque logement sera affiché par une carte : le composant `HousingLocation`. Vous le créez et vous
> l'affichez dans `Home`, sous le champ de recherche. L'arbre devient `App` > `Home` > `HousingLocation`.

## ✨ Ce que vous apprenez

- Un composant dans un composant dans un composant : le même geste qu'à l'étape 2, un niveau plus bas.
- Comment la CLI transforme un nom (`housingLocation` => dossier `housing-location`, classe `HousingLocation`, balise `app-housing-location`).

> 📖 Étape officielle : [03-HousingLocation](https://angular.dev/tutorials/first-app/03-HousingLocation) ·
> [Synthèse, section 3 : l'arbre de composants](../../00-intro-syntax-recap/index.html#s3)

## 🧱 1 — Générer le composant

Dans le second terminal, à la racine du projet :

```bash
ng generate component housingLocation --dry-run
ng generate component housingLocation
```

```
CREATE src/app/housing-location/housing-location.css (0 bytes)
CREATE src/app/housing-location/housing-location.ts (248 bytes)
```

Vous avez tapé `housingLocation` ; la CLI a créé le dossier `housing-location` (en minuscules avec
un tiret), la classe `HousingLocation` et le sélecteur `app-housing-location`. Ouvrez
`src/app/housing-location/housing-location.ts` pour le vérifier.

## 🧩 2 — Afficher la carte dans Home

Même geste qu'à l'étape 2, cette fois dans `src/app/home/home.ts`. Vous ajoutez l'import en haut
du fichier, la propriété `imports` (déjà présente, vide) dans le `@Component`, et une seconde `<section>` dans le template.
Le fichier complet doit ressembler à ceci :

```ts
import { Component } from '@angular/core';
import { HousingLocation } from '../housing-location/housing-location';

@Component({
  selector: 'app-home',
  imports: [HousingLocation],
  template: `
    <section>
      <form>
        <input type="text" placeholder="Filter by city" />
        <button class="primary" type="button">Search</button>
      </form>
    </section>
    <section class="results">
      <app-housing-location />
    </section>
  `,
  styleUrl: './home.css',
})
export class Home {}
```

| Morceau | Rôle |
|---|---|
| `'../housing-location/housing-location'` | le chemin est relatif à `home.ts` : on remonte d'un dossier (`..`) puis on descend dans `housing-location/` |
| `imports: [HousingLocation]` | `Home` déclare qu'il utilise ce composant |
| `<section class="results">` | la classe `results` est déjà stylée dans `home.css` (une grille) : les cartes s'y rangeront |

## 🎨 3 — Les styles de la carte

**Remplacez le contenu** (vide) de `src/app/housing-location/housing-location.css` par celui de
[`assets/03/housing-location.css`](../assets/03/housing-location.css) (31 lignes : fond, coins arrondis, photo, pictogramme de
localisation). Ce fichier est pré-rempli dans l'éditeur en ligne ; en local, vous le copiez.

> ℹ️ Dans ce CSS, `content: url('/location-pin.svg')` charge le pictogramme copié dans `public/` à
> l'étape 1 (le tutoriel officiel écrit `/public/location-pin.svg`, même différence qu'avec le logo).

> 💡 **Tester :** sous le champ de recherche, le texte **housing-location works!** apparaît. Il
> n'est pas encore dans une carte violette : la carte n'aura son HTML qu'à l'étape 7, le CSS attend.

## ⚠️ Pièges

> ⚠️ **`Cannot find module '../housing-location/housing-location'`.**
> Symptôme : erreur dans le terminal de `ng serve` dès l'enregistrement de `home.ts`.
> Cause : le chemin d'import est faux ; `home.ts` est dans `src/app/home/`, il faut remonter d'un cran.
> Correctif : `from '../housing-location/housing-location'` (deux points, pas un).

> ⚠️ **`'app-housing-location' is not a known element`.**
> Symptôme : même erreur `NG8001` qu'à l'étape 2.
> Cause : la balise est là, pas la ligne `imports: [HousingLocation]`.
> Correctif : ajoutez-la dans le `@Component` de `Home`.

## Récap

- `App` affiche `Home`, `Home` affiche `HousingLocation` : chaque parent importe son enfant.
- La CLI normalise les noms : `housingLocation` => `housing-location/`, `HousingLocation`, `app-housing-location`.

➡️ [04 — L'interface](04-INTERFACES.md)
