# 09 — Le service : sortir les données de Home

> Les 10 logements vivent dans `Home`. Demain, la page de détail en aura besoin aussi : on les
> déplace dans un **service**, `HousingService`, que n'importe quel composant pourra demander avec
> `inject()`. C'est le geste de l'étape I3 du lab Intro (le service injecté) ; à l'étape 14, ce service ira chercher les données
> sur une API, et `Home` n'y verra rien.

> **Retour à un guidage complet** pour cette étape : les services sont une notion de ce matin, mais
> le déplacement de code entre deux fichiers mérite d'être écrit pas à pas.

## ✨ Ce que vous apprenez

- `ng generate service`, `@Injectable({ providedIn: 'root' })`, `inject()` : une seule instance partagée par toute l'app.
- Pourquoi : un composant affiche, un service fournit. Chacun son rôle.

> 📖 Étape officielle : [09-services](https://angular.dev/tutorials/first-app/09-services) ·
> [Créer un service injectable](https://angular.dev/guide/di/creating-and-using-services) ·
> [Synthèse, section 7](../../00-intro-syntax-recap/index.html#s7)

## 🧱 1 — Générer le service

Dans le second terminal, à la racine du projet :

```bash
ng generate service housing --type=service
```

```
CREATE src/app/housing.service.ts (85 bytes)
```

Pourquoi `--type=service` ? Depuis le guide de style 2025, la CLI ne met plus le suffixe : sans
l'option, elle créerait `housing.ts` avec une classe `Housing`. Le tutoriel officiel (et le lab
Avancé) utilisent `housing.service.ts` / `HousingService` : l'option rétablit ce nom.

Ouvrez le fichier : la CLI 22.2 a écrit `@Service()`. C'est un raccourci apparu en 22.2, équivalent
à `@Injectable({ providedIn: 'root' })` que vous avez vu ce matin (et qui existe dans toutes les
versions). **Remplacez tout le contenu** par la forme de la synthèse :

```ts
import { Injectable } from '@angular/core';
import { HousingLocationInfo } from './housinglocation';

@Injectable({ providedIn: 'root' })
export class HousingService {}
```

## ✂️ 2 — Déplacer les données dans le service

Ouvrez `src/app/home/home.ts` et **coupez** (Ctrl+X) les deux propriétés `readonly baseUrl = …` et
`housingLocationList: HousingLocationInfo[] = [ … ]` (tout le corps de la classe, de `readonly` jusqu'au `];`).
**Collez-les** dans la classe `HousingService`, **ajoutez le mot-clé `protected`** devant
`housingLocationList`, puis ajoutez les deux méthodes qui donneront accès
aux données. Le service doit ressembler à ceci :

```ts
@Injectable({ providedIn: 'root' })
export class HousingService {
  readonly baseUrl = 'https://angular.dev/assets/images/tutorials/common';

  protected housingLocationList: HousingLocationInfo[] = [
    // … les 10 logements collés depuis Home
  ];

  getAllHousingLocations(): HousingLocationInfo[] {
    return this.housingLocationList;
  }

  getHousingLocationById(id: number): HousingLocationInfo | undefined {
    return this.housingLocationList.find((housingLocation) => housingLocation.id === id);
  }
}
```

| Morceau | Rôle |
|---|---|
| `protected housingLocationList` | le tableau n'est plus accessible directement de l'extérieur : on passe par les méthodes |
| `getAllHousingLocations()` | renvoie la liste complète ; c'est ce que `Home` va appeler |
| `getHousingLocationById(id)` | renvoie **un** logement, ou `undefined` s'il n'existe pas ; `find()` s'arrête au premier `id` égal (étape 11) |

## 🔌 3 — Injecter le service dans Home

Dans `src/app/home/home.ts`, la classe `Home` est maintenant vide. Complétez les imports en haut du
fichier, puis la classe :

```ts
import { Component, inject } from '@angular/core';
import { HousingLocation } from '../housing-location/housing-location';
import { HousingLocationInfo } from '../housinglocation';
import { HousingService } from '../housing.service';
```

```ts
export class Home {
  housingLocationList: HousingLocationInfo[] = [];
  housingService: HousingService = inject(HousingService);

  constructor() {
    this.housingLocationList = this.housingService.getAllHousingLocations();
  }
}
```

| Morceau | Rôle |
|---|---|
| `housingLocationList = []` | la propriété reste, vide : le template `@for` ne change pas |
| `inject(HousingService)` | demande l'instance du service à Angular ; `providedIn: 'root'` garantit qu'il y en a une seule |
| `constructor()` | la première fonction exécutée à la création du composant : on y remplit la liste |

> 💡 **Tester :** la même grille de 10 cartes qu'à l'étape 8. Rien n'a changé à l'écran, tout a
> changé dans l'organisation : `Home` ne sait plus d'où viennent les données.

## ⚠️ Pièges

> ⚠️ **`NG0201: No provider found for HousingService`** (dans la console du navigateur, F12).
> Symptôme : page vide sous l'en-tête, erreur rouge dans la console.
> Cause : le décorateur `@Injectable({ providedIn: 'root' })` manque au-dessus de la classe.
> Correctif : remettez-le, avec son import.

> ⚠️ **`Cannot find name 'baseUrl'`** dans le service.
> Symptôme : erreur sur chaque ligne `photo:`.
> Cause : `readonly baseUrl` est resté dans `Home`.
> Correctif : déplacez-le aussi dans `HousingService`, avant le tableau.

## Récap

- Service : `@Injectable({ providedIn: 'root' })` + des méthodes ; composant : `inject(MonService)`.
- `--type=service` redonne à la CLI 2025 le nom `housing.service.ts`.

➡️ [10 — Les routes](10-ROUTING.md)
