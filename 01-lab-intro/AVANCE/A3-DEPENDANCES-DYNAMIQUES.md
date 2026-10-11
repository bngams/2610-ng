# A3 — Dépendances dynamiques et `untracked()`

## 🧠 Concept

Les dépendances d'un `computed` (ou d'un `effect`) ne sont pas déclarées : elles sont **relevées
à chaque exécution**, selon les signals effectivement lus. Une lecture dans une branche non
exécutée n'est pas une dépendance. `untracked(fn)` lit un signal **sans** créer la dépendance.

> 📖 [Dynamic dependency tracking](https://angular.dev/guide/signals#computed-signal-dependencies-are-dynamic) ·
> [untracked](https://angular.dev/api/core/untracked)

## 🎯 Scénario

Dans le bandeau : une case « afficher TTC » (`ttc = signal(false)`) et un champ TVA
(`tauxTVA = signal(0.2)`). Un `montantAffiche = computed(…)` renvoie `total()` si TTC est
décoché, sinon `total() * (1 + tauxTVA())`. Mettez un `console.log` dans le computed.

Critère : case décochée, changer la TVA **n'affiche rien** dans la console ; case cochée, chaque
changement de TVA recalcule. Vous venez d'observer qu'une dépendance peut apparaître et
disparaître.

## 🪤 Piège : « changer la TVA ne fait rien »

Deux variantes à diagnostiquer, dans le même composant :

```ts
// Variante 1
montant = computed(() => this.ttc() ? this.total() * (1 + this.tauxTVA()) : this.total());

// Variante 2 : "la TVA ne change jamais pendant une session, inutile de la tracker"
montant = computed(() => this.total() * (1 + untracked(this.tauxTVA)));
```

Un collègue signale que, dans les deux cas, « modifier la TVA ne met pas le montant à jour ».
Pour chaque variante : est-ce un bug, et que répondre ?

<details>
<summary>Réponse</summary>

**Variante 1** : pas un bug. Quand `ttc()` est faux, `tauxTVA` n'est pas lu, donc pas tracké :
le montant n'a pas à bouger, il est HT. Dès que `ttc` passe à vrai, la dépendance apparaît.
C'est le comportement attendu, et c'est une optimisation gratuite.

**Variante 2** : un bug, volontaire. `untracked` fige la lecture : le montant ne sera recalculé
que si `total` change, et prendra alors la TVA *du moment*. Le montant affiché peut donc être faux
entre deux changements de panier. `untracked` sert à lire un signal « de contexte » dont on ne
veut pas dépendre (un id de session, un logger), pas une donnée métier affichée.

Les deux sont prouvées par les tests `A3` et `A3 bis` de `pieges.spec.ts`.
</details>

➡️ [A4 — `linkedSignal()`](A4-LINKED-SIGNAL.md)
