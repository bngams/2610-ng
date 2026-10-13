# 02 — Housing sous pression asynchrone

> **Scénario à réaliser en autonomie.** Vous arrivez du lab [Housing Init](../02-housing-init/)
> avec l'application *Homes* terminée à l'étape 18 (ou vous partez de sa solution,
> `../02-housing-init/solution/`) : `HttpClient`, deux intercepteurs, l'adresse de l'API dans
> `environment.ts`, et un dossier de candidature en trois écrans écrit en formulaires réactifs.
> Vous allez d'abord la **mettre sous pression** : une API enrichie (avis, agents, disponibilité,
> réservations), un service qui couvre toute cette API, et un intercepteur « chaos » qui ajoute
> latence aléatoire et erreurs sur certaines routes. Vous **migrez** ensuite le dossier vers les
> Signal Forms, en gardant les deux versions côte à côte. Puis vous traitez **cinq
> scénarios asynchrones et un scénario synchrone, chacun deux fois** : le côté RxJS vous est
> **donné et expliqué**, le côté signals est **à écrire**, et vous comparez. Deux étapes reviennent
> ensuite sur l'infrastructure HTTP, cette fois sans code donné : un intercepteur de reprise, puis
> un service générique qui encaisse un changement de contrat du back. L'important n'est pas le code,
> c'est la **grille de décision** « quand RxJS, quand signals, où on fait le pont » que vous
> remplissez au fil des étapes et qu'on met en commun au débrief final (voir [GRILLE.md](GRILLE.md)).
> Le dossier `solution/` contient le projet complet, le dossier dans ses deux versions et les six
> scénarios des deux côtés : à ne regarder qu'en cas de blocage, ou
> pour comparer avec la vôtre une fois terminé. Il y a une exception : pour le suivi de
> disponibilité (étape 06), lire la solution fait partie de l'exercice.

> **Niveau : confirmé.** Ce lab suppose que vous codez en Angular (v20) au quotidien, avec RxJS,
> et que vous avez suivi la matinée (`signal`, `computed`, `effect`) et l'intro de ce matin
> (`ng new`, HTTP avec RxJS et avec les signals). Sur le côté signals, il ne vous guide pas pas à
> pas : chaque scénario donne les **contraintes**, des **indices**, l'**API à utiliser** et des
> liens de doc. À vous de construire. Les API qui ne sont pas dans la matinée (`httpResource`,
> `rxResource`, `input.required`, `toObservable`) sont présentées dans la section « Le format »,
> juste avant les étapes, et rappelées au moment où vous en avez besoin ; celles de Signal Forms
> sont présentées dans l'étape 01, qui les utilise.

Tout le lab tourne en **Angular 22**. Sur votre projet v20, `resource`, `httpResource` et
`rxResource` sont encore expérimentaux : la grille le note, et la variante sûre est
`toSignal(obs$)` (voir le [repère v20 vers v22](../00-intro-syntax-recap/repere-v20.html) du
support de la matinée). Signal Forms, lui, n'existe pas du tout en v20 : l'étape 01 dit pourquoi,
et ce que vous gardez sur votre projet.

---

## ✨ Objectifs

- **Migrer** un formulaire réactif en plusieurs écrans vers les **Signal Forms** (`form()`,
  `[formField]`, `validate`, `applyEach`, `submit()`), et dire ce que chaque API fait de la valeur,
  des règles et de l'état.
- Reconnaître les **six situations** qu'on croise dans une app métier : la recherche annulable, le
  chargement parallèle, l'erreur partielle, la course aux clics, le polling, et la dérivation
  synchrone.
- Savoir les **lire en RxJS** (`debounceTime`, `switchMap` / `concatMap` / `exhaustMap`, `forkJoin`,
  `catchError` par flux, `timer` + `takeUntilDestroyed`, `combineLatest`) : le code est donné,
  l'important est de savoir pourquoi chaque opérateur est là.
- Savoir les **écrire en signals** quand c'est possible (`httpResource`, `rxResource`, `computed`,
  `error()` / `reload()`, garde `pending`), et reconnaître quand ça ne l'est pas.
- Placer le **pont** au bon endroit : `toSignal`, `toObservable`, `rxResource`.
- Repartir avec une **grille de décision** applicable lundi sur votre projet.
- Écrire un **intercepteur de reprise** qui ne rejoue que ce qui est idempotent, au bon endroit de
  la chaîne d'intercepteurs.
