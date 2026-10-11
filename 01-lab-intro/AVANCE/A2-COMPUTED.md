# A2 — `computed()` : liste filtrée, places restantes, total

## 🧠 Concept

Un `computed` est un signal **dérivé** : une fonction pure qui lit d'autres signals. Il est
**paresseux** (calculé à la première lecture), **mémorisé** (pas recalculé tant que ses
dépendances ne changent pas) et **en lecture seule**.

> 📖 [Computed signals](https://angular.dev/guide/signals#computed-signals)

## 🎯 Scénario

1. Dans la liste : `filtres = signal<Filtres>({ ville: '', niveau: '' })` (le type `Filtres` est
   à ajouter dans `models/formation.ts` : `{ ville: string; niveau: Niveau | '' }` ; le type
   `Niveau = 'init' | 'avance'` y existe déjà), et
   `filtrees = computed(…)` qui applique les deux filtres. Le `@for` itère sur `filtrees()`.
2. `villes = computed(…)` : les villes distinctes, triées, pour alimenter un `<select>`.
3. Un composant `FormationFiltre` dans `src/app/formations/formation-filtre.ts` (deux `<select>`, inputs `villes` et `filtres`, output
   `filtresChange` qui émet un **nouvel objet** `{ ...filtres(), ville }`). La liste fait
   `(filtresChange)="filtres.set($event)"`.
4. `total = computed(…)` : somme des `prixHT` du panier, affichée dans le bandeau.
5. Dans la carte : `placesRestantes = computed(() => formation().places - (inscrit() ? 1 : 0))`,
   et le badge l'utilise. Un `computed` peut dériver d'`input()`s : ce sont des signals.

Critère : choisir « Paris » n'affiche que 2 cartes ; s'inscrire fait baisser le badge d'une place ;
le total suit le panier.

## 🪤 Piège : un effet de bord dans un computed

```ts
total = computed(() => {
  const t = this.panier().reduce(/* … */, 0);
  this.derniereMaj.set(new Date());   // "pour savoir quand le total a changé"
  console.log('total recalculé');
  return t;
});
```

Ça compile, ça semble marcher. Qu'est-ce qui va mal tourner ?

<details>
<summary>Réponse</summary>

Un `computed` ne s'exécute que **quand quelqu'un le lit**, et seulement si une dépendance a
changé depuis. Si le bandeau est masqué (`@if`), `derniereMaj` ne bouge plus ; si deux endroits
le lisent, l'effet ne tourne qu'une fois. Écrire dans un signal depuis un `computed` est
d'ailleurs interdit par Angular à l'exécution (`NG0600`). Un `computed` est une fonction pure :
le « quand » appartient à `effect()` (A7), et `derniereMaj` n'a probablement pas besoin
d'exister. Prouvé par le test `A2` de `pieges.spec.ts` : zéro exécution avant lecture, une seule
pour deux lectures.
</details>

➡️ [A3 — Dépendances dynamiques](A3-DEPENDANCES-DYNAMIQUES.md)
