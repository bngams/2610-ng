# 🏗️ 01 — Le workspace

> **Scénario très guidé, environ 40 minutes.** Vous partez d'un dossier vide et vous construisez
> le contenant de toute la boutique : un workspace Angular, deux applications (`fo` et `bo`),
> quatre bibliothèques, Angular Material, et un premier composant partagé, l'en-tête. Chaque
> commande est donnée, avec ce qu'elle doit afficher. Le résultat attendu est dans
> `solution/`, à n'ouvrir qu'en cas de blocage.

## ✨ Objectifs

- Créer un workspace **sans application** avec `ng new --no-create-application`, puis y générer
  deux applications et quatre bibliothèques, rangées dans `apps/` et `libs/`.
- Comprendre l'**alias** `@shop/…` d'une bibliothèque, et le faire pointer vers ses sources.
- Installer **Angular Material** dans les deux applications et regrouper ses modules dans un
  **barrel**.
- Écrire un premier composant de bibliothèque, l'en-tête, et le **réutiliser** dans les deux
  applications.

## 📁 Point de départ

Vous partez de rien : la seule chose qui existe est le dossier du cours, qui contient
`03-minishop/`. À la fin de cette étape, votre workspace ressemblera à ceci :

```
shop/
├── angular.json             6 projets : fo, bo, @shop/api, @shop/auth, @shop/ui, @shop/products
├── package.json             + les scripts fo et bo
├── tsconfig.json            les alias @shop/* vers les sources
├── apps/
│   ├── fo/src/app/          app.ts, app.html, app.routes.ts, pages/home/, pages/not-found/
│   └── bo/src/app/          la même chose
└── libs/
    ├── api/src/             public-api.ts vide
    ├── auth/src/            public-api.ts vide
    ├── products/src/        public-api.ts vide
    └── ui/src/              material.ts, models/menu-item.ts, components/layout/header/
```

---

## 🧰 1 — Vérifier Node