- Factoriser l'accès HTTP dans une classe générique `ResourceService<I, T>`, et absorber un
  changement de contrat de l'API (`{ data, meta }`) dans un seul fichier.

---

## 📁 Point de départ

Vous partez de l'application Housing **terminée**, telle que le lab Init la laisse à l'étape 18,
avec son dossier de candidature. Si vous n'avez pas fait les étapes 17 (facultative) et 18, partez
de `02-housing-init/solution/`. Voici ce que contient ce projet, et ce qui va changer :

```
homes/                                 <- votre projet (ou une copie de 02-housing-init/solution/)
├── api/db.json                        <- deux collections : 10 logements (/locations), et /applications (les dossiers)
├── package.json                       <- json-server 0.17.4 déjà en devDependencies, script "api"
├── angular.json                       <- fileReplacements des environnements, pas encore de proxy
└── src/
    ├── environments/                  <- environment.ts et environment.development.ts : apiUrl = 'http://localhost:3000'
    └── app/
        ├── app.ts, app.css            <- en-tête + bandeau « Loading… » + <router-outlet>
        ├── app.config.ts              <- provideHttpClient(withInterceptors([loggingInterceptor, loadingInterceptor]))
        ├── logging-interceptor.ts, loading-interceptor.ts, loading.service.ts
        ├── app.routes.ts              <- deux routes : '' et 'details/:id'
        ├── housinglocation.ts         <- HousingLocationInfo (8 champs)
        ├── application.ts             <- Application et Guarantor : la forme d'un dossier (ne change pas)
        ├── housing.service.ts         <- HttpClient : la liste, un logement, et submitApplication(application) en POST
        ├── home/home.ts               <- la liste, avec toSignal + signal/computed pour le filtre
        ├── details/details.ts         <- la fiche avec toSignal, et <app-application-form [locationId]="…" />
        ├── application-form/…         <- ApplicationForm : le dossier en trois écrans, en formulaires réactifs
        └── housing-location/…         <- la carte (ne change pas)
```

Ce que vous n'avez pas à réécrire vous-même, le dossier `assets/` vous le donne. Il se trouve à
côté de ce README, **pas** dans votre projet. Chaque fichier est copié au moment où une section le
demande ; les commandes `cp` du lab supposent que votre projet `homes/` est **à côté** du dossier
`02-housing-async/` (voir la mise en place). Voici ce que contient `assets/`, et l'étape qui
utilise chaque fichier :

```
assets/
├── api/
│   ├── db.json                        <- la base enrichie : locations (+ price, type, agentId), reviews, agents, availability, bookings, applications (vide)
│   ├── db.seed.json                   <- la même, copie de référence pour `npm run api:reset`   (étape 00)
│   └── server.js                      <- l'API v2 : json-server en module, réponses { data, meta } (étape 09, partie B)
├── proxy.conf.json                    <- /api vers http://localhost:3000                       (étape 00)
├── chaos/
│   ├── chaos.config.ts                <- latence et taux d'erreur par route : c'est ici que vous réglez (étape 00)
│   └── chaos.interceptor.ts           <- l'intercepteur HttpClient                              (étape 00)
├── services/                          <- les six sous-classes de ResourceService : locations, reviews, agents,
│                                         availability, bookings, applications                     (étape 09, partie A)
└── scenarios.css                      <- la mise en page des pages d'expérience                 (étape 02)
```

Pour vous repérer, voici l'arborescence que vous aurez à la fin du lab. C'est une vision finale,
pas un point de départ : chaque dossier d'expérience est créé par l'étape qui lui correspond.

```
homes/
├── api/db.json, db.seed.json, server.js
├── package.json                       <- + scripts "api:reset" et "api:v2"
├── proxy.conf.json
├── angular.json                       <- proxyConfig + scenarios.css
└── src/
    ├── environments/                  <- apiUrl = '/api' dans les deux fichiers
    ├── scenarios.css
    └── app/
        ├── app.ts, app.css            <- + la barre de navigation des expériences
        ├── app.config.ts              <- withInterceptors([logging, loading, retry, chaos])
        ├── retry-interceptor.ts       <- la reprise des GET en 503 (étape 08)
        ├── app.routes.ts              <- + une route par scénario
        ├── housinglocation.ts         <- + Review, Agent, Availability, Booking
        ├── api/                       <- ResourceService<I, T> + six services (étape 09 ; remplace housing.service.ts)
        ├── chaos/                     <- chaos.config.ts, chaos.interceptor.ts
        ├── application-form/          <- + application-form-signals.ts : le dossier en Signal Forms (étape 01)
        ├── home/, details/            <- + le loyer et la bascule Reactive / Signal Forms sur la fiche ;
        │                                 l'accueil paginé (bonus de l'étape 09)
        └── scenarios/
            ├── mode-toggle.ts         <- la bascule RxJS / Signals
            ├── s1-search/             <- s1-page.ts, s1-rxjs.ts (donné), s1-signals.ts (à vous)
            ├── s2-details/            <- la fiche détail et l'erreur partielle : même page, mêmes composants
            ├── s4-booking/
            ├── s5-polling/
            └── s6-filters/            <- + filters.ts (la fonction pure, donnée)
```

