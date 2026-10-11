# I2 — La carte : un composant enfant avec `input()` et `output()`

> La carte d'une formation va devenir un composant à part, `FormationCard`. La liste lui **donne**
> la formation à afficher (`input()`), la carte **prévient** la liste quand on clique sur
> « S'inscrire » (`output()`).

## ✨ Objectif

Découper la liste en un composant parent (`FormationList`) et un composant enfant
(`FormationCard`), et les faire communiquer dans les deux sens.

## 🧱 1 — Créer la carte

Créez **`src/app/formations/formation-card.ts`** :

```ts
import { Component, input, output } from '@angular/core';
import { Formation } from '../models/formation';

@Component({
  selector: 'app-formation-card',
  template: `
    <article class="card">
      <h3>{{ formation().titre }}</h3>
      <p class="meta">{{ formation().ville }} · {{ formation().prixHT }} € HT</p>
      @if (formation().places > 0) {
        <span class="badge">{{ formation().places }} places</span>
      } @else {
        <span class="badge complet">complet</span>
      }
      <p>
        <button class="primary" (click)="onInscrire()" [disabled]="formation().places === 0">
          S'inscrire
        </button>
      </p>
    </article>
  `,
})
export class FormationCard {
  formation = input.required<Formation>();   // ⬇ reçue du parent
  inscrire = /* TODO : un output qui transporte un number (l'id de la formation) */;

  onInscrire() {
    // TODO : émettre l'id de la formation
  }
}
```

| Morceau | Rôle |
|---|---|
| `input.required<Formation>()` | la carte **exige** une formation ; on la lit avec `formation()` (c'est un signal) |
| `output<number>()` | un événement que le parent peut écouter ; on l'émet avec `.emit(valeur)` |
| `(click)="onInscrire()"` | liaison d'événement : au clic, appelle la méthode |
| `[disabled]="…"` | liaison de propriété : désactive le bouton si la condition est vraie |
| `@if … @else` | affiche l'un ou l'autre bloc |

> 📖 [Inputs](https://angular.dev/guide/components/inputs) · [Outputs](https://angular.dev/guide/components/outputs) ·
> [Synthèse, section 5](../../00-intro-syntax-recap/index.html#s5)

## 🧩 2 — Utiliser la carte dans la liste

Dans **`src/app/formations/formation-list.ts`** : importez `FormationCard`, ajoutez-le à
`imports`, et remplacez l'`<article>` écrit en I1 par la balise de la carte. Puis écrivez la
méthode qui recevra l'id :

```ts
import { Component } from '@angular/core';
import { FORMATIONS } from '../data/formations.data';
// TODO : importer FormationCard

@Component({
  selector: 'app-formation-list',
  imports: [/* TODO */],
  template: `
    <h2>Formations</h2>
    <div class="cards">
      @for (f of formations; track f.id) {
        <app-formation-card [formation]="f" (inscrire)="onInscrire($event)" />
      } @empty {
        <p class="muted">Aucune formation.</p>
      }
    </div>
  `,
})
export class FormationList {
  formations = FORMATIONS;

  onInscrire(id: number) {
    // TODO : pour l'instant, un console.log('inscription demandée', id) suffit
  }
}
```

| Dans le parent | Sens | Ce que ça fait |
|---|---|---|
| `[formation]="f"` | ⬇ | donne la formation `f` à l'input `formation` de la carte |
| `(inscrire)="onInscrire($event)"` | ⬆ | écoute l'output `inscrire` ; `$event` contient ce qui a été émis (l'id) |

## 💡 Tester

Le rendu est identique à I1, avec un bouton « S'inscrire » sur chaque carte (grisé sur la
formation complète, « Tests unitaires Angular »). Ouvrez la console du navigateur (F12) :
chaque clic affiche `inscription demandée 1`, `inscription demandée 2`…

> ⚠️ **Piège : `formation.titre` au lieu de `formation().titre`.**
> Symptôme : `Property 'titre' does not exist on type 'InputSignal<Formation>'`.
> Cause : un `input()` est un signal, donc une fonction : il se lit avec des parenthèses.
> Correctif : `formation().titre`.

> ⚠️ **Piège : `NG0950: Input is required but no value is available yet`.**
> Symptôme : erreur au chargement.
> Cause : la balise `<app-formation-card />` est écrite sans `[formation]="…"`.
> Correctif : un `input.required` doit toujours être fourni par le parent.

## Récap

- L'enfant déclare `input()` (reçoit) et `output()` (émet) ; le parent branche `[prop]` et `(event)`.
- Un input est un signal : lecture avec `()`.
- `$event` dans le parent = la valeur émise par l'enfant.

➡️ [I3 — Le service](I3-SERVICE.md)
