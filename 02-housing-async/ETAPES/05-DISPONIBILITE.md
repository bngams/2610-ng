# ⏱️ S5 — Disponibilité : polling, arrêt en quittant la page

**Contexte.** La disponibilité d'un logement change côté serveur, par exemple quand un autre agent
réserve. Vous interrogez donc `GET /availability/:id` toutes les 3 secondes tant que la page est
ouverte, et **plus du tout** une fois qu'on l'a quittée.

Ce besoin se décompose en trois morceaux, que les deux approches traitent ainsi :

| Besoin | RxJS | Signals |
|---|---|---|
| Un tick toutes les 3 s | `timer(0, 3000)` ou `interval(3000)` | `setInterval` à la main |
| Un appel par tick, sans empiler si le précédent traîne | `switchMap(http)` | `reload()` (renvoie `false` et ne fait rien si un chargement est en cours) |
| Arrêter à la destruction | `takeUntilDestroyed()` (ou `toSignal`, qui se désabonne) | `onCleanup` dans un `effect`, à ne pas oublier |

Pour la page, la route et le lien, refaites **le même geste que pour la fiche détail et la
réservation** (étapes 02 et 04), avec une page qui passe `[locationId]="id"` aux deux volets. Les
noms sont les suivants :

| Quoi | Nom |
|---|---|
| Dossier | `src/app/scenarios/s5-polling/` |
| Page | `s5-page.ts`, `S5Page`, `app-s5-page`, `<h1>S5 — Disponibilité : polling, arrêt en quittant la page</h1>` |
| Volets | `s5-rxjs.ts` (`S5Rxjs`, `app-s5-rxjs`) et `s5-signals.ts` (`S5Signals`, `app-s5-signals`) |
| Route | `{ path: 's5/:id', component: S5Page, title: 'S5 — Disponibilité : polling, arrêt en quittant la page' }` |
| Lien | `<a routerLink="/s5/3" routerLinkActive="active">S5 Disponibilité</a>` |

## Côté RxJS (donné)

En RxJS, le temps est un flux comme un autre : un `timer` émet des ticks, et chaque tick devient
une requête. Créez `src/app/scenarios/s5-polling/s5-rxjs.ts` :

```ts
import { Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap, timer } from 'rxjs';
import { Availability } from '../../housinglocation';
import { HousingService } from '../../housing.service';

@Component({
  selector: 'app-s5-rxjs',
  template: `
    <p>
      Disponible :
      <strong>{{ availability()?.available === undefined ? '…' : availability()?.available ? 'oui' : 'non' }}</strong>
    </p>
    <p class="status">appels : {{ calls() }} — dernier : {{ lastCall() }}</p>
  `,
})
export class S5Rxjs {
  readonly locationId = input.required<number>();
  private readonly housingService = inject(HousingService);

  readonly availability = signal<Availability | undefined>(undefined);
  readonly calls = signal(0);
  readonly lastCall = signal('');

  constructor() {
    toObservable(this.locationId)
      .pipe(
        switchMap((id) =>
          timer(0, 3000).pipe(
            switchMap(() =>
              this.housingService.getAvailability(id).pipe(catchError(() => EMPTY)),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((a) => {
        this.availability.set(a);
        this.calls.update((n) => n + 1);
        this.lastCall.set(new Date().toLocaleTimeString());
      });
  }
}
```

| Morceau | Pourquoi il est là |
|---|---|
| `timer(0, 3000)` | un tick tout de suite, puis toutes les 3 s ; `interval(3000)` attendrait 3 s avant le premier |
| `switchMap(() => http)` (et non `mergeMap`) | si l'appel précédent traîne plus de 3 s (chaos), on l'abandonne plutôt que d'empiler : « dernier gagne » |
| `catchError(() => EMPTY)` à l'intérieur | un 503 sur un tick ne doit pas arrêter le polling : `EMPTY` termine ce tick sans valeur, le `timer` continue |
| `takeUntilDestroyed()` puis `subscribe` | la deuxième exception à la règle : on veut **voir** l'opérateur couper le flux à la destruction. Avec `toSignal(...)` à la place, le désabonnement serait inclus : même garantie, écrite autrement |
| `toObservable(this.locationId)` en tête | comme pour la fiche détail et la réservation : l'input requis n'est pas là au moment du `subscribe` dans le constructeur |

## Côté signals : essayez, constatez, puis lisez la solution

