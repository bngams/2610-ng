# A6 — `equal` : contrôler ce qui compte comme un changement

## 🧠 Concept

Par défaut, un signal considère qu'il a changé si la nouvelle valeur n'est pas `Object.is` à
l'ancienne. Pour un objet, deux instances aux mêmes valeurs sont donc « différentes ». L'option
`equal` permet de comparer **par valeur** : si elle renvoie `true`, le `set()` est ignoré et
rien en aval n'est recalculé.

> 📖 [Signal equality functions](https://angular.dev/guide/signals#signal-equality-functions)

## 🎯 Scénario

1. Ajoutez au composant `FormationFiltre` un bouton « Ré-appliquer » qui émet
   `{ ...this.filtres() }` : mêmes valeurs, objet neuf.
2. Sans rien d'autre : sélectionnez une carte, cliquez « Ré-appliquer ». La sélection disparaît
   (A5 a recalculé parce que `filtrees` a été recalculé parce que `filtres` a « changé »).
3. Donnez à `filtres` une égalité par valeur :
   `signal<Filtres>({ … }, { equal: (a, b) => a.ville === b.ville && a.niveau === b.niveau })`.

Critère : « Ré-appliquer » ne touche plus à la sélection, et le `console.log` de A3 ne s'affiche
pas non plus.

## 🪤 Piège : l'objet recréé à chaque fois

```ts
// Dans un composant parent, à chaque frappe dans un champ de recherche :
this.criteres.set({ texte: this.champ.value, page: 1 });
```

Chaque frappe recalcule une chaîne de 4 computed et relance une requête, même quand l'utilisateur
tape puis efface la même lettre. Quelles sont les deux corrections possibles, et laquelle choisir ?

<details>
<summary>Réponse</summary>

(1) Un `equal` par valeur sur `criteres`, comme ici. (2) Éclater l'objet en deux signals
primitifs `texte` et `page`, dont l'égalité par défaut est déjà par valeur. La seconde est
souvent préférable : plus simple, et chaque consommateur ne dépend que de ce qu'il lit. On garde
l'objet + `equal` quand les champs vont toujours ensemble (un formulaire de filtres soumis d'un
bloc). Prouvé par le test `A6` de `pieges.spec.ts` : 2 calculs sans `equal`, 1 avec.
</details>

➡️ [A7 — `effect()` et `afterRenderEffect()`](A7-EFFECT.md)
