# Formation Angular 22 — AELION, 3 jours

Supports et cas pratiques. Deux parcours (**Init** et **Avancé**) autour d'un socle commun.

🌐 Version en ligne de la synthèse : **https://bngams.github.io/2610-ng/00-intro-syntax-recap/**
(et le [repère v20](https://bngams.github.io/2610-ng/00-intro-syntax-recap/repere-v20.html)).

## Jour 1 — syntaxes modernes et signals

| | Support | Pour qui |
|---|---|---|
| Matin | [learn-angular](https://angular.dev/tutorials/learn-angular), déroulé en live | tout le monde |
| Matin | [00 — Synthèse des syntaxes](00-intro-syntax-recap/) : la page à garder sous la main, et le [repère de version v20](00-intro-syntax-recap/repere-v20.html) | tout le monde |
| Matin et après-midi | [01 — Lab Intro](01-lab-intro/) : le catalogue de formations, parcours Init ou Avancé | tout le monde |

## Jour 2 — HTTP en pratique, puis le cas Housing

| | Support | Pour qui |
|---|---|---|
| Matin | [02 — Démo HTTP](02-demo-http/) : `ng new`, routing, `HttpClient`, typage, enveloppe générique, `ResourceService<I, T>`, environnements, intercepteurs ([version en ligne](https://bngams.github.io/2610-ng/02-demo-http/)) | tout le monde |
| Ensuite | [02 — Housing, premiers pas](02-housing-init/) : le tutoriel officiel first-app en français, guidé pas à pas, jusqu'à `HttpClient`, un intercepteur, les environnements et un dossier de candidature en plusieurs étapes (Reactive Forms) | Init |
| Ensuite | [02 — Housing sous pression asynchrone](02-housing-async/) : à la suite du Housing Init, des scénarios RxJS donnés et côté signals à écrire, puis un intercepteur de reprise et un service générique `ResourceService<I, T>` | Avancé |
| En appui | [02 — Les formulaires](02-intro-forms/) : template-driven, Reactive Forms, Signal Forms, formulaire dynamique ([version en ligne](https://bngams.github.io/2610-ng/02-intro-forms/)) | tout le monde |
| Fin de journée | Débrief final : la grille de décision RxJS / signals | tout le monde |

## Jour 3 — Auth, store, workspace et micro-frontends

| | Support | Pour qui |
|---|---|---|
| Fiche | [03 — Authentification et autorisation](03-intro-auth/) : JWT, où garder le jeton (cookie `httpOnly` plutôt que `localStorage`), OIDC, guards, RBAC et CASL ([version en ligne](https://bngams.github.io/2610-ng/03-intro-auth/)) | tout le monde |
| Fiche | [03 — Un service comme store](03-intro-store/) : panier et session en services avec signals, puis SignalStore ([version en ligne](https://bngams.github.io/2610-ng/03-intro-store/)) | tout le monde |
| Fiche | [03 — Workspace, bibliothèques et micro-frontends](03-intro-workspace/) : workspace CLI, Nx, Native Federation ([version en ligne](https://bngams.github.io/2610-ng/03-intro-workspace/)) | tout le monde |
| Lab | [03 — Le mini e-shop](03-minishop/) : workspace `fo` + `bo` et bibliothèques `api`, `auth`, `ui`, `products` ; panier en store, session par cookie `httpOnly`, guards et rôles, tests (étapes 01 à 07 ; micro-frontends et notifications à venir) | tout le monde |

## Prérequis

- **Node.js 22.22 ou 24.15 minimum** (`node -v`). Sinon : `nvm install 24 && nvm use 24`.
- Un éditeur avec l'extension *Angular Language Service* (VS Code).
- Pas d'installation globale nécessaire : chaque projet se lance avec `npm install && npm start`.

## Ressources

Trois cheatsheets à garder sous la main pendant les trois jours, dans [`00-resources/`](00-resources/) :

- [Angular moderne, les règles essentielles](00-resources/cheatsheet-angular-moderne.html) : la version
  texte, avec les extraits de code ([version en ligne](https://bngams.github.io/2610-ng/00-resources/cheatsheet-angular-moderne.html)).
- [Anciennes vs nouvelles conventions](00-resources/cheatsheet-angular-modern-vs-legacy.png) : service, `inject()`, signals,
  `@if`, standalone, `provideRouter`, `provideHttpClient`, avec l'avant et le maintenant côte à côte.
- [Les signals](00-resources/cheatsheet-angular%20signals.png) : `signal`, `computed` et le suivi des dépendances,
  `effect`, `linkedSignal`, puis `input()`, `model()`, `resource()`, `toSignal()` et `untracked()`.
- [Les outils de l'environnement de travail](00-resources/cheatsheet-angular-tools-agl.png) : Angular DevTools, la CLI,
  VS Code et ses extensions (Angular Language Service, EditorConfig, Prettier, ESLint).

## Pour aller plus loin

- [angular.dev](https://angular.dev) : la documentation officielle (v22).
- [Guide signals](https://angular.dev/guide/signals), [Guide RxJS interop](https://angular.dev/ecosystem/rxjs-interop).
- [Versions et support](https://angular.dev/reference/versions).
