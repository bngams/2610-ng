# 02 — Housing, premiers pas : le tutoriel « first app » en français

> **Scénario à réaliser en autonomie.** Vous construisez *Homes*, une petite application de
> recherche de logements : une liste de cartes, une recherche par ville, une page de détail et un
> formulaire de candidature, d'abord sur des données en dur, puis sur une vraie API locale. Les
> étapes 1 à 14 sont la version française du tutoriel officiel
> [« Build your first Angular app »](https://angular.dev/tutorials/first-app) d'angular.dev : à
> chaque étape, le lien vers la page officielle est donné, vous pouvez l'ouvrir en parallèle. Les
> étapes 15 à 17 vous font ensuite pratiquer, sur ce même projet, la démo de ce matin :
> `HttpClient`, les intercepteurs et les fichiers d'environnement. L'étape 18 remplace enfin le
> formulaire de candidature par un vrai dossier en trois écrans, validé, et envoyé à l'API. Vous écrivez le code vous-même,
> en complétant les `// TODO` ; le dossier `solution/` est là en dernier recours.

> **Niveau : débutant.** Ce lab suppose la matinée : la [synthèse des syntaxes](../00-intro-syntax-recap/index.html)
> et le [lab Intro](../01-lab-intro/) (un composant, `@for`, `input()`/`output()`, un service avec
> `inject()`, un signal). Il **ne suppose pas** le routing (la synthèse n'en donne qu'un aperçu), les formulaires ni HTTP : ces trois
> notions sont introduites ici, pas à pas. `HttpClient`, les intercepteurs et les environnements
> n'ont été vus qu'en démonstration : les étapes 15 à 17 les reprennent geste par geste. Il ne
> suppose pas non plus que vous sachiez créer un projet Angular : la première étape le fait avec
> vous, fichier par fichier.

## ✨ Objectifs

- Créer un projet avec la CLI Angular (`ng new`, `ng generate`) et savoir à quoi sert chaque fichier.
- Découper l'écran en composants (`App` > `Home` > `HousingLocation`), typer les données avec une interface.
- Faire circuler la donnée : `input.required()`, liaison de propriété `[prop]`, interpolation `{{ }}`, `@for`.
- Sortir la donnée dans un service injecté avec `inject()`.
- **Nouveau cet après-midi** : naviguer entre deux pages avec le routeur (`routerLink`, `:id`,
  `ActivatedRoute`), saisir des données avec un formulaire réactif, puis lire les données d'une API
  locale (`json-server`) avec `fetch`.
- **Pratiquer la démo du matin** : passer à `HttpClient` et `toSignal`, écrire deux intercepteurs
  (un journal des requêtes, un indicateur de chargement), puis sortir l'URL de l'API dans
  `environment.ts` (facultatif).
- **Aller au bout des formulaires réactifs** : un dossier de candidature en trois écrans, typé
  (`NonNullableFormBuilder`), avec groupes imbriqués, `FormArray`, validateurs (dont un écrit par
  vous), messages d'erreur, et un envoi `POST` à l'API ; puis le pont `toSignal(statusChanges)`
  vers les signals.

## 🚀 Prérequis

Angular 22 demande **Node.js 22.22 ou 24.15 minimum** et une connexion internet (les photos des
logements sont chargées depuis `angular.dev`, et `npm` télécharge les paquets). Vérifiez d'abord
votre version de Node, puis installez la CLI Angular, une seule fois sur votre machine :

```bash
node -v                              # si < 22.22 : nvm install 24 && nvm use 24
npm install -g @angular/cli@22       # la CLI Angular, une seule fois ; vérifiez avec : ng version
```

> ⚠️ **Piège : `nvm use` ne vaut que pour le terminal courant.** Symptôme : `ng` répond
> `Please update your Node.js version` dans un nouveau terminal. Cause : le terminal est revenu au
> Node par défaut. Correctif : refaire `nvm use 24`, ou fixer le défaut avec `nvm alias default 24`.

> ℹ️ Si vous ne pouvez pas installer de paquet global, remplacez `ng new …` par
> `npx -y @angular/cli@22 new …`, puis, **dans le dossier du projet**, `ng …` par `npx ng …` : la
> CLI est aussi installée localement dans chaque projet.

## 📁 Ce que vous allez construire

Vous partez d'un projet vide créé par `ng new`. Voici l'arborescence que vous obtiendrez à la fin
de l'étape 18 (seuls les fichiers que vous touchez sont listés) :

```
homes/
├── api/
│   └── db.json                        <- la base de l'API locale (étape 14), + la collection applications (étape 18)
├── public/
│   ├── favicon.ico
│   ├── logo.svg                       <- copiés depuis assets/01 (étape 1)
│   └── location-pin.svg
├── src/
│   ├── index.html                     <- titre + police (étape 1)
│   ├── styles.css                     <- styles globaux (étape 1)
│   ├── main.ts                        <- le démarrage, vous n'y touchez pas
│   ├── environments/                  <- environment.ts, environment.development.ts : apiUrl (étape 17, facultative)
│   └── app/
│       ├── app.ts, app.css            <- le composant racine App : en-tête, <router-outlet>, « Loading… » (étapes 1, 2, 10, 16)
│       ├── app.config.ts              <- provideRouter(routes) écrit par la CLI, puis provideHttpClient (étapes 15, 16)
│       ├── app.routes.ts              <- vos deux routes (étape 10)
│       ├── housinglocation.ts         <- l'interface HousingLocationInfo (étape 4)
│       ├── housing.service.ts         <- HousingService : les données, puis l'API (étapes 9, 12, 14, 15, 17, 18)
│       ├── application.ts             <- les interfaces Application et Guarantor : un dossier (étape 18)
│       ├── logging-interceptor.ts     <- le journal des requêtes (étape 16)
│       ├── loading-interceptor.ts     <- compte les requêtes en cours (étape 16)
│       ├── loading.service.ts         <- LoadingService : le compteur partagé (étape 16)
│       ├── home/home.ts, home.css     <- la liste + la recherche (étapes 2 à 9, 13, 14, 15)
│       ├── housing-location/…         <- une carte (étapes 3, 5, 7, 11)
│       ├── details/…                  <- la page de détail (étapes 10 à 12, 14, 15, 18)
│       └── application-form/…         <- ApplicationForm : le dossier de candidature en trois écrans (étape 18)
├── angular.json                       <- le fileReplacements ajouté par la CLI (étape 17)
└── package.json                       <- scripts start, build, api
```

À la fin, l'écran ressemblera à ceci ; à droite, chaque zone est annotée avec le composant qui
l'affiche et l'étape qui la construit :

```
┌─────────────────────────────────────────────────────────────┐
│ [logo Homes]                                                │  <- App : l'en-tête, cliquable => retour à l'accueil
├─────────────────────────────────────────────────────────────┤
│ [ Filter by city      ] (Search)                            │  <- Home : la recherche (étape 13)
│ ┌──────────────────────┐ ┌──────────────────────┐           │
│ │ photo                │ │ photo                │           │  <- HousingLocation : une carte par logement (@for)
│ │ Acme Fresh Start …   │ │ A113 Transitional …  │           │
│ │ 📍 Chicago, IL       │ │ 📍 Santa Monica, CA  │           │
│ │ Learn More ›         │ │ Learn More ›         │           │  <- routerLink => /details/:id (étape 11)
│ └──────────────────────┘ └──────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 🧭 Les 18 étapes

Les étapes 1 à 14 suivent **une pour une** celles du tutoriel officiel ; les étapes 15 à 18 vont
au-delà, et la dernière colonne donne alors la page du guide angular.dev correspondante. La colonne
« Fichiers » indique ce que vous créez ou modifiez, avec les noms de fichiers d'Angular 22
(`app.ts`, `home.ts`…).

| Étape | Vous apprenez | Fichiers | Officiel / doc |
|---|---|---|---|
| [01 — Hello world](ETAPES/01-HELLO-WORLD.md) | `ng new`, `ng serve`, les fichiers du projet | `index.html`, `styles.css`, `app.ts`, `public/` | [hello-world](https://angular.dev/tutorials/first-app/01-hello-world) |
| [02 — Le composant Home](ETAPES/02-HOME.md) | `ng generate component`, utiliser un composant | `home/` (+ `home.css` depuis `assets/02`), `app.ts`, `app.css` (depuis `assets/02`) | [02-Home](https://angular.dev/tutorials/first-app/02-Home) |
| [03 — Le composant HousingLocation](ETAPES/03-HOUSING-LOCATION.md) | un composant dans un composant | `housing-location/`, `home.ts` | [03-HousingLocation](https://angular.dev/tutorials/first-app/03-HousingLocation) |
| [04 — L'interface](ETAPES/04-INTERFACES.md) | `ng generate interface`, typer une donnée | `housinglocation.ts`, `home.ts` | [04-interfaces](https://angular.dev/tutorials/first-app/04-interfaces) |
| [05 — L'input](ETAPES/05-INPUTS.md) | `input.required()` | `housing-location.ts`, `home.ts` | [05-inputs](https://angular.dev/tutorials/first-app/05-inputs) |
| [06 — La liaison de propriété](ETAPES/06-PROPERTY-BINDING.md) | `[prop]="valeur"` | `home.ts` | [06-property-binding](https://angular.dev/tutorials/first-app/06-property-binding) |
| [07 — L'interpolation](ETAPES/07-DYNAMIC-TEMPLATE-VALUES.md) | `{{ }}`, lire un input | `housing-location.ts` | [07-dynamic-template-values](https://angular.dev/tutorials/first-app/07-dynamic-template-values) |
| [08 — La liste avec @for](ETAPES/08-NGFOR.md) | `@for`, `track` | `home.ts` | [08-ngFor](https://angular.dev/tutorials/first-app/08-ngFor) |
| [09 — Le service](ETAPES/09-SERVICES.md) | `ng generate service`, `@Injectable`, `inject()` | `housing.service.ts`, `home.ts` | [09-services](https://angular.dev/tutorials/first-app/09-services) |
| [10 — Les routes](ETAPES/10-ROUTING.md) | `Routes`, `<router-outlet>`, `routerLink` | `details/`, `app.routes.ts`, `app.ts` | [10-routing](https://angular.dev/tutorials/first-app/10-routing) |
| [11 — La page de détail](ETAPES/11-DETAILS-PAGE.md) | `:id`, `ActivatedRoute` | `housing-location.ts`, `details.ts`, `details.css` (depuis `assets/11`) | [11-details-page](https://angular.dev/tutorials/first-app/11-details-page) |
| [12 — Le formulaire](ETAPES/12-FORMS.md) | `FormGroup`, `FormControl`, `(submit)` | `housing.service.ts`, `details.ts` | [12-forms](https://angular.dev/tutorials/first-app/12-forms) |
| [13 — La recherche](ETAPES/13-SEARCH.md) | variable de template `#filter`, `(click)`, `filter()` | `home.ts` | [13-search](https://angular.dev/tutorials/first-app/13-search) |
| [14 — HTTP](ETAPES/14-HTTP.md) | `json-server`, `fetch`, `async`/`await` | `package.json`, `api/db.json`, `housing.service.ts`, `home.ts`, `details.ts` | [14-http](https://angular.dev/tutorials/first-app/14-http) |
| [15 — Passer à HttpClient](ETAPES/15-HTTPCLIENT.md) | `provideHttpClient()`, `Observable`, `toSignal`, `signal` + `computed` | `app.config.ts`, `housing.service.ts`, `home.ts`, `details.ts` | [http/setup](https://angular.dev/guide/http/setup) |
| [16 — Un premier intercepteur](ETAPES/16-INTERCEPTEUR.md) | `ng generate interceptor`, `withInterceptors`, `tap`/`finalize`, l'ordre des intercepteurs | `logging-interceptor.ts`, `loading-interceptor.ts`, `loading.service.ts`, `app.config.ts`, `app.ts`, `app.css` | [http/interceptors](https://angular.dev/guide/http/interceptors) |
| [17 — L'URL de l'API dans `environment.ts`](ETAPES/17-ENVIRONNEMENTS.md) *(facultative)* | `ng generate environments`, `fileReplacements`, rien de secret dans le front | `environments/`, `angular.json`, `housing.service.ts` | [cli/environments](https://angular.dev/tools/cli/environments) |
| [18 — Le dossier de candidature](ETAPES/18-DOSSIER.md) | `NonNullableFormBuilder`, groupes imbriqués, `FormArray`, `Validators` et validateur maison, `markAllAsTouched`, écrans pilotés par un `signal`, `getRawValue()` et `@let`, `toSignal(statusChanges)`, `http.post` | `api/db.json`, `application.ts`, `housing.service.ts`, `application-form/` (+ `application-form.css` depuis `assets/18`), `details.ts`, `details.css` | [forms/typed-forms](https://angular.dev/guide/forms/typed-forms) |

**Le guidage évolue avec vous**, comme dans le lab Intro : les étapes 1 à 4 écrivent chaque action
sur chaque fichier ; les étapes 5, 7 et 8 passent aux codes à trous (`// TODO` + un tableau qui explique
chaque morceau) parce que vous avez déjà fait ces gestes ce matin ; les étapes 9 à 12 et 14 redeviennent guidées (l'étape 13 garde un petit code à trous) parce que les notions sont nouvelles (services, routes, formulaires, HTTP). Les
étapes 15 et 16 restent guidées : `HttpClient` et les intercepteurs n'ont été vus qu'en démo, et
chaque fichier y est donné en entier ou morceau par morceau. L'étape 17 est facultative : faites-la
si vous avez de l'avance. L'étape 18 est guidée de la même façon, morceau par morceau : le dossier
est le plus gros composant du lab, et chaque morceau y est accompagné de son tableau d'explication.
Si vous êtes à l'aise, sautez les blocs de code et travaillez à partir des liens de doc.

### 🗣️ Débriefs collectifs, ou points à noter

Trois fois dans le lab, arrêtez-vous pour comparer votre travail avec vos voisins et poser vos
questions :

| Après | On compare | Question à se poser |
|---|---|---|
| l'étape 04 | les trois composants et l'interface | « qui affiche quoi, et qui connaît le type `HousingLocationInfo` ? » |
| l'étape 08 | la liste complète à l'écran | « que se passe-t-il si j'enlève `track` ? si j'enlève `()` après `housingLocation` ? » |
| l'étape 11 | la navigation liste => détail => liste | « quel est le chemin de l'`id`, du clic jusqu'au `find()` du service ? » |

## 📦 Le dossier `assets/`

L'éditeur en ligne d'angular.dev pré-remplit certains fichiers (les CSS, les deux SVG, la base de
données). En local, c'est vous qui les copiez : ils sont dans `assets/` (le dossier à côté de ce README, **pas** dans votre projet ; dans les
étapes, `assets/…` désigne toujours ce dossier), rangés par **l'étape où
vous en avez besoin**. Chaque étape vous dit quoi copier, et où. Voici ce que contient ce dossier :

```
assets/
├── 01/  styles.css, logo.svg, location-pin.svg
├── 02/  app.css, home.css
├── 03/  housing-location.css
├── 08/  housingLocationList.ts     <- le tableau des 10 logements, à coller dans Home
├── 11/  details.css
├── 18/  application-form.css       <- le style du dossier : champs, erreurs, garants, boutons
└── db.json                         <- la base json-server (étape 14)
```

## 📝 Les noms, et les petites différences avec angular.dev

Une version plus ancienne de ce support s'appelait `houses-app` avec un composant `House` et un
dossier `components/`. Les noms ont été alignés sur le tutoriel officiel (projet `homes`,
composants `Home`, `HousingLocation`, `Details`, interface `HousingLocationInfo`, service
`HousingService`) pour que vous puissiez comparer votre code à angular.dev à tout moment, et pour
que ce soit la même app que dans le lab Avancé.

Il reste quatre différences entre un projet créé par `ng new` et l'éditeur en ligne, toutes
signalées dans les étapes concernées :

| Dans le tutoriel officiel | Dans votre projet | Pourquoi |
|---|---|---|
| `src="/public/logo.svg"` | `src="/logo.svg"` | la CLI sert le contenu de `public/` à la racine du site (étapes 2, 3) |
| `routes.ts` + `provideRouter` dans `main.ts` | `app.routes.ts` + `app.config.ts` | `ng new` a déjà écrit ce branchement, vous ne remplissez que les routes (étape 10) |
| `@Service()` (c'est aussi ce que génère votre CLI 22.2) | `@Injectable({ providedIn: 'root' })`, que vous écrivez à la place | les deux sont équivalents ; `@Service()` est un raccourci apparu en 22.2, la synthèse du matin utilise `@Injectable` (étape 9) |
| `styleUrls: ['./home.css']` | `styleUrl: './home.css'` | la CLI génère la forme au singulier ; les deux fonctionnent, gardez ce qui est généré |

## 🎉 Challenge final

Votre application est terminée quand vous pouvez cocher chacune de ces cases :

- [ ] `ng build` est vert, sans avertissement.
- [ ] Avec `npm run api` et `ng serve` lancés, la page affiche 10 cartes avec leur photo.
- [ ] « oak » puis **Search** => 4 cartes ; champ vide puis **Search** => 10 cartes.
- [ ] **Learn More** ouvre `/details/5` avec la photo, le nom et les 3 caractéristiques du logement.
- [ ] Sur `/details/5`, **Next** sur l'écran 1 vide affiche un message sous chacun des quatre champs, et l'écran ne change pas (étape 18).
- [ ] Une date d'emménagement passée affiche `The move-in date must be in the future.` (étape 18).
- [ ] **Add a guarantor** ajoute un garant, **Remove this guarantor** le retire ; un garant incomplet bloque **Next** (étape 18).
- [ ] L'écran 3 récapitule le dossier, et **Send my application** affiche `Application #… received.` ; la console montre `POST http://localhost:3000/applications => 201 (… ms)` et le dossier apparaît dans `api/db.json` (étape 18).
- [ ] Le logo en haut ramène à la liste sans recharger la page.
- [ ] Il ne reste ni `fetch`, ni `ChangeDetectorRef`, ni `markForCheck()` dans `src/app/` (étape 15).
- [ ] Chaque requête écrit une ligne `GET http://localhost:3000/locations => 200 (… ms)` dans la console (étape 16).
- [ ] Avec `npm run api -- --delay 1500`, le bandeau **Loading…** s'affiche le temps de la requête, puis disparaît (étape 16).
- [ ] *(facultatif, étape 17)* `HousingService` lit `environment.apiUrl`, et le fichier produit par `ng build` contient `localhost:3000`.

## ✅ Pour aller plus loin

Si vous avez fini en avance, voici quelques prolongements, du plus simple au plus ambitieux :

- Affichez « Units available » sur la carte, et grisez le lien quand `availableUnits` vaut 0 (`@if`).
- Faites chercher sur le nom **ou** la ville (une ligne à changer dans le `computed` de l'étape 15).
- Limitez le dossier à 3 garants : `Validators.maxLength(3)` fonctionne aussi sur un `FormArray`
  (il compare la longueur de la liste), et masquez **Add a guarantor** quand la limite est atteinte.
- Dans `Details`, remplacez `toSignal(…)` par `httpResource`, qui renvoie directement un signal et
  passe lui aussi par vos intercepteurs : voir [le guide `httpResource`](https://angular.dev/guide/http/http-resource).
- Vous avez de l'avance ? Le lab avancé [02-housing-async](../02-housing-async/) part de ce projet,
  et migre le dossier de l'étape 18 vers les Signal Forms.

## Récap

- Une app Angular = un arbre de composants (`App` > `Home` > `HousingLocation`), une interface pour
  typer la donnée, un service pour la fournir.
- La donnée descend par `input()` et `[prop]`, s'affiche par `{{ }}`, se répète par `@for`.
- Le routeur affiche un composant selon l'URL (`<router-outlet>`), et `:id` transporte une valeur.
- Un formulaire réactif = un `FormGroup` de `FormControl`, lu au `(submit)` ; avec `NonNullableFormBuilder`, il est typé, imbriqué, validé, et `getRawValue()` donne un objet prêt à envoyer.
- Un formulaire réactif n'est pas fait de signals : `toSignal(form.statusChanges)` sert de pont, les Signal Forms le rendent inutile.
- Une API, c'est juste une fonction `async` dans le service ; le reste de l'app ne change presque pas.
- `HttpClient` renvoie des `Observable` froids ; `toSignal` s'y abonne et le rendu suit les signals, sans `markForCheck()`.
- Un intercepteur voit passer toutes les requêtes : `withInterceptors([a, b])`, `a` puis `b` à l'aller, l'inverse au retour.
- Un fichier d'environnement change une valeur selon le build ; tout ce qu'il contient est public.

➡️ Commencez par [01 — Hello world](ETAPES/01-HELLO-WORLD.md).
