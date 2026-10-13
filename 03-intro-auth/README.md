# 03 — Authentification et autorisation en Angular 22

La synthèse du jour 3 sur l'authentification et l'autorisation : la différence entre les deux (et pourquoi c'est le serveur
qui décide), l'anatomie d'un JWT, où garder le jeton (« on arrête les jetons dans `localStorage` » : cookie `httpOnly`, BFF),
OIDC / OAuth2 avec PKCE et les bibliothèques maintenues, la session dans un signal remplie par `GET /auth/me`, l'intercepteur
et le jeton XSRF, les guards fonctionnels (`CanActivateFn`, `CanMatchFn`, `CanDeactivateFn`, `RedirectCommand`), puis les
rôles et permissions dans les templates, jusqu'à CASL.

- 📄 **La page à garder** : [index.html](index.html), imprimable.
  En ligne : **https://bngams.github.io/2610-ng/03-intro-auth/**

Pas de projet à lancer ici : chaque extrait de la page a été compilé (`ng build`) et vérifié dans le navigateur sur un projet
Angular 22 de test, branché sur une petite API json-server 0.17.4 derrière le proxy de développement. Ce projet n'est pas livré.
Les comptes `alice` et `admin` cités dans la page sont des données de démonstration.

## Et ensuite

Pour pratiquer : le lab du jour 3, [MiniShop](https://github.com/bngams/2610-ng/tree/main/03-minishop/) (en cours d'écriture).
Les autres synthèses : [jour 1](../00-intro-syntax-recap/), [démo HTTP](../02-demo-http/), [formulaires](../02-intro-forms/).