Angular 22 refuse de démarrer avec un Node trop ancien. Ouvrez un premier terminal : ce sera le
**terminal 4**, celui des commandes, pendant tout le lab (le README numérote les quatre
terminaux ; les trois autres serviront à lancer l'API et les deux applications). Placez-vous dans
le dossier du cours (celui qui contient `03-minishop/`), et vérifiez la version :

```bash
node -v
```

La réponse doit être `v24.15` ou plus (ou `v22.22.3` ou plus). Si ce n'est pas le cas, et si vous
utilisez nvm, `nvm install 24` puis `nvm use 24` règlent la question ; pensez à refaire
`nvm use 24` dans chaque nouveau terminal.

> 📖 [Angular : versions de Node prises en charge](https://angular.dev/reference/versions)

---

## 🏗️ 2 — Créer un workspace vide

D'habitude, `ng new` crée un workspace **et** une application du même nom. Ici, on veut un
contenant vide, dans lequel on rangera ensuite plusieurs applications et plusieurs bibliothèques.
Toujours depuis le dossier du cours, lancez :

```bash
npx @angular/cli@22 new shop --no-create-application --package-manager=npm --skip-git
```

Chaque option a un rôle précis :

| Option | Rôle |
|---|---|
| `npx @angular/cli@22` | exécute la CLI Angular 22 sans l'installer globalement : tout le monde a la même version |
| `new shop` | crée le dossier `shop/` et son workspace |
| `--no-create-application` | **pas** d'application dans `src/` : un workspace vide, prêt à recevoir plusieurs projets |
| `--package-manager=npm` | utilise npm (et écrit ce choix dans `angular.json`) |
| `--skip-git` | ne crée pas de dépôt Git : le dossier du cours en est peut-être déjà un |

Si la CLI vous pose une question (partager des statistiques d'usage anonymes, configurer un outil
d'IA), répondez `No` ou `None` : cela ne change rien au lab. La commande se termine ainsi :

```
CREATE shop/angular.json (183 bytes)
CREATE shop/package.json (700 bytes)
CREATE shop/tsconfig.json (787 bytes)
...
✔ Packages installed successfully.
```

Entrez dans le workspace : **toutes les commandes du lab se lancent désormais depuis `shop/`**.

```bash
cd shop
```

Ouvrez `angular.json` : la clé `"projects"` est vide, `{ }`. C'est elle que les commandes
suivantes vont remplir.

> 📖 [`ng new`](https://angular.dev/cli/new) ·
> [Workspaces à plusieurs projets](https://angular.dev/reference/configs/file-structure#multiple-projects)

---

## 🖥️ 3 — Générer les deux applications

La CLI range par défaut les projets dans `projects/`. On préfère une convention venue de Nx, et
très répandue : les applications dans `apps/`, les bibliothèques dans `libs/`. C'est l'option
`--project-root` qui choisit le dossier ; le nom du projet, lui, reste court (`fo`), car c'est lui
qu'on tapera dans `ng serve fo`. Générez la boutique :

```bash
npx ng generate application fo --project-root apps/fo --routing --style=css --ssr=false
```

Les options évitent les questions interactives de la CLI :

| Option | Rôle |
|---|---|
| `fo` | le nom du projet, utilisé ensuite par `ng serve fo`, `ng build fo`, `ng test fo` |
| `--project-root apps/fo` | le dossier où le projet est créé |
| `--routing` | crée `app.routes.ts` |
| `--style=css` | des feuilles de style CSS simples |
| `--ssr=false` | pas de rendu côté serveur : une application qui tourne dans le navigateur |

La commande affiche les fichiers créés, puis met à jour les trois fichiers communs du workspace :

```
CREATE apps/fo/src/app/app.css (0 bytes)
CREATE apps/fo/src/app/app.spec.ts (676 bytes)
CREATE apps/fo/src/app/app.ts (285 bytes)
CREATE apps/fo/src/app/app.html (20144 bytes)
CREATE apps/fo/src/main.ts (222 bytes)
CREATE apps/fo/src/app/app.config.ts (312 bytes)
CREATE apps/fo/src/app/app.routes.ts (77 bytes)
...
UPDATE angular.json (1938 bytes)
UPDATE tsconfig.json (924 bytes)
UPDATE package.json (780 bytes)
```

Le back-office se génère exactement de la même façon, avec son propre nom et son propre dossier :

```bash
npx ng generate application bo --project-root apps/bo --routing --style=css --ssr=false
```

> ⚠️ **Piège : le chemin dans le nom.** `npx ng generate application apps/fo` est refusé
> (`Data path "/name" must match pattern …`) : le nom doit rester un identifiant simple. Le
> dossier se donne avec `--project-root`.

> 📖 [`ng generate application`](https://angular.dev/cli/generate/application)

---

## 📚 4 — Générer les quatre bibliothèques

Une bibliothèque se génère comme une application. On lui donne directement un **nom scopé**,
`@shop/…` : le scope (`@shop`) est le nom de l'organisation, et il évite qu'un import ressemble à
un paquet npm public. Lancez les quatre commandes, une par bibliothèque :

```bash
npx ng generate library @shop/api --project-root libs/api
npx ng generate library @shop/auth --project-root libs/auth
npx ng generate library @shop/ui --project-root libs/ui
npx ng generate library @shop/products --project-root libs/products
```

Pour `@shop/products`, par exemple, la sortie montre les fichiers propres à une bibliothèque :

```
CREATE libs/products/ng-package.json (162 bytes)
CREATE libs/products/package.json (218 bytes)
CREATE libs/products/tsconfig.lib.json (486 bytes)
...
CREATE libs/products/src/public-api.ts (74 bytes)
CREATE libs/products/src/lib/products.spec.ts (546 bytes)
CREATE libs/products/src/lib/products.ts (201 bytes)
UPDATE angular.json (6504 bytes)
UPDATE tsconfig.json (1740 bytes)
```

Trois fichiers distinguent une bibliothèque d'une application :

| Fichier | Rôle |
|---|---|
| `package.json` | le nom du paquet, `"name": "@shop/products"` |
| `ng-package.json` | la configuration de ng-packagr, l'outil qui compilerait la bibliothèque pour la publier sur npm |
| `src/public-api.ts` | la **façade** : seul ce qui y est exporté est visible des applications |

> ℹ️ **Le nom du projet est le nom scopé.** Dans `angular.json`, la bibliothèque s'appelle
> `@shop/products`, et c'est ce nom que les commandes attendent : `npx ng test @shop/products`.

> 📖 [Créer une bibliothèque](https://angular.dev/tools/libraries/creating-libraries) ·
> [`ng generate library`](https://angular.dev/cli/generate/library)

---

## 🧹 5 — Faire le ménage dans les fichiers générés

La CLI a créé des fichiers de démonstration dont le lab n'a pas besoin. Chaque bibliothèque
contient un composant d'exemple (`api.ts`, `auth.ts`…) et son test, exporté par
`public-api.ts`. Supprimez ces huit fichiers :

```bash
rm libs/api/src/lib/api.ts libs/api/src/lib/api.spec.ts
rm libs/auth/src/lib/auth.ts libs/auth/src/lib/auth.spec.ts
rm libs/ui/src/lib/ui.ts libs/ui/src/lib/ui.spec.ts
rm libs/products/src/lib/products.ts libs/products/src/lib/products.spec.ts
```

Le fichier `public-api.ts` de chaque bibliothèque exporte encore le composant supprimé
(`export * from './lib/api';`). Dans `libs/api/src/public-api.ts`, `libs/auth/src/public-api.ts`
et `libs/products/src/public-api.ts`, **supprimez cette ligne `export`** et gardez seulement le
commentaire : ces façades se rempliront aux étapes suivantes. Celle de `libs/ui`, vous la
réécrirez à la section 9.

Côté applications, deux fichiers sont à traiter dans `apps/fo` comme dans `apps/bo`. Supprimez le
test généré, qui vérifie un titre que vous allez remplacer :

```bash
rm apps/fo/src/app/app.spec.ts apps/bo/src/app/app.spec.ts
```

Ensuite, `app.html` contient une page de démonstration de 350 lignes : **videz-le**, dans les deux
applications. Vous le remplirez à la section 10.

Enfin, dans `apps/fo/src/index.html`, remplacez `<html lang="en">` par `<html lang="fr">` et
`<title>Fo</title>` par `<title>MiniShop</title>`. Faites de même dans `apps/bo/src/index.html`,
avec le titre `MiniShop BO`.

> ℹ️ **Et les tests ?** On les retrouvera à l'étape 07 : les composants de ce lab sont générés avec
> `--skip-tests`, et l'étape 07 fournit des squelettes de tests à compléter.

---

## 🔗 6 — Les alias `@shop/*`, vers les sources

Ouvrez `tsconfig.json`, à la racine du workspace. `ng generate library` y a ajouté un alias par
bibliothèque, dans `compilerOptions.paths` :

```json
"paths": {
  "@shop/api": ["./dist/shop/api"],
  "@shop/auth": ["./dist/shop/auth"],
  "@shop/products": ["./dist/shop/products"],
  "@shop/ui": ["./dist/shop/ui"]
},
```

Un alias dit à TypeScript où trouver `import { … } from '@shop/ui'`. Tel que généré, il pointe vers
`dist/`, c'est-à-dire vers la bibliothèque **compilée** : il faudrait alors lancer
`npx ng build @shop/ui` avant chaque build d'application, et relancer ce build à chaque
modification. Pour des bibliothèques internes au workspace, il vaut mieux pointer vers leurs
**sources** : l'application les compile avec son propre code, sans étape intermédiaire. Remplacez le
bloc par celui-ci :

```json
"paths": {
  "@shop/api": ["./libs/api/src/public-api.ts"],
  "@shop/auth": ["./libs/auth/src/public-api.ts"],
  "@shop/products": ["./libs/products/src/public-api.ts"],
  "@shop/ui": ["./libs/ui/src/public-api.ts"]
},
```

Les deux écritures ont chacune leur usage :

| Alias vers | Avantage | Inconvénient | Pour quoi |
|---|---|---|---|
| `./dist/shop/ui` (défaut de la CLI) | l'application consomme exactement le paquet qui serait publié | `ng build @shop/ui` avant chaque build ; en développement, un build `--watch` à côté | une bibliothèque publiée sur un registre npm, versionnée |
| `./libs/ui/src/public-api.ts` | pas d'étape de build, rechargement immédiat | la bibliothèque n'est plus compilée seule : une erreur propre au paquet se voit plus tard | une bibliothèque interne au workspace : notre cas |

> 🏢 **En entreprise.** C'est ce que fait Nx par défaut : ses alias pointent vers les sources
> (`libs/…/src/index.ts`). La [synthèse workspace](https://bngams.github.io/2610-ng/03-intro-workspace/)
> compare les deux outils.

> 📖 [TypeScript : `paths`](https://www.typescriptlang.org/tsconfig/#paths)

---

## 🔌 7 — Un port par application, et des scripts

Les deux applications tourneront en même temps, chacune sur son port : `fo` sur 4200, `bo` sur
4201. Pour ne pas avoir à taper `--port` à chaque fois, on l'écrit dans `angular.json`. Dans le
projet `fo`, la cible `serve` contient `builder`, `configurations` et `defaultConfiguration` ;
ajoutez-lui une clé `options` :

```json
        "serve": {
          "builder": "@angular/build:dev-server",
          "configurations": { … },
          "defaultConfiguration": "development",
          "options": {
            "port": 4200
          }
        },
```

Faites de même dans le projet `bo`, avec `"port": 4201`.

Il reste à donner un raccourci à chaque application. Dans `package.json`, ajoutez deux lignes à la
fin du bloc `"scripts"`, sans oublier la virgule sur la ligne `"test"` qui les précède :

```json
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "fo": "ng serve fo",
    "bo": "ng serve bo"
  },
```

> ℹ️ `npm start` (`ng serve` sans nom de projet) ne sait pas quelle application lancer dans un
> workspace qui en contient deux : utilisez `npm run fo` et `npm run bo`.

---

## 🎨 8 — Installer Angular Material

Une bibliothèque de composants vous évite d'écrire du CSS pour chaque bouton, carte ou champ de
formulaire : vous composez avec des briques déjà accessibles et cohérentes. Angular Material
s'installe avec `ng add`, qui ajoute le paquet **et** configure un projet : dans un workspace, il
faut lui dire lequel, sinon il s'arrête sur `Project name is required.` Installez-le pour `fo` :

```bash
npx ng add @angular/material --project fo
```

La CLI demande de confirmer l'installation (`Y`), puis de choisir une palette de couleurs : gardez
la première, `Azure/Blue`. Elle se termine ainsi :

```
› Found compatible package version: 22.2.2.
...
UPDATE package.json (… bytes)
✔ Packages installed successfully.
CREATE apps/fo/src/material-theme.scss (1179 bytes)
UPDATE angular.json (… bytes)
UPDATE apps/fo/src/index.html (668 bytes)
```

Le paquet est maintenant installé dans le workspace, mais le **thème** n'est configuré que pour
`fo`. Relancez la commande pour `bo`, qui affiche cette fois `Skipping installation: Package
already installed` puis configure le second projet :

```bash
npx ng add @angular/material --project bo
```

Voici ce que `ng add` a fait dans chaque application :

| Fichier | Modification |
|---|---|
| `package.json` | `@angular/material` et `@angular/cdk` en `dependencies` (une seule fois pour tout le workspace) |
| `apps/<app>/src/material-theme.scss` | le thème : couleurs, typographie, densité (le mixin `mat.theme`) |
| `angular.json` | ce fichier de thème ajouté aux `styles` du projet, avant `styles.css` |
| `apps/<app>/src/index.html` | les polices Roboto et Material Symbols |

Pour finir la mise en page, remplacez le contenu de `apps/fo/src/styles.css` par ces lignes, qui
centrent le contenu des pages, puis faites de même dans `apps/bo/src/styles.css` :

```css
main {
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
}
```

> 📖 [Angular Material : démarrer](https://material.angular.dev/guide/getting-started) ·
> [thèmes](https://material.angular.dev/guide/theming)

---

## 🧩 9 — La bibliothèque `ui` : le barrel Material et l'en-tête

Les deux applications auront le même en-tête : un titre, des liens de menu, et à droite un
emplacement libre. Ce composant n'a besoin d'aucune donnée de l'API ni de la session : il vit
dans `@shop/ui`, la bibliothèque des briques d'affichage.

### 9.1 — Le barrel Material

Un **barrel** est un fichier qui ré-exporte d'autres modules, pour qu'on les importe d'un seul
endroit. Ici, il liste les modules Material qu'utilise la boutique : une application écrira
`import { MatButtonModule } from '@shop/ui'`, et la liste des briques Material autorisées reste
visible dans un seul fichier. Créez `libs/ui/src/lib/material.ts` :

```ts
// Les modules Angular Material utilisés par la boutique, réunis en un seul endroit.
// `export *` (et non `export { MatButtonModule }`) : le compilateur Angular a besoin de voir
// aussi les composants et directives que chaque module ré-exporte.
export * from '@angular/material/toolbar';
export * from '@angular/material/button';
export * from '@angular/material/card';
export * from '@angular/material/form-field';
export * from '@angular/material/input';
export * from '@angular/material/badge';
```

### 9.2 — Le contrat d'un lien : `MenuItem`

L'en-tête affiche des liens que chaque application choisit. Il faut donc décrire la forme d'un
lien, et ce type appartient à la bibliothèque qui l'utilise : `ui`. Le champ `visible` est
facultatif ; il servira à l'étape 05 à masquer un lien selon une règle. Créez
`libs/ui/src/lib/models/menu-item.ts` :

```ts
/** Un lien du menu de l'en-tête. */
export interface MenuItem {
  /** Le texte du lien. */
  title: string;
  /** La route visée, par exemple '/catalog'. */
  path: string;
  /** Facultatif : le lien n'est affiché que si cette fonction renvoie true. */
  visible?: () => boolean;
}
```

### 9.3 — Le composant `Header`

Générez le composant dans la bibliothèque, en rangeant le fichier dans
`components/layout/` (la famille, puis un sous-dossier pour la mise en page) :

```bash
npx ng generate component components/layout/header --project @shop/ui --skip-tests
```

La CLI crée trois fichiers dans `libs/ui/src/lib/components/layout/header/` : `header.ts`,
`header.html` et `header.css`. Ouvrez `header.ts` et regardez le sélecteur : `lib-header`. Le
préfixe `lib` vient de la clé `"prefix": "lib"` du projet dans `angular.json` ; c'est le préfixe
par défaut de toute bibliothèque générée (les applications ont `app`). On le garde tel quel :
`lib-…` dit tout de suite, dans un template, que le composant vient d'une bibliothèque.

Le composant reçoit deux `input()` et calcule la liste des liens à afficher. Remplacez le contenu
de `header.ts` par ce squelette et complétez les trois `TODO` :

🚧 **À compléter :**

```ts
import { Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MenuItem } from '../../../models/menu-item';

@Component({
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  selector: 'lib-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  /** Le titre affiché à gauche, lien vers l'accueil. */
  // TODO 1 : un input obligatoire de type string, nommé title

  /** Les liens du menu ; chaque application fournit les siens. */
  // TODO 2 : un input de type MenuItem[], nommé menuItems, qui vaut [] par défaut

  /** Les liens à afficher : ceux qui n'ont pas de règle `visible`, ou dont la règle renvoie true. */
  protected readonly visibleItems = computed(() =>
    // TODO 3 : filtrer this.menuItems() ; un lien sans visible est affiché
    //          (indice : item.visible?.() ?? true)
  );
}
```

Chaque `TODO` se déduit de ce que vous connaissez déjà :

| TODO | Indice |
|---|---|
| 1 | `input.required<string>()` : sans valeur, l'application ne compile pas |
| 2 | `input<MenuItem[]>([])` : la valeur entre parenthèses est la valeur par défaut |
| 3 | `item.visible?.()` appelle la fonction si elle existe, sinon vaut `undefined` ; `?? true` remplace `undefined` par `true` |

Le template affiche une barre Material (`mat-toolbar`), le titre, les liens, puis un **emplacement
libre**, `<ng-content />`. C'est lui qui permettra à chaque application de placer ce qu'elle veut à
droite de l'en-tête (un bouton de panier, un bouton de session) **sans** que `ui` ne connaisse ces
composants. Remplacez le contenu de `header.html` :

```html
<mat-toolbar>
  <a class="title" routerLink="/">{{ title() }}</a>
  <nav>
    @for (item of visibleItems(); track item.path) {
      <a
        mat-button
        [routerLink]="item.path"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: item.path === '/' }"
        >{{ item.title }}</a
      >
    }
  </nav>
  <span class="spacer"></span>
  <!-- l'emplacement libre : chaque application y projette ce qu'elle veut -->
  <ng-content />
</mat-toolbar>
```

Le lien actif est souligné (`routerLinkActive`), et `exact` ne s'applique qu'à l'accueil : sans
lui, `/` serait actif sur toutes les pages. Les styles poussent l'emplacement libre à droite grâce
à un `span` extensible. Remplacez le contenu de `header.css` :

```css
mat-toolbar {
  gap: 8px;
}
.title {
  color: inherit;
  text-decoration: none;
  margin-right: 16px;
}
.spacer {
  flex: 1;
}
.active {
  text-decoration: underline;
}
```

> ⚠️ **Piège : importer le barrel depuis l'intérieur de la bibliothèque.** On pourrait écrire, dans
> `header.ts`, `import { MatToolbarModule } from '../../../material'`. Essayez si vous voulez :
> - *Symptôme :* `npx ng build fo` échoue sur
>   `Could not resolve "../../../../../../../node_modules/@angular/material/types/toolbar"`.
> - *Cause :* importé par un **chemin relatif**, le module Material oblige le compilateur à
>   fabriquer un chemin relatif vers les fichiers de types de Material, que le bundler ne sait pas
>   charger.
> - *Correctif :* à l'intérieur de `ui`, importez Material directement (`@angular/material/toolbar`),
>   comme dans le squelette. Le barrel sert aux **autres** projets, qui l'importent par l'alias
>   `@shop/ui` : là, tout fonctionne.

### 9.4 — La façade de `ui`

Un fichier de bibliothèque n'est visible des applications que s'il est exporté par sa façade.
Remplacez le contenu de `libs/ui/src/public-api.ts` :

```ts
/*
 * Public API Surface of ui
 */

export * from './lib/material';
export * from './lib/models/menu-item';
export * from './lib/components/layout/header/header';
```

> 📖 [Projection de contenu, `<ng-content>`](https://angular.dev/guide/components/content-projection) ·
> [`input()`](https://angular.dev/guide/components/inputs) ·
> [`computed`](https://angular.dev/guide/signals#computed-signals)

---

## 🏠 10 — Les pages et l'en-tête dans chaque application

Chaque application a besoin de deux pages pour commencer : un accueil et une page « introuvable ».
On les range dans `pages/`, la famille des composants routés. Générez-les dans `fo` :

```bash
npx ng generate component pages/home --project fo --skip-tests
npx ng generate component pages/not-found --project fo --skip-tests
```

Générez ensuite les deux mêmes pages dans `bo`, avec les mêmes chemins :

```bash
npx ng generate component pages/home --project bo --skip-tests
npx ng generate component pages/not-found --project bo --skip-tests
```

### 10.1 — Les pages du FO

L'accueil commence par un commentaire : c'est l'emplacement réservé à une bannière, qui viendra
avec l'étape 08. Remplacez le contenu de `apps/fo/src/app/pages/home/home.html` :

```html
<!-- emplacement réservé : une bannière viendra ici (étape 08) -->
<h1>Bienvenue sur MiniShop</h1>
<p>La boutique : parcourez le catalogue, remplissez votre panier, passez commande.</p>
```

La page introuvable propose un lien de retour, en bouton Material. C'est la première fois qu'une
application importe le barrel par son alias : `MatButtonModule` vient de `@shop/ui`. Remplacez le
contenu de `apps/fo/src/app/pages/not-found/not-found.ts` :

```ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@shop/ui';

@Component({
  imports: [RouterLink, MatButtonModule],
  selector: 'app-not-found',
  styleUrl: './not-found.css',
  templateUrl: './not-found.html',
})
export class NotFound {}
```

Son template, `not-found.html`, n'a qu'un titre et ce lien :

```html
<h1>Page introuvable</h1>
<p><a mat-button routerLink="/">Retour à l'accueil</a></p>
```

### 10.2 — Les routes et le composant racine du FO

Les deux pages deviennent deux routes : l'accueil sur le chemin vide, et la page introuvable pour
tout le reste (`**`, qui doit rester la dernière). Remplacez le contenu de
`apps/fo/src/app/app.routes.ts` :

```ts
import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { NotFound } from './pages/not-found/not-found';

export const routes: Routes = [
  { path: '', component: Home },
  { path: '**', component: NotFound },
];
```

Le composant racine importe `Header` et `MenuItem` depuis `@shop/ui`, par l'alias, jamais par un
chemin relatif qui remonterait dans `libs/`. Il déclare le menu de l'application. Remplacez le
contenu de `apps/fo/src/app/app.ts` :

```ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header, MenuItem } from '@shop/ui';

@Component({
  imports: [RouterOutlet, Header],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly menu: MenuItem[] = [{ title: 'Accueil', path: '/' }];
}
```

Le template, que vous avez vidé à la section 5, place l'en-tête au-dessus des pages. L'attribut
`title` est une valeur fixe, `[menuItems]` une liaison vers le champ `menu`. Écrivez dans
`apps/fo/src/app/app.html` :

```html
<lib-header title="MiniShop" [menuItems]="menu" />
<main>
  <router-outlet />
</main>
```

### 10.3 — Le BO, même schéma

Le back-office suit exactement le même schéma, avec ses propres textes. Faites les quatre gestes
dans `apps/bo/src/app/` :

1. `pages/home/home.html` : le même commentaire en première ligne, puis
   `<h1>Back-office</h1>` et `<p>L'espace des administrateurs de la boutique.</p>` ;
2. `pages/not-found/not-found.ts` et `not-found.html` : identiques à ceux du FO ;
3. `app.routes.ts` et `app.ts` : identiques à ceux du FO ;
4. `app.html` : identique, avec `title="MiniShop BO"`.

> 📖 [Routes](https://angular.dev/guide/routing/define-routes) ·
> [`ng generate component`](https://angular.dev/cli/generate/component)

---

## 🚀 11 — Compiler et lancer les deux applications

Commencez par compiler chaque application : c'est la vérification la plus rapide que les alias,
le barrel et l'en-tête sont bien branchés.

```bash
npx ng build fo
npx ng build bo
```

Chaque build se termine par une ligne de ce type, et chaque application a son dossier de sortie
dans `dist/` :

```
Application bundle generation complete. [1.131 seconds]

Output location: …/shop/dist/fo
```

Lancez ensuite les deux applications, chacune dans son terminal. Ouvrez le **terminal 2**, placez-le
dans `shop/`, et lancez le FO :

```bash
npm run fo
```

Ouvrez de même le **terminal 3**, dans `shop/`, et lancez le BO :

```bash
npm run bo
```

> 💡 **Tester :** http://localhost:4200 affiche une barre « MiniShop » avec le lien « Accueil »
> souligné, puis « Bienvenue sur MiniShop ». http://localhost:4201 affiche « MiniShop BO » et
> « Back-office ». Une adresse inconnue, http://localhost:4200/nimporte, affiche « Page
> introuvable » et le bouton de retour. L'onglet du navigateur porte le titre « MiniShop ».

Gardez le serveur du FO lancé (terminal 2) pour l'étape suivante ; celui du BO peut être arrêté
(`Ctrl-C` dans le terminal 3) : on y revient à l'étape 06.

---

## 🎉 Challenge final

- [ ] `angular.json` déclare six projets : `fo`, `bo`, `@shop/api`, `@shop/auth`, `@shop/ui`,
      `@shop/products`.
- [ ] Les alias de `tsconfig.json` pointent vers `libs/*/src/public-api.ts`.
- [ ] `npx ng build fo` et `npx ng build bo` réussissent.
- [ ] Les deux applications affichent le **même** en-tête, venu de `@shop/ui`, avec leur propre
      titre.

## ✅ Bonus

- Ajoutez au menu du FO un second lien, `{ title: 'Introuvable', path: '/nimporte' }`, et observez
  le soulignement passer d'un lien à l'autre. Retirez-le ensuite : le vrai menu se construit aux
  étapes suivantes.
- Ouvrez `angular.json` et retrouvez, pour chaque projet, `projectType` (`application` ou
  `library`), `root` et `prefix`.

## 🧠 Récap

- Un **workspace** réunit plusieurs projets autour d'un seul `angular.json`, d'un seul
  `package.json` et d'un seul `node_modules`. `ng new --no-create-application` crée le contenant,
  et `ng generate application|library --project-root` range les projets.
- Une bibliothèque s'importe par son **alias** `@shop/…` ; quand cet alias pointe vers les sources,
  aucune étape de build intermédiaire n'est nécessaire.
- Le **barrel** Material de `ui` sert aux autres projets ; à l'intérieur de `ui`, on importe Material
  directement.
- L'en-tête reçoit ses données par `input()` et laisse un **emplacement** `<ng-content>` : il ne
  connaît rien des applications qui l'utilisent.

---

➡️ [02 — L'API et le catalogue](02-API-CATALOGUE.md)
