# 03 — Un service comme store

La synthèse du jour 3 sur l'état partagé : pourquoi un store, le pattern « service + signals » (signal privé,
`asReadonly()`, `computed` comme sélecteurs, méthodes comme actions), deux exemples (le panier persistant dans
`localStorage`, la session chargée par `GET /auth/me`), l'asynchrone (mise à jour optimiste et rollback), puis quand
passer à NgRx SignalStore (`@ngrx/signals` 22) et comment tester un store avec Vitest.

- 📄 **La page à garder** : [index.html](index.html), imprimable.
  En ligne : **https://bngams.github.io/2610-ng/03-intro-store/**

Pas de projet à lancer ici : chaque extrait de la page vient d'un projet Angular 22 de test qui compile (`ng build`),
dont les tests passent (`ng test`) et dont le comportement a été vérifié dans le navigateur ; ce projet n'est pas livré.

## Et ensuite

Pour pratiquer : le [lab MiniShop](https://github.com/bngams/2610-ng/tree/main/03-minishop/). Pages voisines :
l'[authentification](../03-intro-auth/) et le [workspace multi-projets](../03-intro-workspace/). Avant : la
[synthèse du jour 1](../00-intro-syntax-recap/), la [démo HTTP](../02-demo-http/) et les [formulaires](../02-intro-forms/).
