# 04 — L'interface : décrire un logement

> Avant d'afficher des données, on décrit leur forme. Vous créez l'interface `HousingLocationInfo`
> (un logement : id, nom, ville, photo…) et vous créez un premier logement de test dans `Home`. Rien
> ne s'affiche encore : c'est le travail des étapes 5 à 7.

## ✨ Ce que vous apprenez

- `ng generate interface` et le rôle d'une interface TypeScript : un type sur mesure pour vos données.
- Pourquoi typer : l'éditeur et le compilateur signalent une propriété oubliée ou mal orthographiée.

> 📖 Étape officielle : [04-interfaces](https://angular.dev/tutorials/first-app/04-interfaces) ·
> [ng generate interface](https://angular.dev/cli/generate/interface) ·
> [Interfaces TypeScript](https://www.typescriptlang.org/docs/handbook/interfaces.html)

## 🧱 1 — Générer l'interface

Dans le second terminal, à la racine du projet, générez le fichier de l'interface :

```bash
ng generate interface housinglocation
```

La CLI crée un seul fichier, directement dans `src/app/` : une interface n'a pas de dossier à elle.

```
CREATE src/app/housinglocation.ts (37 bytes)
```

Attention aux deux fichiers qui se ressemblent : `src/app/housinglocation.ts` (l'**interface**,
tout attaché, à la racine de `app/`) et `src/app/housing-location/housing-location.ts` (le
**composant**, avec un tiret, dans son dossier). Ce sont les noms du tutoriel officiel.

## ✏️ 2 — Les propriétés du logement

Ouvrez `src/app/housinglocation.ts` : la CLI y a écrit `export interface Housinglocation {}`.
**Remplacez tout le contenu** par :

```ts
export interface HousingLocationInfo {
  id: number;
  name: string;
  city: string;
  state: string;
  photo: string;
  availableUnits: number;
  wifi: boolean;
  laundry: boolean;
}
```

| Morceau | Rôle |
|---|---|
| `export` | rend l'interface importable depuis les autres fichiers |
| `id: number` | chaque propriété a un nom et un type ; un objet `HousingLocationInfo` doit toutes les avoir |
| `photo: string` | l'URL de la photo, pas l'image elle-même |

> 💡 **Tester :** rien ne change à l'écran, et le terminal de `ng serve` ne montre aucune erreur.

## 🏠 3 — Un logement de test dans Home

Vous avez un type, utilisez-le. Dans `src/app/home/home.ts`, commencez par l'import, en haut du
fichier, sous celui de `HousingLocation` :

```ts
import { HousingLocationInfo } from '../housinglocation';
```

Remplacez ensuite la classe vide `export class Home {}`, en bas du fichier, par cette classe qui
contient un logement de test, typé avec l'interface que vous venez d'importer :

```ts
export class Home {
  readonly baseUrl = 'https://angular.dev/assets/images/tutorials/common';

  housingLocation: HousingLocationInfo = {
    id: 9999,
    name: 'Test Home',
    city: 'Test city',
    state: 'ST',
    photo: `${this.baseUrl}/example-house.jpg`,
    availableUnits: 99,
    wifi: true,
    laundry: false,
  };
}
```

| Morceau | Rôle |
|---|---|
| `readonly baseUrl = '…'` | le début de l'URL des photos, pour ne pas le répéter ; `readonly` : on ne le modifie pas |
| `housingLocation: HousingLocationInfo = { … }` | une propriété de la classe, **typée** par l'interface : l'objet doit avoir exactement ces 8 propriétés |
| `` `${this.baseUrl}/example-house.jpg` `` | un *template literal* (accents graves) : la chaîne est assemblée avec la valeur de `baseUrl` |

> 💡 **Tester :** toujours « housing-location works! » et aucune erreur. Pour voir l'intérêt du
> type, supprimez provisoirement la ligne `wifi: true,` et enregistrez : le terminal affiche
> `Property 'wifi' is missing in type …` et VS Code souligne l'objet en rouge. Remettez la ligne.

> 🗣️ **Débrief 1.** Vous avez trois composants et une interface : prenez une minute pour dire qui
> affiche quoi, et qui connaît le type `HousingLocationInfo` (pour l'instant, seul `Home`).

## ⚠️ Pièges

> ⚠️ **`Cannot find module '../housinglocation'`.**
> Symptôme : erreur à l'enregistrement de `home.ts`.
> Cause : l'interface est dans `src/app/`, pas dans un sous-dossier ; ou vous avez tapé `housing-location`.
> Correctif : `from '../housinglocation'` (sans tiret, et sans `.ts` à la fin).

> ⚠️ **`Property 'photo' does not exist on type 'HousingLocationInfo'`.**
> Symptôme : erreur sur l'objet de test.
> Cause : la propriété n'est pas déclarée dans l'interface (faute de frappe dans `housinglocation.ts`).
> Correctif : les 8 noms de l'interface et de l'objet doivent être identiques, à la lettre près.

## Récap

- Une interface décrit la forme d'un objet ; elle n'existe plus à l'exécution, elle sert au compilateur et à l'éditeur.
- `propriete: Type = valeur` dans une classe : une donnée typée, utilisable dans le template.

➡️ [05 — L'input](05-INPUTS.md)