Il n'y a pas de dossier `s3-*` : l'erreur partielle sur les avis (étape 04) se joue dans les
composants de la fiche détail, en changeant un réglage du chaos.

---

## 🚀 Mise en place

Angular 22 exige **Node 24.15+** (ou 22.22.3+, voir la
[matrice des versions](https://angular.dev/reference/versions)) : en dessous, la CLI s'arrête sur
« Please update your Node.js version ». Vous aurez aussi besoin de **trois terminaux** : un pour
l'API, un pour l'app, et un pour les commandes (`curl`, `npm run api:reset`).

Vérifiez d'abord la version de Node, placez le projet à côté du dossier du lab, puis lancez l'API
et l'application, chacune dans son terminal :

```bash
nvm use 24            # ou nvm install 24 si besoin ; à refaire dans chaque terminal
node -v               # -> v24.x

# placez-vous à la racine du cours, le dossier qui contient 02-housing-init/ et 02-housing-async/.
# Si vous partez de la solution du lab Init plutôt que de votre projet :
cp -r 02-housing-init/solution homes && cd homes
# Si vous partez de votre propre projet (terminé à l'étape 18 du lab Init) : copiez-le (ou
# déplacez-le) à cet endroit, puis cd homes.
npm install           # json-server 0.17.4 est déjà dans les devDependencies (étape 14 du lab Init)

# terminal 1 : l'API
npm run api
# terminal 2 : l'app
npm start
```

> 💡 **Tester :** `npm run api` n'affiche pour l'instant que deux ressources,
> `http://localhost:3000/locations` et `http://localhost:3000/applications`, et `npm start` termine
> par `➜  Local:   http://localhost:4200/`. Ouvrez-le : les dix cartes s'affichent, comme à la fin
> du lab Init, et la console affiche la ligne du journal,
> `GET http://localhost:3000/locations => 200 (…)`. La fiche d'un logement affiche le dossier de
> candidature, `Step 1 of 3 · form status: INVALID`. Gardez la **console du
> navigateur ouverte** (F12) pendant tout le lab : filtrez-la sur `localhost:3000` pour
> l'instant, puis, à partir de l'étape 00, sur `chaos` ou `/api/`. C'est là que se lisent les
> preuves.

---

## 🔁 Le format : deux fois, puis comparer

Chaque expérience suit le même déroulé, en trois temps :

1. **Côté RxJS**, le code est **donné** : copiez-le, lisez le tableau qui explique chaque
   opérateur, faites-le tourner et observez le log. Contrainte que ce code respecte : **aucun
   `subscribe()` manuel pour un état**, la sortie passe par `toSignal`. Les deux exceptions sont
   nommées là où elles apparaissent : un événement dans la réservation, un tick dans le suivi de
   disponibilité.
2. **Côté signals**, le code est **à écrire** : `httpResource` / `rxResource` / `computed`, à partir
   des contraintes, des indices et des liens de doc. Quand l'expérience n'a pas d'équivalent propre,
   le but est justement de le constater, pas de forcer.
3. **Vérifier** le critère de réussite (log chaos + onglet Réseau), puis **remplir** la ligne
   correspondante de [GRILLE.md](GRILLE.md) : trois mots par case suffisent, l'important est d'être
   capable de le justifier à l'oral. Le bloc « Ce qu'on retient » de chaque étape est replié :
   ouvrez-le après avoir rempli la grille, pas avant.

Trois étapes sortent de ce format. L'étape 01 est une **migration** : le même dossier, réécrit
dans une autre API de formulaires, puis comparé à l'original. Les étapes 08 et 09 n'ont pas de
volets à comparer, mais un seul code à écrire. Toutes trois partent de contraintes, d'un squelette
et de liens de doc.

Quatre API reviennent dans presque toutes les étapes sans avoir été vues dans la matinée. Le
tableau suivant résume ce qu'il faut en savoir avant de commencer :

| API | Ce qu'il faut savoir | Doc |
|---|---|---|
| `httpResource(() => url \| requête \| undefined)` | le `resource` de `HttpClient` : sa **fonction de requête** (l'équivalent des `params` de `resource`) renvoie une URL, un objet `{ url, params, method, body }`, ou `undefined` pour rester `idle` ; elle relance et annule quand ses signals changent ; expose `value()`, `isLoading()`, `error()`, `hasValue()`, `status()`, `reload()` ; attention, `value()` **lève** si la resource est en erreur, testez `hasValue()` avant. Elle prend une URL, pas un Observable : construisez l'URL avec `environment.apiUrl`, comme le service (l'étape 09 range ces URL dans le service). | [httpResource](https://angular.dev/guide/http/http-resource) |
| `rxResource({ params, stream })` | le même `resource`, mais nourri par un Observable : c'est la forme à prendre pour réutiliser les méthodes de `HousingService`, ou pour un `stream` qui émet plusieurs fois (le suivi de disponibilité) | [rxResource](https://angular.dev/api/core/rxjs-interop/rxResource) |
| `locationId = input.required<number>()` | les composants de la fiche détail, de la réservation et du suivi de disponibilité reçoivent l'id ainsi. Piège : `toSignal` s'abonne **à la construction**, et un `startWith` ou un `of` émet **tout de suite** ; lire `this.locationId()` à ce moment-là lève `NG0950`. Partez de `toObservable(this.locationId)`, qui n'émet qu'une fois l'input disponible (détail dans l'étape bonus 10, piège 3). | [NG0950](https://angular.dev/errors/NG0950) |
| `toSignal` / `toObservable` | le pont. `toObservable` émet de façon asynchrone ; `toSignal(obs$, { initialValue })` évite un `undefined` de départ | [rxjs-interop](https://angular.dev/ecosystem/rxjs-interop) |

> 📖 [`resource`, le guide](https://angular.dev/guide/signals/resource)

---

## 🗂️ Les étapes

Les étapes se font dans l'ordre. L'étape 00 prépare le projet, et l'étape 01 migre le dossier de
candidature vers les Signal Forms, avant que les expériences ne commencent. L'étape 02 montre
comment une expérience se construit, et les étapes 03 à 07 réutilisent le même geste. Les étapes
08 et 09 ne sont plus des expériences à deux volets : elles reviennent sur la couche HTTP que
toutes les expériences partagent, avec moins de guidage. Le tableau suivant résume, pour chaque
étape, ce que vous faites et ce qu'on attend côté signals :

| Étape | Ce que vous faites | Côté signals |
|---|---|---|
| [00 — Mise sous pression](ETAPES/00-MISE-SOUS-PRESSION.md) | API enrichie, proxy et `apiUrl: '/api'`, service complet, intercepteur chaos et sa place dans la chaîne (code donné) | `toSignal` (déjà en place) |
| [01 — Le dossier en Signal Forms](ETAPES/01-DOSSIER-SIGNAL-FORMS.md) | migrer le dossier réactif à côté de l'original, une bascule dans la fiche, l'envoi sous le chaos (latence, double clic, 503) | `form()` + schéma, `[formField]`, `validate`, `applyEach`, `submit()` |
| [02 — Recherche : anti-rebond et annulation](ETAPES/02-RECHERCHE.md) | construire une expérience (route, page, bascule), puis `debounceTime` + `switchMap` | `httpResource` + le pont pour le debounce |
| [03 — Détail : trois appels en parallèle](ETAPES/03-DETAIL-PARALLELE.md) | `forkJoin` | 3 resources + `computed` |
| [04 — Détail : un appel sur trois échoue](ETAPES/04-DETAIL-ERREUR.md) | `catchError` par flux | `error()` + `reload()` |
| [05 — Réserver : clics rapides](ETAPES/05-RESERVER.md) | `switchMap` / `concatMap` / `exhaustMap` | `rxResource` (version A) et une garde `pending` (version B) |
| [06 — Disponibilité : polling](ETAPES/06-DISPONIBILITE.md) | `timer` + `switchMap` + `takeUntilDestroyed` | essayez, constatez, puis lisez la solution |
| [07 — Filtres : dérivation synchrone](ETAPES/07-FILTRES.md) | `combineLatest` | `computed`, sans requête |
| [08 — Écrire un intercepteur de reprise](ETAPES/08-REPRISE.md) | `retry({ count, delay })` + `timer` sur les `GET` en 503, `defer`, position avant le chaos | — (comparé au `reload()` des resources) |
| [09 — Factoriser : `ResourceService<I, T>`, puis le contrat v2](ETAPES/09-FACTORISER.md) | classe abstraite générique, `InjectionToken`, puis `{ data, meta }` absorbé par `map` | `getResource()` / `listResource()`, option `parse` de `httpResource` |
| [10 — Bonus : trois pièges RxJS](ETAPES/10-BONUS.md) (facultatif) | subscribe imbriqué, input muté, `input.required` lu trop tôt | — |

## 🗣️ Débrief final : la grille de décision

On termine tous ensemble sur la grille, remplie au fil des expériences. Ouvrez
[GRILLE.md](GRILLE.md) : elle compte sept lignes (une situation par ligne), trois colonnes à
remplir (RxJS, Signals, Pont) et une colonne « Vu dans » déjà renseignée. Dans chaque case,
quelques mots suffisent, de quoi tenir trente secondes à l'oral. La ligne « formulaire => état »
se remplit des deux côtés : le dossier (étape 01) pour les Signal Forms et le pont
`toSignal(statusChanges)`, la recherche et les filtres pour `valueChanges` côté RxJS.

Au débrief, chacun présente une ligne de la grille, puis on la confronte à un cas **de votre
projet** (apportez-en un) : RxJS, signals, ou pont, et où, en trente secondes.

Une version attendue est dans `solution/GRILLE-corrigee.md`, à ouvrir après avoir rempli la vôtre.

> ℹ️ Le dossier `solution/` est l'état **final** du lab, après l'étape 09 : les composants y
> injectent `LocationsService`, `ReviewsService`… au lieu de `HousingService`, et l'API se lance
> avec `npm run api:v2`. Quand vous y lisez une expérience ou le dossier avant l'étape 09,
> transposez : `availabilityService.get(id)` y correspond à `housingService.getAvailability(id)`,
> et `applicationsService.create(dossier)` à `housingService.submitApplication(dossier)`.

---

## Récap

- **Un formulaire peut être un signal** : en Signal Forms, la valeur vit dans un `signal`, les
  règles dans un schéma, et l'état (`valid()`, `errors()`, `submitting()`) se lit sans pont ; en
  Reactive Forms, il faut `toSignal(statusChanges)` pour chaque état utile.
- **Signals pour l'état et la dérivation** : `computed` remplace `combineLatest` + `map` dès que
  tout est synchrone (les filtres) ; `httpResource` remplace `switchMap(http)` + `toSignal` pour
  « une requête qui dépend d'un état » (la recherche, la fiche détail), avec annulation et statut
  d'erreur local (l'erreur partielle sur les avis).
- **RxJS pour le temps et l'orchestration** : anti-rebond (la recherche), file ou garde sur des
  événements (la réservation), polling et tout ce qui a un `timer` dedans (le suivi de
  disponibilité). Un `resource` n'est pas un bouton :
  pour une mutation, c'est `exhaustMap` ou une garde `pending`.
- **Le pont vit dans le composant** : `toSignal(obs$)` en sortie, `toObservable(sig)` pour
  injecter un signal dans un pipe, `rxResource` quand un flux doit nourrir une resource.
- **Le chaos est votre ami** : sans latence ni erreur, aucun de ces bugs n'est visible en dev ;
  ils arrivent en prod. Gardez un intercepteur de ce genre à portée de main sur votre projet.
- **L'ordre des intercepteurs est un choix** : le journal et l'indicateur au-dessus, la reprise
  juste avant ce qu'elle doit rejouer, et `defer(() => next(req))` pour rejouer vraiment. On ne
  reprend que ce qui est idempotent : un `POST` rejoué, c'est une réservation ou un dossier en
  double.
- **Un seul point d'accès HTTP** : un `ResourceService<I, T>` générique qui renvoie des Observables
  et fabrique les `httpResource` ; le jour où le back change de contrat, un fichier change.
- **Sur votre projet v20** : `toSignal` est stable, `resource` ne l'est pas encore, et Signal
  Forms n'existe pas (expérimental en v21, stable en v22) ; la grille reste valable, seule la
  colonne « Signals » attend la v22 pour les lignes « requête » et « formulaire ».
