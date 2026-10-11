# A7 — `effect()` et `afterRenderEffect()` : sortir du monde réactif

## 🧠 Concept

Un `effect` exécute du code **quand ses dépendances changent**, pour parler au monde extérieur :
stockage, logs, bibliothèques tierces. Il ne sert pas à dériver de l'état (c'est `computed` /
`linkedSignal`). `afterRenderEffect` est sa variante qui tourne **après** que le DOM a été mis à
jour : c'est le seul bon moment pour mesurer ou faire défiler.

> 📖 [effect](https://angular.dev/api/core/effect) ·
> [afterRenderEffect](https://angular.dev/api/core/afterRenderEffect)

## 🎯 Scénario

1. **Persistance** : dans le constructeur, un `effect` écrit `panier()` dans
   `localStorage` ; à l'initialisation, `panier` est lu depuis `localStorage` (prévoir le cas
   vide ou corrompu). Critère : rechargez la page, le panier est toujours là.
2. **Scroll** : les cartes portent `#carte` et `[attr.data-id]="f.id"` ;
   `cartes = viewChildren('carte', { read: ElementRef })`. Un `afterRenderEffect` lit
   `selection()`, retrouve l'élément et appelle `scrollIntoView({ behavior: 'smooth', block: 'nearest' })`.
   Critère : réduisez la fenêtre, sélectionnez une carte en bas, changez de filtre pour une liste
   qui la contient : la page défile jusqu'à elle.

## 🪤 Piège : l'effect qui écrit dans un signal

```ts
totalTTC = signal(0);

constructor() {
  effect(() => {
    this.totalTTC.set(this.total() * (1 + this.tauxTVA()));
  });
}
```

Angular l'accepte. Qu'est-ce qui cloche quand même ?

<details>
<summary>Réponse</summary>

C'est un `computed` déguisé, avec trois défauts : la valeur est **en retard** (l'effect est
planifié, pas exécuté : entre le changement de `total` et le prochain tick, `totalTTC` est faux),
elle existe même si personne ne la lit, et un lecteur ne voit pas que `totalTTC` dépend de
`total`. Règle : si l'effect ne fait que `set()` à partir d'autres signals, c'est un `computed`
(ou un `linkedSignal` s'il doit rester modifiable). Prouvé par le test `A7` de `pieges.spec.ts`.

Second piège, plus discret : faire le `scrollIntoView` dans un `effect()` classique. Il tourne
**avant** le rendu de la vue du composant : avec un `@for`, la carte sélectionnée peut ne pas
encore exister dans le DOM (nouvelle liste filtrée), et le défilement rate. `afterRenderEffect`
règle ça.
</details>

➡️ [A8 — `@defer`](A8-DEFER.md)
