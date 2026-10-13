# 🔁 08 — Écrire un intercepteur de reprise

> **Scénario à réaliser en autonomie.** Dans l'erreur partielle (étape 04), un avis sur deux
> tombait en 503, et c'était à l'utilisateur de cliquer sur « Réessayer ». Or beaucoup de 503 sont
> **passagers** : un serveur qui redémarre, une passerelle surchargée une demi-seconde. Une
> nouvelle tentative, un instant plus tard, suffit souvent. Vous allez écrire un intercepteur qui
> fait cette reprise tout seul, pour toute l'application. Cette fois, c'est vous qui écrivez
> l'intercepteur : l'étape donne les contraintes, un squelette avec des `TODO`, des indices et la
> doc ; le code complet est dans `solution/src/app/retry-interceptor.ts`, à n'ouvrir qu'en cas de
> blocage.

## ✨ Objectifs

- Distinguer ce qu'on peut rejouer sans risque (une lecture **idempotente**) de ce qu'on ne doit
  jamais rejouer en aveugle (une réservation).
- Écrire une reprise avec attente croissante : `retry({ count, delay })` et `timer`.
- Placer un intercepteur au bon endroit de la chaîne, et le prouver dans le log.
- Comprendre pourquoi `defer` est nécessaire quand on rejoue `next(req)`.
- Peser la reprise automatique contre le bouton « Réessayer » des expériences.

## 🧭 1 — Ce qu'on peut rejouer, et ce qu'on ne doit pas

Rejouer une requête n'est sûr que si la jouer deux fois laisse le serveur dans le même état que la
jouer une fois : c'est la définition d'une requête **idempotente**. Voici ce que cela donne pour
les méthodes que l'application utilise :

| Méthode | Idempotente ? | Dans cette application | Reprise automatique |
|---|---|---|---|
| `GET` | oui, et sans effet de bord (« sûre ») | liste, fiche, avis, agent, disponibilité, compteur de réservations | **oui** |
| `POST` | non : chaque appel crée une ressource | `POST /bookings`, `POST /applications` | **jamais** : une reprise peut créer une deuxième réservation, ou un deuxième dossier |
| `PATCH` | pas garanti par la norme ; dépend du corps envoyé | `PATCH /availability/3` (lancé par `curl`) | non : on ne rejoue pas ce qu'on ne peut pas garantir |

Le risque du `POST` n'est pas théorique. Dans la réservation (étape 05), vous avez vu un
`switchMap` abandonner des `POST` côté client, alors qu'en production le serveur peut très bien
les avoir déjà enregistrés. Une reprise automatique ferait pire encore : elle **renverrait** la
réservation. Le chaos de ce lab répond 503 **avant** d'envoyer la requête, donc un `POST` rejoué
serait ici sans conséquence ; mais un vrai 503 (ou un délai dépassé) peut arriver **après** que le
serveur a écrit, et l'intercepteur n'a aucun moyen de le savoir. La même règle protège l'envoi
du [dossier de candidature](01-DOSSIER-SIGNAL-FORMS.md), dans ses deux versions : ce `POST` ne doit
jamais être rejoué, et c'est l'utilisateur qui renvoie après le message d'erreur.

Le statut compte autant que la méthode. Un `503 Service Unavailable` dit « indisponible pour
l'instant, réessayez » ; un `404` ou un `400` ne guérira pas en attendant, le rejouer ne fait que
retarder l'erreur.

