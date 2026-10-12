# 05 — L'input : la carte reçoit son logement

> Le logement de test est dans `Home`, mais c'est `HousingLocation` qui doit l'afficher. Vous
> déclarez un `input` obligatoire dans la carte, et vous le remplissez depuis `Home`. C'est exactement
> le geste de la carte du lab Intro (`formation = input.required<Formation>()`).

> **Codes à trous.** À partir de cette étape, vous complétez les `// TODO` vous-même : le tableau
> sous chaque bloc explique chaque morceau, et le lien de doc donne la syntaxe exacte. Ne collez pas
> ces blocs tels quels (un `/* TODO */` à la place d'une valeur ne compile pas) : modifiez les lignes
> marquées dans votre fichier.

## ✨ Ce que vous apprenez

- `input.required<T>()` : un composant **exige** une donnée de son parent, typée.
- Un input est un signal : on le lira avec des parenthèses (étape 7).

> 📖 Étape officielle : [05-inputs](https://angular.dev/tutorials/first-app/05-inputs) ·
> [Inputs](https://angular.dev/guide/components/inputs) · [Synthèse, section 5](../../00-intro-syntax-recap/index.html#s5)

## 🧱 1 — Déclarer l'input dans HousingLocation

🚧 **À compléter** dans `src/app/housing-location/housing-location.ts`. Le bloc ci-dessous montre
le fichier avec trois `TODO` à traiter dans le vôtre : l'import de `input`, l'import du type, et la
propriété.

```ts
import { Component /* TODO : importer aussi input */ } from '@angular/core';
// TODO : importer HousingLocationInfo depuis '../housinglocation'

@Component({
  selector: 'app-housing-location',
  imports: [],
  template: ` <p>housing-location works!</p> `,
  styleUrl: './housing-location.css',
})
export class HousingLocation {
  housingLocation = /* TODO : un input obligatoire, de type HousingLocationInfo */;
}
```

| Morceau | Rôle |
|---|---|
| `input` (minuscule) | la fonction de `@angular/core` qui déclare une entrée ; à importer à côté de `Component` |
| `input.required<HousingLocationInfo>()` | l'entrée est **obligatoire** : le parent doit la fournir, sinon le projet ne compile pas ; `<…>` fixe son type |
| `housingLocation` | le nom de la propriété ; c'est aussi le nom à utiliser dans la balise, côté parent |

> 💡 **Tester :** enregistrez. Le terminal de `ng serve` affiche une erreur
> `NG8008: Required input 'housingLocation' from component HousingLocation must be specified` :
> c'est attendu, `Home` ne fournit pas encore l'input. Passez à la suite.

## 🧩 2 — Fournir l'input depuis Home

Dans `src/app/home/home.ts`, la balise `<app-housing-location />` doit maintenant passer le logement
de test. Voici le principe sur un composant imaginaire ; c'est **un exemple, ne le reproduisez pas
tel quel** :

```html
<!-- ceci est un exemple, pas le code attendu -->
<app-mon-composant [monInput]="maPropriete" />
```

🚧 **À compléter** : remplacez la balise par sa version avec l'input, **entre crochets**, qui reçoit
la propriété `housingLocation` de la classe `Home` :

```ts
    <section class="results">
      <!-- TODO : <app-housing-location [ ... ]=" ... " /> -->
    </section>
```

| Morceau | Rôle |
|---|---|
| `[housingLocation]` | les crochets : liaison de propriété, la valeur à droite est une **expression** évaluée dans `Home` (étape 6) |
| `"housingLocation"` | ici, la propriété `housingLocation` de la classe `Home` (le logement de test) |

> 💡 **Tester :** l'erreur `NG8008` disparaît, la page affiche toujours « housing-location works! ».
> La carte **a** son logement ; elle ne l'affiche pas encore (étape 7).

## ⚠️ Pièges

> ⚠️ **`NG8008: Required input 'housingLocation' … must be specified`.**
> Symptôme : l'erreur reste après la partie 2.
> Cause : la balise n'a pas les crochets, ou le nom entre crochets n'est pas celui de la propriété déclarée avec `input.required`.
> Correctif : `[housingLocation]="housingLocation"`, le nom de gauche = le nom dans `HousingLocation`.

> ⚠️ **`Cannot find name 'input'`.**
> Symptôme : erreur dans `housing-location.ts`.
> Cause : `input` n'est pas importé.
> Correctif : `import { Component, input } from '@angular/core';`.

## Récap

- Enfant : `nom = input.required<Type>()`. Parent : `<app-enfant [nom]="valeur" />`.
- `required` : le compilateur vérifie que le parent fournit la valeur.

➡️ [06 — La liaison de propriété](06-PROPERTY-BINDING.md)