Cette expérience est celle où les signals **n'ont pas d'équivalent propre**, et le but est de le
constater par vous-même. Créez `src/app/scenarios/s5-polling/s5-signals.ts` avec la tentative
« signals seuls » :

- un `rxResource({ params: () => this.locationId(), stream: ({ params }) => this.housingService.getAvailability(params) })`
  pour charger une fois ;
- dans le constructeur, un `effect((onCleanup) => { ... })` qui pose un `setInterval` de 3 s
  appelant `this.availability.reload()`, et `onCleanup(() => clearInterval(handle))` ;
- affichez `availability.hasValue()` / `value().available`, `status()`, et un compteur de ticks.

Faites-la marcher (elle marche), puis répondez à trois questions avant d'ouvrir la solution :

- Que lit cet `effect` comme signal ?
- Comment feriez-vous une pause, un repli progressif (backoff), un « dernier gagne » si un appel
  traîne ?
- Que se passe-t-il si vous oubliez `clearInterval` ?

Une fois vos réponses notées, lisez `solution/src/app/scenarios/s5-polling/s5-signals.ts`. La
solution est dans l'état final du lab (après l'étape 08) : `this.availabilityService.get(params)` y
tient la place de votre `this.housingService.getAvailability(params)`. Elle garde votre tentative
(version A) et ajoute la version B, **le pont** : un `rxResource` dont le `stream` est
`timer(0, 3000).pipe(switchMap(http))`. Le temps reste RxJS, la resource ne fait que consommer le
flux, et à la destruction elle se désabonne : le polling cesse. Les deux versions sont derrière un
bouton radio, pour les comparer dans la grille. Ajoutez la version B à votre fichier, à partir de
la solution si vous voulez.

Pourquoi pas d'équivalent ? Un `effect` est fait pour **réagir à des signals** ; ici il n'en lit
aucun, il sert de crochet de destruction déguisé. Rien ne se compose (pas de `retry`, pas de
`takeUntil`, pas de `switchMap`), et le nettoyage est manuel : oubliez `clearInterval` et le
polling survit à la page. Le temps est un flux ; les signals ne modélisent pas le temps.

> 📖 [timer](https://rxjs.dev/api/index/function/timer) ·
> [takeUntilDestroyed](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed) ·
> [effect et onCleanup](https://angular.dev/guide/signals) ·
> [rxResource](https://angular.dev/api/core/rxjs-interop/rxResource)

## Critère de réussite

Changez `available` (avec le `PATCH` ci-dessous, ou en éditant `api/db.json`) : l'affichage suit
au tick suivant, soit en moins de 3 s plus la latence du chaos. Quittez ensuite la page (par le
logo, vers l'accueil, ou par « S1 Recherche ») : 10 secondes plus tard, il n'y a **plus aucune
ligne** `availability` dans le log, ni dans l'onglet Réseau.

> 💡 **Tester :** pour changer la disponibilité sans éditer le fichier, lancez cette commande dans
> le terminal 3 :
>
> ```bash
> curl -s -X PATCH -H 'Content-Type: application/json' -d '{"available":false}' http://localhost:3000/availability/3
> ```
>
> La page passe de `Disponible : oui` à `Disponible : non` au tick suivant, et le compteur avance
> (`appels : 8 — dernier : 19:18:01`).
>
> Dans la console, une ligne `[chaos] GET /api/availability/3 +NNNms` apparaît toutes les 3 s
> environ. Une ligne `=> annulée` apparaît quand vous détruisez un volet en pleine requête
> (bascule A/B, changement de volet). Après avoir cliqué sur le logo, la seule nouvelle ligne en
> 10 s est `[chaos] GET /api/locations +586ms` (celle de l'accueil), à part éventuellement un
> `availability/3 => annulée` au moment de quitter la page.
>
> Pour remettre `true`, relancez le même `curl` avec `{"available":true}`, ou faites
> `npm run api:reset`.

<details>
<summary>Ce qu'on retient</summary>

- Le **temps** (polling, retry, backoff, websocket) est le domaine de RxJS : `timer` + `switchMap`
  + `takeUntilDestroyed`, et tout se compose.
- « Signals seuls » = `effect` + `setInterval` + `onCleanup` : ça marche, mais rien ne se
  compose et le nettoyage est manuel.
- La forme à retenir : **`rxResource({ stream: () => timer(0, 3000).pipe(switchMap(http)) })`**,
  le temps côté RxJS, l'état côté signals, le pont dans le composant.
</details>

---

➡️ [S6 — Filtres](06-FILTRES.md)
