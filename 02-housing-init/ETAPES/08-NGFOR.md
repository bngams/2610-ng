# 08 — La liste avec @for

> Une carte, c'est bien ; dix, c'est l'application. Vous remplacez le logement de test par un
> tableau de 10 logements, et vous répétez la carte avec `@for`, comme la liste du lab Intro.

## ✨ Ce que vous apprenez

- `@for (item of liste; track …) { … }` : répéter un bloc de template pour chaque élément.
- La variable de boucle porte le même nom que l'ancienne propriété : la balise ne change pas, son sens oui.

> 📖 Étape officielle : [08-ngFor](https://angular.dev/tutorials/first-app/08-ngFor) ·
> [Le bloc @for](https://angular.dev/guide/templates/control-flow#repeat-content-with-the-for-block) ·
> [Synthèse, section 6](../../00-intro-syntax-recap/index.html#s6)

## 🧱 1 — Les 10 logements dans Home

Dans `src/app/home/home.ts`, la classe `Home` contient `baseUrl` et `housingLocation` (le logement
de test). Vous remplacez le logement de test par la propriété `housingLocationList`, un tableau de 10
`HousingLocationInfo`. Les 10 objets sont longs à taper : ils sont dans le fichier
[`assets/08/housingLocationList.ts`](../assets/08/housingLocationList.ts) du lab, **qui contient aussi la ligne `baseUrl`**. Une seule
consigne donc : **remplacez tout le corps de la classe `Home`** (de `readonly baseUrl` jusqu'au
`};` du logement de test, les accolades de la classe restent) par le contenu de ce fichier. La classe
doit ressembler à ceci :

```ts
export class Home {
  readonly baseUrl = 'https://angular.dev/assets/images/tutorials/common';

  housingLocationList: HousingLocationInfo[] = [
    {
      id: 0,
      name: 'Acme Fresh Start Housing',
      city: 'Chicago',
      state: 'IL',
      photo: `${this.baseUrl}/bernard-hermant-CLKGGwIBTaY-unsplash.jpg`,
      availableUnits: 4,
      wifi: true,
      laundry: true,
    },
    // … 9 autres logements, id 1 à 9
  ];
}
```

| Morceau | Rôle |
|---|---|
| `HousingLocationInfo[]` | un **tableau** de logements ; chaque élément doit respecter l'interface |
| `id: 0` … `id: 9` | des identifiants uniques : ils serviront à la page de détail (étape 11) |

> 💡 **Tester :** le terminal affiche une erreur `TS2551: Property 'housingLocation' does not exist on type 'Home'. Did you mean 'housingLocationList'?` :
> normal, le template passe encore `[housingLocation]="housingLocation"`, une propriété qui n'existe plus.

## 🔁 2 — Répéter la carte

🚧 **À compléter** dans le template de `Home` : entourez la balise d'un bloc `@for` qui parcourt
`housingLocationList`.

```ts
    <section class="results">
      @for (/* TODO : variable */ of /* TODO : la liste */; track $index) {
        <app-housing-location [housingLocation]="housingLocation" />
      }
    </section>
```

| Morceau | Rôle |
|---|---|
| `@for (housingLocation of housingLocationList; …)` | pour chaque élément du tableau, une variable `housingLocation` |
| `track $index` | comment Angular reconnaît chaque élément d'un rendu à l'autre ; ici sa position (le tutoriel officiel fait ce choix ; `track housingLocation.id` serait plus robuste) |
| `[housingLocation]="housingLocation"` | **inchangé**, mais le sens a changé : la droite désigne maintenant la variable de boucle, plus l'ancienne propriété de `Home` |

> 💡 **Tester :** une grille de 10 cartes, de « Acme Fresh Start Housing » (Chicago) à « Capital
> Safe Towns » (Portland). Redimensionnez la fenêtre : la grille passe à 2 puis 1 colonne (`home.css`).

> 🗣️ **Débrief 2.** Que se passe-t-il si vous enlevez `track $index` ? (une erreur : `track` est
> obligatoire). Et si vous écrivez `housingLocation.name` dans la carte sans les parenthèses ?

## ⚠️ Pièges

> ⚠️ **`NG5002: @for loop must have a "track" expression`.**
> Symptôme : erreur à l'enregistrement.
> Cause : `track` est obligatoire dans `@for`.
> Correctif : ajoutez `; track $index` avant la parenthèse fermante.

> ⚠️ **`TS2300: Duplicate identifier 'baseUrl'`.**
> Symptôme : erreur à l'enregistrement, juste après le collage.
> Cause : vous avez gardé votre ligne `readonly baseUrl` et collé le fichier, qui la contient aussi.
> Correctif : supprimez l'une des deux lignes `readonly baseUrl = …`.

> ⚠️ **`Cannot find name 'baseUrl'` / photos vides.**
> Symptôme : erreur sur les lignes `photo:`, ou cartes sans image.
> Cause : la ligne `readonly baseUrl = …` a été supprimée avec l'ancien logement.
> Correctif : remettez-la en première ligne de la classe, avant le tableau (les `${this.baseUrl}` en dépendent).

## Récap

- `@for (x of liste; track …) { <balise [input]="x" /> }` : une carte par élément.
- `track` est obligatoire ; `$index` est le choix du tutoriel, un `id` est préférable quand il existe.

➡️ [09 — Le service](09-SERVICES.md)
