# 🧮 S6 — Filtres : dérivation synchrone, sans requête

**Contexte.** La liste est chargée une fois. Trois critères, ville (texte, insensible à la
casse), prix max (nombre), tri (nom ou prix), se combinent **sans nouvel appel HTTP**. Il n'y a
pas d'asynchrone dans la combinaison elle-même : c'est le scénario qui montre où les signals sont
chez eux.

| Besoin | RxJS | Signals |
|---|---|---|
| Combiner trois sources qui changent indépendamment | `combineLatest([...])` + `map` ; attention, chaque source doit avoir émis une fois (`startWith`) | un `computed` qui lit trois signals |
| Le chargement initial | un flux de plus dans le `combineLatest` | `toSignal(http)` ou `httpResource`, une fois |

**Même geste qu'en S1** (pas d'`id` ici) :

| Quoi | Nom |
|---|---|
| Dossier | `src/app/scenarios/s6-filters/` |
| Page | `s6-page.ts`, `S6Page`, `app-s6-page`, `<h1>S6 — Filtres : dérivation synchrone, sans requête</h1>` |
| Volets | `s6-rxjs.ts` (`S6Rxjs`, `app-s6-rxjs`) et `s6-signals.ts` (`S6Signals`, `app-s6-signals`) |
| Route | `{ path: 's6', component: S6Page, title: 'S6 — Filtres : dérivation synchrone, sans requête' }` |
| Lien | `<a routerLink="/s6" routerLinkActive="active">S6 Filtres</a>` |

La logique de filtre et de tri est la même des deux côtés : seule la plomberie réactive change.
Créez d'abord `src/app/scenarios/s6-filters/filters.ts`, la fonction pure partagée :

```ts
import { HousingLocationInfo } from '../../housinglocation';

export type SortKey = 'name' | 'price';

export function applyFilters(
  list: HousingLocationInfo[],
  city: string,
  maxPrice: number,
  sort: SortKey,
): HousingLocationInfo[] {
  const q = city.trim().toLowerCase();
  return list
    .filter((l) => (!q || l.city.toLowerCase().includes(q)) && l.price <= maxPrice)
    .sort((a, b) => (sort === 'price' ? a.price - b.price : a.name.localeCompare(b.name)));
}
```

(`filter` renvoie un **nouveau** tableau, donc le `sort` en place qui suit ne mute pas la liste
reçue : voir le piège 2 en fin de lab.)

## Côté RxJS (donné)

Créez `src/app/scenarios/s6-filters/s6-rxjs.ts` :

```ts
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
import { HousingLocationInfo } from '../../housinglocation';
import { HousingService } from '../../housing.service';
import { SortKey, applyFilters } from './filters';

@Component({
  selector: 'app-s6-rxjs',
  imports: [ReactiveFormsModule],
  template: `
    <input type="text" [formControl]="city" placeholder="Ville" />
    <input type="number" [formControl]="maxPrice" step="100" />
    <select [formControl]="sort">
      <option value="name">Tri : nom</option>
      <option value="price">Tri : prix</option>
    </select>
    <ul>
      @for (l of filtered(); track l.id) {
        <li>{{ l.name }} — {{ l.city }} — {{ l.price }} $</li>
      } @empty {
        <li class="status">Aucun résultat.</li>
      }
    </ul>
  `,
})
export class S6Rxjs {
  private readonly housingService = inject(HousingService);

  readonly city = new FormControl('', { nonNullable: true });
  readonly maxPrice = new FormControl(2000, { nonNullable: true });
  readonly sort = new FormControl<SortKey>('name', { nonNullable: true });

  readonly filtered = toSignal(
    combineLatest([
      this.housingService.getAllHousingLocations(),
      this.city.valueChanges.pipe(startWith(this.city.value)),
      this.maxPrice.valueChanges.pipe(startWith(this.maxPrice.value)),
      this.sort.valueChanges.pipe(startWith(this.sort.value)),
    ]).pipe(map(([list, city, maxPrice, sort]) => applyFilters(list, city, maxPrice, sort))),
    { initialValue: [] as HousingLocationInfo[] },
  );
}
```

| Morceau | Pourquoi il est là |
|---|---|
| `combineLatest([liste, ville, prix, tri])` | réémet la combinaison dès qu'**une** source change ; mais seulement une fois que **chaque** source a émis au moins une fois |
| `startWith(control.value)` sur chaque `valueChanges` | d'où les trois `startWith` : sans eux, rien ne sort tant que l'utilisateur n'a pas touché aux trois champs |
| `getAllHousingLocations()` dans le `combineLatest` | la seule source asynchrone ; elle émet une fois, la combinaison attend cette émission |
| `map(... => applyFilters(...))` | la dérivation ; tout ce qui est synchrone ici n'a pas besoin d'un flux, comparez avec l'autre volet |

## Côté signals (à vous)

Créez `src/app/scenarios/s6-filters/s6-signals.ts`. Contraintes : la liste par
`toSignal(this.housingService.getAllHousingLocations(), { initialValue: [] })` (une fois, c'est le
seul pont) ; trois signals `city`, `maxPrice`, `sort` ; un `computed` `filtered` qui appelle
`applyFilters`. Liez les champs comme vous voulez : `(input)="city.set(c.value)"` avec une
variable de template `#c`, `(input)="maxPrice.set(p.valueAsNumber || 0)"`, `(change)` sur le
`select`. Pas de code à trou ici : le volet entier tient en cinq lignes de logique (une ligne de
pont, trois signals, un `computed`), et c'est ce qu'il faut constater. Comptez-les.

> 📖 [combineLatest](https://rxjs.dev/api/index/function/combineLatest) ·
> [startWith](https://rxjs.dev/api/operators/startWith) ·
> [computed](https://angular.dev/guide/signals)

## Critère de réussite

Les deux volets réagissent pareil : tapez « oak », prix max 1400, tri par prix : deux résultats,
dans l'ordre 890 puis 1390. L'onglet Réseau ne montre **aucune** requête pendant la saisie (une
seule ligne `GET /api/locations` par volet, à sa création). Le volet signals tient en cinq lignes
de logique.

> 💡 **Tester :** après la saisie, les deux volets affichent :
>
> ```
> Seriously Safe Towns — Oakland — 890 $
> Hopeful Housing Solutions — Oakland — 1390 $
> ```

<details>
<summary>Ce qu'on retient</summary>

- La **dérivation synchrone** est le terrain naturel des signals : trois signals, un `computed`,
  pas de `startWith`, pas de `combineLatest`, pas de `subscribe`.
- En RxJS, le piège est l'**émission initiale** : `combineLatest` attend que chaque source ait
  émis ; un `startWith` oublié et la liste reste vide sans erreur.
- Le seul pont est à l'entrée (`toSignal(http)` une fois) : dès que la donnée est en mémoire,
  plus de RxJS.
</details>

---

🎉 Les six expériences sont faites : finissez la [grille de décision](../GRILLE.md) pour le [débrief final](../README.md).
S'il vous reste du temps : ➡️ [07 — Bonus : trois pièges RxJS](07-BONUS.md)
