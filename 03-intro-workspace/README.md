# 03 — Workspace, bibliothèques et micro-frontends en Angular 22

La synthèse du jour 3 sur le découpage d'une application Angular : les trois paliers (une application avec
des routes lazy, un workspace multi-projets, des micro-frontends), le workspace du CLI (`apps/` + `libs/`,
alias `@shop/*`, alias vers `dist/` ou vers les sources), le rangement des bibliothèques par type, Nx en
comparaison (graphe, tags et `enforce-module-boundaries`, `affected`), puis un exemple complet de
micro-frontends avec Native Federation : un shell, un remote, et une session partagée en singleton.

- 📄 **La page à garder** : [index.html](index.html), imprimable.
  En ligne : **https://bngams.github.io/2610-ng/03-intro-workspace/**

Pas de projet à lancer ici : chaque commande et chaque sortie de la page vient d'une exécution réelle
(Angular CLI 22.2.2, Node 24.18.0, `@angular-architects/native-federation` 22.2.2, un workspace Nx), et
l'exemple Native Federation a été vérifié dans le navigateur. Les projets de vérification ne sont pas livrés.

## Et ensuite

Les autres synthèses du jour 3 : [authentification](../03-intro-auth/) et [gestion d'état](../03-intro-store/).
Pour pratiquer : le lab [Minishop](https://github.com/bngams/2610-ng/tree/main/03-minishop/) (en cours d'écriture).
