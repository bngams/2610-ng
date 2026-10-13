# 17 — L'URL de l'API dans `environment.ts` (facultative)

> **Étape facultative.** Faites-la si vous avez terminé l'étape 16 en avance ; le reste du lab n'en
> dépend pas.
>
> L'adresse de l'API, `http://localhost:3000/locations`, est écrite en dur dans `HousingService`.
> Or une application ne parle pas à la même API sur votre poste et une fois en ligne. Angular
> prévoit pour cela des **fichiers d'environnement** : un fichier par configuration de build, et la
> CLI choisit le bon au moment de compiler. C'est la dernière notion de la démo de ce matin ; vous
> la pratiquez ici sur une seule valeur, `apiUrl`.

## ✨ Ce que vous apprenez

- `ng generate environments` : les deux fichiers créés et le remplacement que la CLI écrit dans `angular.json`.
- Lire une valeur d'environnement dans un service.
- Vérifier quel fichier `ng serve` et `ng build` utilisent vraiment.
- Ce qu'il ne faut **jamais** mettre dans un fichier d'environnement.

> 📖 [Les environnements de build](https://angular.dev/tools/cli/environments) ·
> [La configuration du workspace (`angular.json`)](https://angular.dev/reference/configs/workspace-config)

## 🧱 1 — Générer les fichiers d'environnement

Dans le second terminal, à la racine du projet, lancez le générateur :

```bash
ng generate environments
```

La CLI crée deux fichiers dans un nouveau dossier `src/environments/`, et modifie `angular.json` :

```
CREATE src/environments/environment.ts (31 bytes)
CREATE src/environments/environment.development.ts (31 bytes)
UPDATE angular.json (2730 bytes)
```

Les deux fichiers ont pour l'instant le même contenu, un objet vide :

```ts
export const environment = {};
```

La modification d'`angular.json` est ce qui relie les deux. Ouvrez-le et cherchez
`"development"` dans la partie `"build"` : la CLI y a ajouté un bloc `fileReplacements`.

```json
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true,
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.development.ts"
                }
              ]
            }
```

| Morceau | Rôle |
|---|---|
| `environment.ts` | le fichier que votre code importe toujours ; c'est aussi la valeur utilisée en **production** |
| `environment.development.ts` | la valeur utilisée pendant le développement |
| `fileReplacements` | en configuration `development`, la CLI compile `environment.development.ts` **à la place** de `environment.ts` |
| `"defaultConfiguration"` | regardez-le dans `angular.json` : `"production"` pour `build`, `"development"` pour `serve`. Donc `ng build` garde `environment.ts`, et `ng serve` utilise `environment.development.ts` |

> ℹ️ La CLI a aussi reformaté la ligne `"styles"` d'`angular.json` sur une seule ligne. Ce n'est
> qu'une mise en forme, le contenu est identique.

⚠️ `ng serve` lit `angular.json` **une seule fois**, au démarrage. Le remplacement que vous venez
d'ajouter ne sera donc pas appliqué tant que vous n'aurez pas redémarré le serveur. Dans le
terminal de `ng serve`, faites Ctrl+C puis relancez `ng serve`.

## ✏️ 2 — Une valeur `apiUrl` dans chaque fichier

Chaque fichier reçoit maintenant la même propriété, `apiUrl` : l'adresse de base de l'API, sans le
`/locations`. **Remplacez tout le contenu** de `src/environments/environment.ts` par celui-ci :

```ts
export const environment = {
  apiUrl: 'http://localhost:3000',
};
```

Faites de même pour `src/environments/environment.development.ts`, avec ce contenu :

```ts
export const environment = {
  apiUrl: 'http://localhost:3000',
};
```

Les deux valeurs sont identiques ici, car vous n'avez qu'une API, sur votre poste. Le mécanisme
prend son sens le jour où l'application est mise en ligne : `environment.ts` contiendrait alors
l'adresse de l'API publique, par exemple `https://api.example.com`, et `ng build` la mettrait dans
le livrable sans que vous touchiez au code. Les deux fichiers doivent toujours avoir **les mêmes
propriétés** : le code ne connaît que `environment.ts`, une propriété absente de l'autre fichier
ferait échouer la compilation en développement.

## 🔌 3 — Le service lit `environment.apiUrl`

Dans `src/app/housing.service.ts`, ajoutez cet import sous celui de `HousingLocationInfo`. Le
chemin remonte d'un dossier (`app/` vers `src/`) puis descend dans `environments/` :

```ts
import { environment } from '../environments/environment';
```

Remplacez ensuite la ligne `readonly url = 'http://localhost:3000/locations';` par celle-ci, qui
construit la même adresse à partir de l'environnement :

```ts
  readonly url = `${environment.apiUrl}/locations`;
```

| Morceau | Rôle |
|---|---|
| `'../environments/environment'` | toujours ce fichier-là, jamais `environment.development` : c'est la CLI qui fait l'échange selon la configuration |
| `` `${environment.apiUrl}/locations` `` | des accents graves (*backticks*), pas des apostrophes : c'est un gabarit de chaîne, comme à l'étape 14 |

> 💡 **Tester :** l'application fonctionne comme avant : 10 cartes, et la console affiche toujours
> `GET http://localhost:3000/locations => 200 (…)`, grâce à l'intercepteur de l'étape 16.

## 🧪 4 — Vérifier quel fichier est utilisé

Avec deux valeurs identiques, impossible de voir lequel des deux fichiers est lu. Pour en avoir le
cœur net, donnez provisoirement une **fausse** adresse au fichier de développement, puis comparez
`ng serve` et `ng build`.

> **🧪 Manip — `ng serve` lit le fichier de développement, `ng build` celui de production**
>
> 1. Dans `environment.development.ts`, remplacez `3000` par `3999` (un port où rien n'écoute),
>    et enregistrez.
> 2. Rechargez la page servie par `ng serve`.
> 3. Dans le second terminal, lancez `ng build`, puis cherchez l'adresse de l'API dans le fichier
>    produit : ouvrez `dist/homes/browser/main-XXXXXXXX.js` (le nom contient un code qui change à
>    chaque build) dans votre éditeur et cherchez `localhost:3`. Sur macOS, Linux ou Git Bash :
>    `grep -o "localhost:3[0-9]*" dist/homes/browser/main-*.js`.
>
> *Observé : au point 2, plus aucune carte. La console affiche trois lignes : l'erreur réseau
> `Failed to load resource: net::ERR_CONNECTION_REFUSED`, puis la ligne de votre intercepteur
> `GET http://localhost:3999/locations => 0 (2 ms)` (le code `0` signifie : pas de réponse du
> tout), puis l'erreur Angular `ERROR {… status: 0, statusText: Unknown Error …}`. Au point 3,
> `ng build` se termine par `Output location: …/homes/dist/homes`, et le fichier de production
> contient `localhost:3000` : `ng build` a bien gardé `environment.ts`.*
>
> Remettez `3000` dans `environment.development.ts` avant de continuer, et vérifiez que les
> 10 cartes reviennent.

## 🔒 5 — Rien de secret dans un fichier d'environnement

Le point 3 de la manip vous l'a montré : la valeur d'environnement se retrouve **en clair** dans le
JavaScript livré au navigateur. N'importe quel visiteur peut l'y lire, avec F12. Un fichier
d'environnement Angular sert donc à des valeurs de **configuration publique** (une URL d'API, un
interrupteur de fonctionnalité), jamais à des secrets.

| Dans `environment.ts` | Jamais dans `environment.ts` |
|---|---|
| l'URL publique de l'API | un mot de passe, une clé d'API privée, un jeton d'accès |
| un nom d'application, un drapeau `production` | la chaîne de connexion d'une base de données |

Un secret reste côté serveur : c'est l'API qui le détient, et l'application l'obtient, si besoin,
après authentification de l'utilisateur.

> ℹ️ Vous avez peut-être déjà vu des fichiers `.env` dans des projets Node, React ou Vite. Ce n'est
> **pas** le mécanisme d'Angular : la CLI ne lit pas de `.env`, et un `.env` ne rendrait pas une
> valeur secrète une fois compilée dans le front. Le mécanisme Angular, ce sont ces fichiers
> d'environnement et le `fileReplacements` d'`angular.json`.

## ⚠️ Pièges

> ⚠️ **`ng serve` utilise toujours la valeur de `environment.ts`.**
> Symptôme : la manip de la partie 4 ne change rien, les 10 cartes restent.
> Cause : `ng serve` a été lancé avant `ng generate environments` ; il n'a pas relu `angular.json`.
> Correctif : Ctrl+C dans le terminal de `ng serve`, puis relancez `ng serve`.

> ⚠️ **`TS2339: Property 'apiUrl' does not exist on type '{}'`.**
> Symptôme : erreur dans le terminal de `ng serve`, sur la ligne `readonly url = …` du service.
> Cause : un des deux fichiers est resté `export const environment = {};`. En développement, la CLI
> compile `environment.development.ts` : s'il n'a pas `apiUrl`, le service ne compile pas.
> Correctif : la même propriété `apiUrl` dans les deux fichiers (partie 2).

> ⚠️ **`ng build` contient l'adresse de développement.**
> Symptôme : à la manip de la partie 4, le fichier de production contient `localhost:3999`.
> Cause : le service importe `'../environments/environment.development'` (souvent une
> auto-importation de l'éditeur). Ce fichier n'est jamais remplacé, il est donc utilisé partout.
> Correctif : importez toujours `'../environments/environment'`.

## Récap

- `ng generate environments` : `environment.ts` (production), `environment.development.ts`, et un `fileReplacements` dans `angular.json`.
- Le code importe toujours `environment.ts` ; la CLI fait l'échange selon la configuration (`ng serve` => development, `ng build` => production).
- Tout ce qui est dans un fichier d'environnement finit en clair dans le bundle : configuration publique uniquement.
- Vous avez maintenant `HttpClient`, deux intercepteurs, et une URL d'API configurable. Il reste à remplacer le formulaire de l'étape 12 par un vrai dossier de candidature.

➡️ [18 — Le dossier de candidature](18-DOSSIER.md)
