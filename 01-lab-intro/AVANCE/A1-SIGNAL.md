# A1 — `signal()` : la liste et le panier

> Vous partez de `starter-avance/` : la liste, la carte et le service existent, rien n'est
> réactif. Chaque étape de ce parcours suit le même format : concept, doc, scénario, piège.

## 🧠 Concept

Un signal est un conteneur de valeur qui **notifie** ce qui le lit quand il change. On le lit avec
`()`, on le change avec `set()` ou `update()`, et Angular ne compare que la **référence** (par
défaut) : une nouvelle valeur = un nouvel objet ou tableau.

> 📖 [Writable signals](https://angular.dev/guide/signals#writable-signals)

## 🎯 Scénario

Dans `formation-list.ts` :

1. `formations` devient un `signal<Formation[]>` initialisé depuis le service.
2. Un `panier = signal<number[]>([])` : les ids des formations choisies.
3. `inscrire(id)` ajoute l'id **sans doublon**, `desinscrire(id)` le retire. Les deux passent par
   `update()` et produisent un **nouveau tableau**.
4. La carte reçoit un nouvel input `inscrit = input(false)` et affiche « Se désinscrire » (output
   `desinscrire`) à la place de « S'inscrire » quand il est vrai.
5. Un bandeau `<section class="panier">` affiche `panier().length`.

Critère : cliquer S'inscrire puis Se désinscrire sur la même carte laisse le panier à 0, sans
rechargement, et le bouton change de libellé.

## 🪤 Piège : rien ne se rafraîchit

```ts
inscrire(id: number) {
  this.panier().push(id);
  console.log(this.panier()); // affiche bien [1]
}
```

Le `console.log` montre l'id, le bandeau reste à 0. Pourquoi ?

<details>
<summary>Réponse</summary>

`push` modifie le tableau **en place** : la référence contenue dans le signal n'a pas changé,
donc le signal n'a rien à notifier. Le template, qui lit `panier().length`, n'est pas réévalué.
Correctif : `this.panier.update(ids => [...ids, id])`. Prouvé par le test `A1` de
`solution-avance/src/app/pieges.spec.ts` : un `computed` sur la taille reste à 1 après un `push`,
et passe à 3 après un `update`.
</details>

➡️ [A2 — `computed()`](A2-COMPUTED.md)
