# 11 — La page de détail : lire le paramètre de la route

> La route `details/:id` existe ; personne n'y mène encore. Vous ajoutez un lien **Learn More** sur
> chaque carte, puis `Details` lit l'`id` dans l'URL, demande le logement au service et l'affiche.
> Le chemin de la donnée : clic => URL `/details/3` => `ActivatedRoute` => `getHousingLocationById(3)`.

## ✨ Ce que vous apprenez

- `[routerLink]="['/details', id]"` : un lien construit avec une valeur dynamique.
- `ActivatedRoute` : l'objet qui décrit la route courante, dont ses paramètres.
- `?.` (optional chaining) : lire une propriété d'un objet qui peut être `undefined`.

> 📖 Étape officielle : [11-details-page](https://angular.dev/tutorials/first-app/11-details-page) ·
> [Lire la route courante](https://angular.dev/guide/routing/read-route-state#get-information-about-the-current-route-with-activatedroute) ·
> [Optional chaining (MDN)](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/Optional_chaining)

## 🔗 1 — Le lien sur la carte

Dans `src/app/housing-location/housing-location.ts` : importez `RouterLink`, ajoutez-le à `imports`,
et ajoutez le lien à la fin de la `<section class="listing">`, après le `<p class="listing-location">` :

```ts
import { RouterLink } from '@angular/router';
```

```ts
  imports: [RouterLink],
```

```html
      <a [routerLink]="['/details', housingLocation().id]">Learn More</a>
```

| Morceau | Rôle |
|---|---|
| `['/details', housingLocation().id]` | un tableau : la partie fixe du chemin, puis la valeur du paramètre ; Angular assemble `/details/3` |

> 💡 **Tester :** chaque carte a un lien **Learn More ›** (le chevron vient de `housing-location.css`). Cliquez sur la troisième : l'URL devient
> `/details/2` et la page affiche « details works! ».

## 🧭 2 — Lire l'id dans Details

**Remplacez tout le contenu** de `src/app/details/details.ts` par une première version qui affiche
seulement l'`id` :

```ts
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-details',
  template: `<p>details works! {{ housingLocationId }}</p>`,
  styleUrl: './details.css',
})
export class Details {
  route: ActivatedRoute = inject(ActivatedRoute);
  housingLocationId = -1;

  constructor() {
    this.housingLocationId = Number(this.route.snapshot.params['id']);
  }
}
```

| Morceau | Rôle |
|---|---|
| `inject(ActivatedRoute)` | le service du routeur qui décrit la route affichée ; même geste que pour `HousingService` |
| `this.route.snapshot.params['id']` | la valeur de `:id` dans l'URL, **sous forme de texte** (`'2'`) |
| `Number(…)` | la convertit en nombre : `getHousingLocationById(2)` compare avec `===`, `'2' === 2` est faux |

> 💡 **Tester :** depuis la liste, cliquez sur plusieurs **Learn More** : « details works! 2 »,
> « details works! 7 »… le nombre suit l'URL.

## 🏠 3 — Afficher le logement

Maintenant le service. Dans `details.ts` : **ajoutez** deux imports sous les autres, **remplacez** tout
le `template`, et **remplacez** toute la classe `Details` (elle n'a plus `housingLocationId`) :

```ts
import { HousingService } from '../housing.service';
import { HousingLocationInfo } from '../housinglocation';
```

```ts
  template: `
    <article>
      <img
        class="listing-photo"
        [src]="housingLocation?.photo"
        alt="Exterior photo of {{ housingLocation?.name }}"
        crossorigin
      />
      <section class="listing-description">
        <h2 class="listing-heading">{{ housingLocation?.name }}</h2>
        <p class="listing-location">{{ housingLocation?.city }}, {{ housingLocation?.state }}</p>
      </section>
      <section class="listing-features">
        <h2 class="section-heading">About this housing location</h2>
        <ul>
          <li>Units available: {{ housingLocation?.availableUnits }}</li>
          <li>Does this location have wifi: {{ housingLocation?.wifi }}</li>
          <li>Does this location have laundry: {{ housingLocation?.laundry }}</li>
        </ul>
      </section>
    </article>
  `,
```

```ts
export class Details {
  route: ActivatedRoute = inject(ActivatedRoute);
  housingService = inject(HousingService);
  housingLocation: HousingLocationInfo | undefined;

  constructor() {
    const housingLocationId = Number(this.route.snapshot.params['id']);
    this.housingLocation = this.housingService.getHousingLocationById(housingLocationId);
  }
}
```

| Morceau | Rôle |
|---|---|
| `HousingLocationInfo \| undefined` | le logement peut ne pas exister (`/details/42`) : le type le dit |
| `housingLocation?.name` | le `?.` : si `housingLocation` est `undefined`, l'expression vaut `undefined` au lieu de planter |
| pas de `()` après `housingLocation` | ici c'est une propriété ordinaire, pas un input ni un signal |

Enfin le style : **remplacez le contenu** (vide) de `src/app/details/details.css` par celui de
`assets/11/details.css` (72 lignes, pré-remplies dans l'éditeur en ligne). Ouvrez aussi
`src/app/app.ts` et vérifiez que le logo est bien dans `<a [routerLink]="['/']">` (étape 10) :
c'est le retour à la liste.

> 💡 **Tester :** **Learn More** sur « Hopeful Apartment Group » => `/details/5`, grande photo à
> droite, titre en gros, « 📍 Oakland, CA », puis « Units available: 2 », wifi `true`, laundry `true`.
> Le logo ramène à la liste. Tapez `/details/42` : les libellés s'affichent sans valeur, mais rien ne plante (merci `?.`).

> 🗣️ **Débrief 3.** Racontez le chemin de l'`id` : de `housingLocation().id` dans la carte jusqu'au
> `find()` du service. Combien de fichiers traverse-t-il ?

## ⚠️ Pièges

> ⚠️ **Page de détail vide pour un id valide.**
> Symptôme : `/details/2` n'affiche rien, aucune erreur.
> Cause : `Number()` oublié : `find()` compare `'2' === 2`, faux, donc `undefined`.
> Correctif : `Number(this.route.snapshot.params['id'])`.

> ⚠️ **`Object is possibly 'undefined'`** (TS2532) dans le template.
> Symptôme : erreur rouge sur `housingLocation.name`.
> Cause : la propriété est typée `| undefined`, le point simple n'est pas accepté.
> Correctif : `housingLocation?.name`.

## Récap

- Lien dynamique : `[routerLink]="['/details', id]"`. Lecture : `inject(ActivatedRoute).snapshot.params['id']`.
- Un paramètre d'URL est un texte : convertissez-le. Un résultat de `find()` peut être `undefined` : `?.`.

➡️ [12 — Le formulaire](12-FORMS.md)
