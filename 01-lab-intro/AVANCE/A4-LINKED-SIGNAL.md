# A4 — `linkedSignal()` : une sélection qui se réinitialise

## 🧠 Concept

`linkedSignal` est un signal **modifiable** dont la valeur est **recalculée** à partir d'une
source quand celle-ci change. Entre deux changements de la source, on peut le `set()` librement.
C'est le cas « état local dérivé d'un état parent » : une sélection, un index de page, un onglet.

> 📖 [linkedSignal](https://angular.dev/guide/signals/linked-signal)

## 🎯 Scénario

1. La carte reçoit `selected = input(false)` (classe CSS `selected`) et émet `selectionner`
   au clic sur l'article.
2. Dans la liste : `selection = linkedSignal<number | undefined>(() => { this.filtrees(); return undefined; })`.
   Le `@for` passe `[selected]="selection() === f.id"` et `(selectionner)="selection.set($event)"`.
3. Le bandeau affiche `sélection : #id` quand il y en a une.

Critère : sélectionner une carte, puis changer de filtre : la sélection disparaît. La changer
sans toucher au filtre : elle suit les clics.

## 🪤 Piège : fait avec un `effect`

```ts
selection = signal<number | undefined>(undefined);

constructor() {
  effect(() => {
    this.filtrees();             // "quand la liste change…"
    this.selection.set(undefined); // "…on réinitialise"
  });
}
```

Ça marche. Pourquoi est-ce moins bien qu'un `linkedSignal` ?

<details>
<summary>Réponse</summary>

Trois raisons. (1) L'`effect` est **planifié**, pas exécuté : entre le `set()` du filtre et la
prochaine synchronisation, `selection()` lue depuis du code (un `computed`, un test) est
obsolète. (2) La relation
« sélection dépend de la liste » est cachée dans un constructeur, au lieu d'être lisible sur la
déclaration. (3) À l'initialisation, l'effect écrase une valeur que vous auriez voulu poser.
`linkedSignal` exprime la même chose de façon synchrone et déclarative. L'étape A5 montre en plus
ce qu'un effect ne sait pas faire simplement : décider en fonction de la valeur précédente.
Le retard d'un `effect` qui écrit dans un signal est prouvé par le test `A7` de `pieges.spec.ts`.
</details>

➡️ [A5 — `linkedSignal` avec état précédent](A5-LINKED-SIGNAL-PREVIOUS.md)
