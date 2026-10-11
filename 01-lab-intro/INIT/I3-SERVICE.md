# I3 — Le service : sortir la donnée du composant

> Depuis I1, `FormationList` lit `FORMATIONS` directement. On sort cette responsabilité dans un
> **service**, que le composant demande avec `inject()`. Le guidage s'allège : vous avez déjà les
> gestes, il reste un fichier court à écrire.

## ✨ Objectif

Créer `FormationService`, l'injecter dans la liste, et ne plus importer `FORMATIONS` dans un
composant.

## 🧱 1 — Le service

Créez **`src/app/formations/formation.service.ts`** :

```ts
import { Injectable } from '@angular/core';
import { Formation } from '../models/formation';
import { FORMATIONS } from '../data/formations.data';

@Injectable({ providedIn: 'root' })   // une seule instance pour toute l'application
export class FormationService {
  getAll(): Formation[] {
    // TODO : renvoyer les formations
  }
}
```

| Morceau | Rôle |
|---|---|
| `@Injectable({ providedIn: 'root' })` | déclare la classe comme injectable, partagée par toute l'app |
| `getAll()` | la seule méthode pour l'instant ; demain elle appellera une API HTTP, le composant n'y verra rien |

## 🧩 2 — L'injecter dans la liste

Dans `formation-list.ts`, remplacez les imports du haut du fichier par ceux-ci (l'import de
`FORMATIONS` disparaît, `inject` et le service arrivent) :

```ts
import { Component, inject } from '@angular/core';
import { FormationCard } from './formation-card';
import { FormationService } from './formation.service';
```

Le bloc `@Component({ … })` et le template **ne changent pas**. Seule la classe évolue :

```ts
export class FormationList {
  private service = /* TODO : inject(FormationService) */;
  formations = /* TODO : demander la liste au service */;

  onInscrire(id: number) { console.log('inscription demandée', id); }
}
```

> 📖 [Injection de dépendances](https://angular.dev/guide/di) ·
> [Synthèse, section 7](../../00-intro-syntax-recap/index.html#s7)

## 💡 Tester

Même rendu qu'en I2. La différence est dans le code : une recherche globale de `FORMATIONS` dans
votre éditeur (Ctrl/Cmd + Shift + F) ne trouve plus que le service et le fichier de données.

> ⚠️ **Piège : `inject()` appelé au mauvais endroit.**
> Symptôme : `NG0203: inject() must be called from an injection context`.
> Cause : `inject()` a été appelé dans une méthode (par exemple dans `onInscrire`) au lieu d'un
> champ de la classe ou du constructeur.
> Correctif : `private service = inject(FormationService);` comme champ de classe.

## Récap

- Un composant affiche, un service sait.
- `@Injectable({ providedIn: 'root' })` + `inject(MonService)` comme champ de classe.

➡️ [I4 — Le panier](I4-PANIER.md)