> 📖 [Méthodes sûres et idempotentes (MDN)](https://developer.mozilla.org/fr/docs/Glossary/Idempotent) ·
> [503 Service Unavailable (MDN)](https://developer.mozilla.org/fr/docs/Web/HTTP/Reference/Status/503)

## 📐 2 — Les contraintes

Votre intercepteur doit respecter les cinq règles suivantes :

1. Il ne reprend que les requêtes `GET` ; toutes les autres passent sans changement.
2. Il ne reprend que les erreurs `503` ; toute autre erreur est relancée telle quelle, tout de
   suite.
3. Il fait au plus **trois** reprises, avec une attente qui **double** : 200 ms, puis 400 ms,
   puis 800 ms. Au-delà, l'erreur remonte au composant, qui l'affiche comme avant.
4. Chaque reprise **repasse par le chaos** et y fait un **nouveau tirage** : sinon, on ne teste
   rien.
5. Il écrit une ligne `[retry] GET … : reprise 1/3` à chaque reprise, pour la lire dans la console.

## 🚧 3 — Le squelette

La CLI génère l'intercepteur vide, comme pour le journal du lab Init. Dans le terminal 3, à la
racine du projet, lancez :

```bash
ng generate interceptor retry
```

La CLI répond par une ligne `CREATE src/app/retry-interceptor.ts` : le fichier contient une
fonction `retryInterceptor` qui se contente de `return next(req);`. Avant de le compléter, voici
l'opérateur RxJS qui fait le travail, `retry` avec une fonction `delay` :

```ts
source$.pipe(
  retry({
    count: 3,                                   // au plus 3 réabonnements après le premier essai
    delay: (error, retryCount) => timer(500),  // retryCount vaut 1, puis 2, puis 3
  }),
);
```

Voici le rôle de chaque morceau :

| Morceau | Rôle |
|---|---|
| `retry({ count })` | quand `source$` échoue, `retry` s'y **réabonne**, au plus `count` fois |
| `delay: (error, retryCount) => …` | appelée à chaque échec ; elle renvoie un Observable qui décide de la suite |
| `timer(ms)` renvoyé par `delay` | quand il émet, `retry` se réabonne : c'est l'attente avant la reprise |
| `throwError(() => error)` renvoyé par `delay` | `retry` abandonne et laisse passer cette erreur : c'est la sortie pour les erreurs qu'on ne reprend pas |

Remplacez le contenu de `src/app/retry-interceptor.ts` par ce squelette, puis complétez les trois
`TODO` :

🚧 **À compléter :**

```ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';

/** Nombre maximal de reprises après le premier essai. */
const MAX_RETRIES = 3;
/** Attente avant la première reprise ; elle double à chaque reprise (200, 400, 800 ms). */
const BASE_DELAY_MS = 200;

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  // TODO 1 : si la requête n'est pas un GET, la laisser passer : return next(req);

  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error: unknown, retryCount: number) => {
        // TODO 2 : si `error` est une HttpErrorResponse de statut 503 :
        //          écrire la ligne `[retry] ${req.method} ${req.urlWithParams} : reprise ${retryCount}/${MAX_RETRIES}`
        //          puis attendre BASE_DELAY_MS * 2 ** (retryCount - 1) avec timer(...)
        // TODO 3 : sinon, relancer l'erreur telle quelle avec throwError(...)
      },
    }),
  );
};
```

Le build reste rouge tant que le `TODO 2` et le `TODO 3` ne sont pas écrits : la fonction `delay`
doit renvoyer un Observable. Quelques indices pour les trois `TODO` :

- `req.method` vaut `'GET'`, `'POST'`… en majuscules.
- `error instanceof HttpErrorResponse` vous donne accès à `error.status` ; c'est ce que fait déjà
  `describe()` dans `s2-rxjs.ts`.
- `2 ** (retryCount - 1)` vaut 1, 2, puis 4 : multiplié par 200, on obtient 200, 400, 800 ms.
- Les deux branches de `delay` renvoient un Observable : `timer(…)` d'un côté,
  `throwError(() => error)` de l'autre.

> 📖 [retry](https://rxjs.dev/api/operators/retry) ·
> [timer](https://rxjs.dev/api/index/function/timer) ·
> [throwError](https://rxjs.dev/api/index/function/throwError) ·
> [Les intercepteurs](https://angular.dev/guide/http/interceptors)

## 🔗 4 — Le brancher : avant le chaos

Il reste à ajouter `retryInterceptor` au tableau de `src/app/app.config.ts`. La position n'est pas
un détail, et c'est la règle 4 qui la fixe : pour qu'une reprise refasse un tirage, elle doit
**rappeler** le chaos, donc se trouver **avant** lui dans le tableau. Le tableau suivant compare
les trois positions possibles :

| Tableau `withInterceptors` | Ce qui se passe sur un 503 du chaos |
|---|---|
| `[logging, loading, retry, chaos]` (retenu) | `retry` voit l'erreur du chaos, attend, rappelle le chaos : nouveau tirage (une fois `defer` ajouté, voir le piège du même tirage, plus bas). `logging` écrit **une** ligne pour l'ensemble, avec la durée totale, et « Loading… » reste affiché pendant les reprises |
| `[logging, loading, chaos, retry]` | `retry` n'est jamais atteint : le chaos lève son 503 **sans appeler** `next`, comme vous l'avez vu avec le journal à l'étape 00. Il ne reprendrait que les erreurs du vrai réseau |
| `[retry, logging, loading, chaos]` | les reprises fonctionnent (avec `defer`), mais le journal écrit une ligne par tentative et le bandeau clignote entre deux tentatives : on observe la mécanique au lieu de ce que vit l'utilisateur |

Ajoutez donc l'import sous celui du chaos, et `retryInterceptor` juste avant `chaosInterceptor` :

```ts
import { chaosInterceptor } from './chaos/chaos.interceptor';
import { retryInterceptor } from './retry-interceptor';

// …dans providers :
    provideHttpClient(
      withInterceptors([loggingInterceptor, loadingInterceptor, retryInterceptor, chaosInterceptor]),
    ),
```

## 🧪 5 — Tester, et le piège du même tirage

Pour tester, il faut des 503. Dans `chaos.config.ts`, passez la règle `/\/api\/reviews/` à
`errorRate: 0.5`, comme pour l'erreur partielle. Ouvrez `/s2/3`, console filtrée sur `reviews`,
et basculez plusieurs fois entre RxJS et Signals pour rejouer le chargement.

Si vous avez écrit le squelette tel quel, vous tombez tôt ou tard sur ce log :

```
[chaos] GET /api/reviews?locationId=3 => 503 (après 699 ms)
[retry] GET /api/reviews?locationId=3 : reprise 1/3
[chaos] GET /api/reviews?locationId=3 => 503 (après 699 ms)
[retry] GET /api/reviews?locationId=3 : reprise 2/3
[chaos] GET /api/reviews?locationId=3 => 503 (après 699 ms)
[retry] GET /api/reviews?locationId=3 : reprise 3/3
[chaos] GET /api/reviews?locationId=3 => 503 (après 699 ms)
GET /api/reviews?locationId=3 => 503 (4209 ms)
```

⚠️ **Piège : chaque reprise rejoue le même tirage.**

- *Symptôme :* quand le premier essai tombe en 503, les trois reprises tombent aussi, avec
  **exactement le même délai** (`699 ms` quatre fois). Sur un premier essai réussi, rien à
  signaler. La reprise ne sauve donc jamais rien.
- *Cause :* dans une chaîne d'intercepteurs, `next(req)` **appelle tout de suite** l'intercepteur
  suivant (c'est `HttpClient` qui l'enchaîne ainsi) et renvoie l'Observable qu'il a construit. Le
  chaos tire son délai et son erreur **à cet appel**, pas à l'abonnement : relisez les
  `const delayMs` et `const shouldFail` en haut de `chaosInterceptor`. `retry` se réabonne au même
  Observable : il rejoue le même `timer(699)` et le même `throwError`.
- *Correctif :* ne pas appeler `next(req)` une seule fois, mais **à chaque abonnement**. C'est le
  rôle de `defer(() => next(req))` : `defer` reçoit une fonction et l'exécute à chaque
  réabonnement, donc chaque reprise rappelle le chaos, qui refait un tirage. Ajoutez `defer` à
  l'import de `rxjs` et remplacez `return next(req).pipe(` par `return defer(() => next(req)).pipe(`.

La leçon dépasse le chaos : un intercepteur qui fait du travail **dans son corps** (lire une
horloge, un compteur, un jeton) le fait une fois par appel de `next`, pas une fois par tentative.
Un intercepteur d'authentification qui rafraîchit son jeton avant de rejouer une requête a besoin
du même `defer`.

> 📖 [defer](https://rxjs.dev/api/index/function/defer)

## ✅ Critère de réussite

Avec `defer`, toujours sur `/s2/3` et `errorRate: 0.5` sur les avis, le log montre maintenant un
`=> 503` suivi d'une ligne de succès pour la **même** URL, avec des délais différents :

```
[chaos] GET /api/reviews?locationId=3 => 503 (après 784 ms)
[retry] GET /api/reviews?locationId=3 : reprise 1/3
[chaos] GET /api/reviews?locationId=3 => 503 (après 1396 ms)
[retry] GET /api/reviews?locationId=3 : reprise 2/3
[chaos] GET /api/reviews?locationId=3 +811ms
GET /api/reviews?locationId=3 => 200 (3608 ms)
```

La ligne du journal, `=> 200 (3608 ms)`, compte les trois tentatives et les deux attentes : c'est
la durée vécue par l'utilisateur, grâce à la position de `retry` sous `logging`. Et l'écran
« Avis indisponibles » devient rare : sans reprise, un chargement sur deux l'affiche ; avec trois
reprises, il faut quatre 503 de suite, soit une chance sur seize. Lors de nos essais, il est
apparu cinq fois sur douze chargements sans reprise, et deux fois sur vingt-trois avec.

Vérifiez enfin la règle qui protège les réservations. Décommentez la règle `/\/api\/bookings/`
et passez-la provisoirement à `errorRate: 1`, ouvrez `/s4/3` et cliquez une fois sur
« Réserver (exhaustMap) » : le `POST` donne une seule ligne `[chaos] POST /api/bookings => 503`,
sans aucune ligne `[retry]`. Le compteur de la même page, lui, est un `GET /api/bookings` : il
est repris trois fois (`reprise 1/3` à `3/3`) avant d'échouer ; son `toSignal` n'a pas de
`catchError`, une erreur rouge `ERROR` suit donc dans la console : c'est attendu. Remettez ensuite
`errorRate: 0` sur les avis et la règle des réservations en commentaire. Le même essai sur le
dossier (la règle `/\/api\/applications/` de l'étape 01, à `errorRate: 1`) donne une seule ligne
`[chaos] POST /api/applications => 503`, sans `[retry]` : la version Signal Forms affiche son
message d'échec, la version réactive n'affiche rien et laisse une erreur rouge `ERROR` en console.

## ⚖️ 6 — Reprise automatique ou bouton « Réessayer » ?

L'erreur partielle vous a donné un bouton par bloc (`reviews.reload()` côté signals, `reload$`
côté RxJS). L'intercepteur ne le remplace pas : les deux se complètent, et chacun a son coût.

| | Reprise dans l'intercepteur | Bouton « Réessayer » (`reload()`) |
|---|---|---|
| Qui décide | personne : automatique, pour tous les `GET` | l'utilisateur, bloc par bloc |
| Ce que voit l'utilisateur | rien, sauf une attente plus longue (jusqu'à 1,4 s d'attentes, plus la latence de chacune des quatre tentatives) | une erreur, puis le résultat |
| Bon pour | les pannes de quelques centaines de millisecondes | les pannes qui durent, et tout ce qui n'est pas un `GET` |
| Risque | masquer une panne réelle ; multiplier la charge sur un serveur déjà en difficulté (d'où l'attente qui double) | demander un clic pour une erreur qui aurait guéri seule |

La reprise traite donc les erreurs passagères, et le bouton reste là pour celles qui survivent aux
trois reprises. Notez aussi que l'intercepteur rend l'erreur partielle **plus difficile à
observer** : pour rejouer l'étape 04 telle quelle, retirez `retryInterceptor` du tableau le temps
de l'expérience.

Une dernière limite : le suivi de disponibilité (étape 06) interroge le serveur toutes les
3 secondes. Reprendre un tick en échec n'y sert à rien, puisque le tick suivant arrive de toute
façon, et les reprises peuvent même chevaucher ce tick. C'est l'objet de la partie facultative
qui suit.

## ✅ 7 — Facultatif : désactiver la reprise pour une requête

Angular permet d'attacher à une requête des métadonnées que seuls les intercepteurs lisent : un
`HttpContextToken`, avec une valeur par défaut. Le principe tient en trois morceaux, à écrire
vous-même :

| Morceau | Où | Rôle |
|---|---|---|
| `export const RETRY_ENABLED = new HttpContextToken<boolean>(() => true);` | `retry-interceptor.ts` | le jeton ; par défaut, la reprise est active |
| `if (req.method !== 'GET' \|\| !req.context.get(RETRY_ENABLED)) return next(req);` | début de `retryInterceptor` | la règle 1, plus la désactivation à la demande |
| `{ context: new HttpContext().set(RETRY_ENABLED, false) }` | 2e argument de `http.get` dans `getAvailability` (`housing.service.ts`), avec `HttpContext` ajouté à l'import de `@angular/common/http` et `import { RETRY_ENABLED } from './retry-interceptor';` | la requête du polling demande à ne pas être reprise |

Pour le vérifier, ajoutez provisoirement à `CHAOS_RULES` une règle
`{ match: /\/api\/availability/, minDelayMs: 300, maxDelayMs: 500, errorRate: 1 }` : la page de
disponibilité logue alors un `=> 503` toutes les 3 secondes, sans aucune ligne `[retry]`, et le
polling continue (le `catchError` de chaque tick absorbe l'erreur).

La solution définit le jeton et le lit dans l'intercepteur, mais ne l'utilise dans aucun service :
l'étape suivante remplace `housing.service.ts`. Pour garder cette option après l'étape 09, il
faudrait que les méthodes du service générique acceptent des options de requête.

> 📖 [Les intercepteurs, partie métadonnées de requête](https://angular.dev/guide/http/interceptors) ·
> [HttpContextToken](https://angular.dev/api/common/http/HttpContextToken)

## Récap

- Ne rejouez automatiquement que ce qui est **idempotent** (`GET`) et ce qui peut guérir seul
  (`503`) ; un `POST` rejoué, c'est une réservation en double.
- `retry({ count, delay: (err, n) => timer(...) })` : la fonction `delay` décide, erreur par
  erreur, d'attendre ou d'abandonner (`throwError`).
- Dans un intercepteur, `next(req)` construit l'appel tout de suite : pour rejouer **tout** ce qui
  suit, il faut `defer(() => next(req))`.
- La position dans `withInterceptors` est un choix : `retry` avant `chaos` pour refaire un tirage,
  sous `logging` et `loading` pour mesurer et afficher ce que vit l'utilisateur.

---

➡️ [09 — Factoriser : `ResourceService<I, T>`, puis le contrat v2](09-FACTORISER.md)
