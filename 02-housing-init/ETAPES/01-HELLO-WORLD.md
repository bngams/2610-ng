# 01 — Hello world : créer le projet et le faire tourner

> Vous créez le projet `homes` avec la CLI, vous le lancez, vous faites le tour des fichiers
> générés, puis vous affichez votre premier « Hello world ». Si ça s'affiche, votre environnement
> est prêt pour les 13 étapes suivantes.

## ✨ Ce que vous apprenez

- `ng new` crée un projet complet ; `ng serve` le compile et le sert sur http://localhost:4200.
- À quoi servent `src/`, `app/`, `public/`, `angular.json`, `package.json`, `tsconfig.*`, `node_modules/`.
- Le composant racine `App` (`src/app/app.ts`) : c'est lui qui s'affiche dans `index.html`.

> 📖 Étape officielle : [01-hello-world](https://angular.dev/tutorials/first-app/01-hello-world) ·
> [Créer une application avec la CLI](https://angular.dev/tools/cli/setup-local)

## 🧱 1 — Créer le projet

Ouvrez un terminal, placez-vous dans le dossier où vous rangez vos projets, puis créez `homes` :

```bash
ng new homes --defaults --inline-template --skip-tests
```

| Option | Rôle |
|---|---|
| `--defaults` | ne pose aucune question : CSS, pas de rendu serveur, pas de fichiers de configuration IA |
| `--inline-template` | le HTML d'un composant est écrit **dans** son fichier `.ts` (`template:`), comme dans le tutoriel officiel et dans la synthèse du matin, au lieu d'un fichier `.html` à part |
| `--skip-tests` | pas de fichiers de test `.spec.ts` : ils ne sont pas le sujet aujourd'hui |

La commande liste ce qu'elle crée (`CREATE homes/angular.json`, `CREATE homes/src/app/app.ts`…) puis
installe les dépendances : comptez une à deux minutes. Ensuite :

```bash
cd homes
ng serve
```

> 💡 **Tester :** le terminal affiche `Application bundle generation complete` puis
> `➜ Local: http://localhost:4200/`. Ouvrez cette adresse : la page affiche **Hello, homes**.
> Laissez `ng serve` tourner dans ce terminal : à chaque fichier enregistré, il recompile et
> recharge le navigateur. Ouvrez un **second terminal** pour les commandes suivantes, et faites-y aussi `cd homes`.

## 📁 2 — Visite des fichiers du projet

Ouvrez le dossier `homes` dans votre éditeur (VS Code : `code .` depuis le second terminal). Voici ce
que la CLI a généré, et à quoi ça sert :

```
homes/
├── src/                      <- TOUT votre code
│   ├── index.html            <- la seule page HTML ; elle contient <app-root>, c'est là que l'app se greffe
│   ├── styles.css            <- la feuille de styles globale (vide pour l'instant)
│   ├── main.ts               <- le point d'entrée : bootstrapApplication(App, appConfig)
│   └── app/
│       ├── app.ts            <- le composant racine App (sélecteur app-root) : son code ET son template
│       ├── app.css           <- les styles de ce composant (vide)
│       ├── app.config.ts     <- la configuration de l'app : provideRouter(routes)… (vous la lirez à l'étape 10)
│       └── app.routes.ts     <- la liste des routes, vide pour l'instant (étape 10)
├── public/
│   └── favicon.ico           <- les fichiers statiques : tout ce qui est ici est servi à la racine du site
├── angular.json              <- décrit le projet à la CLI (où est le code, comment le compiler)
├── package.json              <- les dépendances npm et les scripts (npm start = ng serve)
├── tsconfig.json, tsconfig.app.json   <- la configuration du compilateur TypeScript
├── .vscode/, .editorconfig, .prettierrc, README.md, package-lock.json, tsconfig.spec.json
│                              <- configuration d'éditeur, de git et de npm : à ignorer
├── node_modules/             <- les paquets installés par npm : on n'y touche jamais, on ne le partage jamais
└── .angular/                 <- le cache de compilation, créé au premier ng serve (jamais partagé non plus)
```

Ouvrez `src/app/app.ts` : vous retrouvez le `@Component` de la synthèse, avec `selector: 'app-root'`
(la balise utilisée dans `index.html`), `template:` (le HTML affiché) et `styleUrl` (le CSS). Le
« Hello, homes » que vous voyez vient de la ligne `<h1>Hello, {{ title() }}</h1>`.

## ✏️ 3 — Hello world

Trois fichiers à modifier et deux images à copier. Dans `src/index.html`, le titre vaut déjà `<title>Homes</title>` (la CLI
l'a déduit du nom du projet) ; ajoutez la police utilisée par le tutoriel, juste avant `</head>` :

```html
  <link
    href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,700;1,400;1,700&display=swap"
    rel="stylesheet"
  />
```

Puis **remplacez tout le contenu** de `src/app/app.ts` par :

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  template: `<h1>Hello world!</h1>`,
  styleUrl: './app.css',
})
export class App {
  title = 'homes';
}
```

Par rapport au fichier généré, vous avez enlevé `signal` et `RouterOutlet` (vous les retrouverez :
le routeur est le sujet de l'étape 10) et remplacé le template.

Enfin les styles globaux et les deux images : l'éditeur en ligne du tutoriel les pré-remplit, en
local c'est vous qui les copiez. **Remplacez tout le contenu** de `src/styles.css` par celui de
[`assets/01/styles.css`](../assets/01/styles.css), c'est-à-dire :

```css
/* You can add global styles to this file, and also import other style files */
* {
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Be Vietnam Pro', sans-serif;
}
:root {
  --primary-color: #605DC8;
  --secondary-color: #8B89E6;
  --accent-color: #e8e7fa;
  --shadow-color: #E8E8E8;
}

button.primary {
  padding: 10px;
  border: solid 1px var(--primary-color);
  background: var(--primary-color);
  color: white;
  border-radius: 8px;
}
```

Et copiez [`assets/01/logo.svg`](../assets/01/logo.svg) et [`assets/01/location-pin.svg`](../assets/01/location-pin.svg) dans le dossier `public/` du projet,
à côté de `favicon.ico` (ils serviront aux étapes 2 et 3).

> 💡 **Tester :** le navigateur s'est rechargé tout seul et affiche **Hello world!** en police
> « Be Vietnam Pro », avec « Homes » dans l'onglet. Pour vérifier les images :
> http://localhost:4200/logo.svg affiche le logo.

## ⚠️ Pièges

> ⚠️ **`ng : command not found` / `Please update your Node.js version`.**
> Symptôme : la commande `ng` n'existe pas, ou refuse de démarrer.
> Cause : la CLI n'est pas installée, ou Node est trop ancien (il faut 22.22 ou 24.15 minimum).
> Correctif : `node -v`, puis `nvm use 24` si besoin, puis `npm install -g @angular/cli@22`.

> ⚠️ **`Port 4200 is already in use`.**
> Symptôme : `ng serve` s'arrête aussitôt avec ce message.
> Cause : un autre `ng serve` tourne encore (un autre terminal, un autre projet).
> Correctif : arrêtez-le (Ctrl+C dans son terminal) ou lancez `ng serve --port 4300`.

> ⚠️ **La page ne change pas après une modification.**
> Symptôme : vous enregistrez, rien ne bouge.
> Cause : `ng serve` n'est plus lancé, ou le fichier n'est pas enregistré.
> Correctif : regardez le terminal de `ng serve` : il doit afficher `Changes detected. Rebuilding...`
> à chaque enregistrement ; relancez-le si besoin.

## Récap

- `ng new` + `ng serve` : un projet qui tourne en deux commandes ; `src/app/app.ts` est le composant racine.
- `public/` est servi à la racine : `public/logo.svg` se charge avec `/logo.svg`.
- Un composant = `selector` + `template` + `styleUrl` + une classe.

➡️ [02 — Le composant Home](02-HOME.md)
