# A5 — `linkedSignal` avec l'état précédent : garder la sélection si possible

## 🧠 Concept

La forme longue `linkedSignal({ source, computation })` donne à `computation` la nouvelle valeur
de la source **et** la valeur précédente du signal (`previous.value`). On peut donc décider
« je garde » ou « je réinitialise » au lieu de toujours repartir de zéro.

> 📖 [linkedSignal : accounting for previous state](https://angular.dev/guide/signals/linked-signal#accounting-for-previous-state)

## 🎯 Scénario

Remplacez la version A4 par :

```ts
selection = linkedSignal<Formation[], number | undefined>({
  source: this.filtrees,
  computation: (liste, precedent) => {
    const id = precedent?.value;
    return /* TODO : id s'il est encore dans `liste`, sinon undefined */;
  },
});
```

Critère : sélectionner *Angular avancé* (Paris), filtrer sur « Paris » : la sélection reste.
Filtrer sur « Toulouse » : elle disparaît.

## 🪤 Pas de piège ici, une question

À quoi sert le premier paramètre de type (`Formation[]`) ? Et que se passe-t-il si vous
oubliez `?.` sur `precedent` ?

<details>
<summary>Réponse</summary>

C'est le type de la **source** ; le second est celui de la valeur du linkedSignal. Au tout
premier calcul il n'y a pas de précédent : `precedent` vaut `undefined`, d'où le `?.`. Sans lui,
TypeScript refuse de compiler (c'est le genre d'erreur que le typage attrape pour vous).
</details>

➡️ [A6 — Égalité](A6-EQUALITY.md)
