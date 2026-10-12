# 13 — La recherche par ville

> Le champ « Filter by city » et le bouton **Search** sont là depuis l'étape 2. Vous les rendez
> vivants : au clic, `Home` filtre la liste sur la ville saisie. Pour lire le champ sans formulaire,
> vous utilisez une **variable de template** (`#filter`).

## ✨ Ce que vous apprenez

- `#filter` : nommer un élément HTML dans le template pour le lire ailleurs dans ce template.
- `(click)="methode(filter.value)"` : passer la saisie à une méthode de la classe.
- Garder deux listes : la complète et la filtrée.

> 📖 Étape officielle : [13-search](https://angular.dev/tutorials/first-app/13-search) ·
> [Variables de template](https://angular.dev/guide/templates/variables) ·
> [Array.prototype.filter (MDN)](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)

## 🧱 1 — Deux listes dans Home

Dans `src/app/home/home.ts`, ajoutez la propriété `filteredLocationList` sous `housingService`, puis, dans le
constructeur **existant**, ajoutez la ligne `this.filteredLocationList = this.housingLocationList;`
(ne créez pas un second constructeur). Au chargement, elle contient donc tout. Cette partie de la
classe doit ressembler à ceci :

```ts
  filteredLocationList: HousingLocationInfo[] = [];

  constructor() {
    this.housingLocationList = this.housingService.getAllHousingLocations();
    this.filteredLocationList = this.housingLocationList;
  }
```

| Morceau | Rôle |
|---|---|
| `housingLocationList` | la liste **complète**, jamais modifiée : on repart d'elle à chaque recherche |
| `filteredLocationList` | ce que le template affiche ; au départ, la même chose |

## 🧩 2 — Le template

Le `template` de `Home` demande trois modifications : nommer le champ, écouter le clic, et afficher
la liste filtrée. Les deux premières concernent le `<form>` : remplacez-le par celui-ci, qui ajoute
`#filter` sur le champ et `(click)` sur le bouton :

```ts
      <form>
        <input type="text" placeholder="Filter by city" #filter />
        <button class="primary" type="button" (click)="filterResults(filter.value)">Search</button>
      </form>
```

La troisième concerne la boucle : dans la `<section class="results">`, remplacez la ligne `@for`
par celle-ci, pour qu'elle parcoure `filteredLocationList` au lieu de `housingLocationList` :

```ts
      @for (housingLocation of filteredLocationList; track $index) {
```

| Morceau | Rôle |
|---|---|
| `#filter` | une **variable de template** : `filter` désigne cet `<input>` (l'élément HTML lui-même) |
| `filter.value` | la propriété `value` de l'`<input>` : le texte saisi |
| `(click)="filterResults(filter.value)"` | liaison d'événement : au clic, appelle la méthode avec le texte |
| `type="button"` | un bouton ordinaire : il ne soumet pas le `<form>` (sinon la page se rechargerait) |

## 🔍 3 — La méthode

🚧 **À compléter** dans la classe `Home`, après le constructeur : la méthode qui filtre.

```ts
  filterResults(text: string) {
    if (!text) {
      this.filteredLocationList = this.housingLocationList;
      return;
    }

    this.filteredLocationList = this.housingLocationList.filter((housingLocation) =>
      // TODO : vrai si la ville du logement contient le texte, sans tenir compte des majuscules
      //        indices : housingLocation.city, toLowerCase(), includes()
    );
  }
```

| Morceau | Rôle |
|---|---|
| `if (!text)` | texte vide => on réaffiche tout |
| `.filter((housingLocation) => condition)` | renvoie un **nouveau** tableau avec les éléments pour lesquels la condition est vraie |
| `toLowerCase()` des deux côtés | « oak », « Oak » et « OAK » donnent le même résultat |

> 💡 **Tester :** tapez `oak` puis **Search** : 4 cartes (les quatre d'Oakland). Tapez `chicago` : 2.
> Videz le champ puis **Search** : les 10 reviennent. Le tutoriel officiel propose en bonus de
> filtrer aussi sur le nom (`housingLocation.name`).

## ⚠️ Pièges

> ⚠️ **`TS2339: Property 'filter' does not exist on type 'Home'`.**
> Symptôme : erreur à l'enregistrement du template.
> Cause : le `#filter` manque sur l'`<input>`, ou le nom diffère (`#filtre` / `filter.value`).
> Correctif : même nom des deux côtés, sans `#` dans l'appel.

> ⚠️ **La page se recharge au clic.**
> Symptôme : flash blanc, liste complète.
> Cause : le bouton est `type="submit"` (ou sans `type`) dans un `<form>`.
> Correctif : `type="button"`.

## Récap

- `#nom` sur un élément, puis `nom.value` dans un gestionnaire d'événement : pas besoin de formulaire.
- Filtrer = garder la liste complète et en dériver une seconde.

➡️ [14 — HTTP](14-HTTP.md)
