# 📝 01 — Le dossier en Signal Forms

> **Scénario à réaliser en autonomie.** Vous arrivez avec le dossier de candidature de l'étape 18
> du lab Init : trois écrans, des règles de validation, une liste de garants, un envoi en `POST`.
> Il est écrit en formulaires réactifs (Reactive Forms), et l'étape 00 l'a fait passer par le proxy
> et par le chaos sans le modifier. Vous allez maintenant **réécrire le même dossier en Signal
> Forms**, l'API de formulaires d'Angular construite sur les signals, et garder les deux versions
> côte à côte pour les comparer. L'étape vous donne un squelette avec des `TODO`, des indices et
> les liens de doc ; le code complet est dans
> `solution/src/app/application-form/application-form-signals.ts`, à n'ouvrir qu'en cas de
> blocage.

Pour les trois façons d'écrire un formulaire en Angular (template, Reactive Forms, Signal Forms),
gardez ouverte la page de synthèse des formulaires,
[en ligne](https://bngams.github.io/2610-ng/02-intro-forms/) ou dans le dépôt
([`02-intro-forms/index.html`](../../02-intro-forms/index.html)) : sa partie 5 montre Signal Forms
sur une candidature plus courte, et un formulaire en plusieurs étapes.

## ✨ Objectifs

- Dire **où vit la valeur** d'un formulaire dans chaque API : dans des `FormControl`, ou dans un
  `signal` ordinaire.
- Déclarer un modèle avec `signal`, et toutes ses règles au même endroit avec `form(model, schéma)`
  : `required`, `email`, `pattern`, `min`, une règle maison avec `validate`, et `applyEach` pour une
  liste.
- Lire l'état d'un champ (`value()`, `valid()`, `errors()`, `touched()`) comme n'importe quel
  signal, y compris dans un `computed`, sans pont.
- Envoyer avec `submit(form, action)`, et observer sous le chaos ce qu'il fait d'un double clic et
  d'un 503.
- Savoir ce qui est utilisable sur votre projet v20, et ce qui ne l'est pas.

## 🧭 1 — Ce que vous avez : le dossier en formulaires réactifs

Avant de réécrire, rappelons comment le dossier de l'étape 18 est construit, puisque c'est
précisément ce qui va changer. Ouvrez `src/app/application-form/application-form.ts`. Le dossier y
est un arbre d'objets créés par `NonNullableFormBuilder`, et chaque feuille de l'arbre est un
`FormControl` qui **détient sa propre valeur** :

```
form (FormGroup)
├── identity (FormGroup)        firstName, lastName, email, phone : quatre FormControl<string>
└── situation (FormGroup)       monthlyIncome : FormControl<number>, moveInDate : FormControl<string>
    └── guarantors (FormArray)  un FormGroup<{ name, income }> par garant
```

Il n'y a pas d'objet « dossier » dans la classe : la valeur est éparpillée dans les contrôles, et
`form.getRawValue()` la reconstruit à la demande (le récapitulatif de l'écran 3, l'envoi). L'état
suit le même chemin. `form.valid`, `control.touched` ou `hasError()` sont des **propriétés**, que
le template relit à chaque événement, et chaque changement est aussi publié dans un `Observable`,
`statusChanges` ou `valueChanges`. Ce ne sont pas des signals : la manip de l'étape 18 a montré
qu'un `computed(() => this.form.valid)` ne se recalcule jamais. D'où le pont que vous avez écrit :

```ts
readonly status = toSignal(this.form.statusChanges, { initialValue: this.form.status });
```

Le tableau suivant résume les quatre mécanismes du dossier réactif que la migration va remplacer :

| Dans le dossier réactif | Ce que c'est |
|---|---|
| `fb.group({ … })`, `fb.array<GuarantorForm>([])` | l'arbre des contrôles, qui détient les valeurs |
| `Validators.required`, `futureDate`… | les règles, posées contrôle par contrôle, à la création |
| `toSignal(form.statusChanges, …)` | le pont vers les signals, pour le bouton d'envoi |
| `sending` + `finalize` + `if (this.sending()) return` | la garde contre le double envoi, écrite à la main |

## 🧠 2 — Le principe de Signal Forms

Signal Forms prend le problème dans l'autre sens : on écrit d'abord la **donnée**, un objet
ordinaire dans un `signal`, et le formulaire en est dérivé. Voici le principe sur deux champs,
avant le tableau des fonctions :

```ts
import { email, form, required } from '@angular/forms/signals';

// 1. la donnée : un signal ordinaire, c'est LUI la source de vérité
readonly model = signal({ firstName: '', email: '' });

// 2. le formulaire : form() dérive un arbre de champs du modèle, le schéma pose les règles
readonly f = form(this.model, (path) => {
  required(path.firstName, { message: 'First name is required.' });
  email(path.email, { message: 'Enter a valid email address.' });
});

// 3. dans le template : <input [formField]="f.firstName" /> lit le champ et écrit dans model
// 4. l'état d'un champ s'obtient en l'appelant : f.firstName().valid(), f.email().errors()…
```

Chaque morceau a son rôle, détaillé dans ce tableau. Toutes ces fonctions sont stables en v22 :
leurs types, dans `node_modules/@angular/forms/types/`, les marquent `@publicApi 22.0`, et c'est
là qu'il faut lire une signature quand la doc en ligne reste vague :

| API (`@angular/forms/signals`) | Rôle |
|---|---|
| `form(model, schéma)` | construit l'arbre de champs (`FieldTree`) à partir d'un `WritableSignal` ; le formulaire ne garde **aucune copie** : écrire dans un champ écrit dans `model` |
| `(path) => { … }` | le schéma : une fonction appelée une fois, qui reçoit `path`, le chemin vers chaque champ (`path.identity.email`), et y pose les règles |
| `required`, `email`, `min` | les règles prêtes à l'emploi ; la dernière option, `{ message }`, porte le texte de l'erreur |
| `pattern(path.x, /^…$/)` | une `RegExp` (ou une fonction qui en renvoie une), jamais une chaîne ; elle est testée telle quelle : voir le piège sur les ancres plus bas |
| `validate(path.x, ({ value }) => …)` | une règle maison : `undefined` si c'est valide, sinon une erreur `{ kind, message }` |
| `applyEach(path.liste, (item) => { … })` | applique le même schéma à chaque élément d'un tableau du modèle ; c'est ce qui remplace le `FormArray` |
| `FormField`, la directive `[formField]` | lie un `<input>` natif à un champ : lit la valeur, écrit à la saisie, marque « touché » quand on quitte le champ |
| `champ()` | l'état du champ, un objet de signals : `value()`, `valid()`, `invalid()`, `errors()`, `touched()`, `dirty()`, `submitting()`, et `markAsTouched()` |
| `submit(form, action)` | marque tout comme touché, lance `action` (qui renvoie une `Promise`) seulement si le formulaire est valide, et renvoie une `Promise<boolean>` |

> 📖 [Signal Forms, vue d'ensemble](https://angular.dev/guide/forms/signals/overview) ·
> [Les modèles](https://angular.dev/guide/forms/signals/models) ·
> [Validation](https://angular.dev/guide/forms/signals/validation) ·
> [État d'un champ](https://angular.dev/guide/forms/signals/field-state-management) ·
> [Envoi du formulaire](https://angular.dev/guide/forms/signals/form-submission) ·
> [Migrer depuis Reactive Forms](https://angular.dev/guide/forms/signals/migration)

## 🔀 3 — Deux fichiers et une bascule

Vous pourriez remplacer le dossier réactif. Il vaut mieux garder les deux : un nouveau fichier,
`application-form-signals.ts`, à côté de `application-form.ts`, et une bascule dans `Details`
pour choisir celui qui s'affiche. Trois raisons à ce choix :

- la comparaison reste **visible** : même page, mêmes écrans, même API, même chaos ; vous pouvez
  rejouer un scénario sur une version puis sur l'autre, et le dire au débrief ;
- le dossier réactif reste la **référence sur votre projet v20** (voir l'encadré en fin d'étape) :
  le supprimer, ce serait jeter la version que vous utiliserez lundi ;
- les étapes suivantes s'en servent : la reprise automatique (étape 08) doit épargner l'envoi des
  **deux** dossiers, et la factorisation (étape 09) les branche tous les deux sur le même service.

La bascule est un simple `@if` sur un signal : un seul des deux composants existe à la fois, et
changer de version **détruit** l'autre (les expériences, à partir de l'étape 02, reprendront ce
principe pour leurs volets RxJS et Signals). Une saisie en cours
est donc perdue quand vous basculez ; c'est voulu, chaque version repart de zéro.

Commencez par la bascule, dans `src/app/details/details.ts`. Ajoutez `signal` à l'import
d'Angular, et l'import du futur composant sous celui d'`ApplicationForm` :

```ts
import { Component, inject, signal } from '@angular/core';
// …
import { ApplicationForm } from '../application-form/application-form';
import { ApplicationFormSignals } from '../application-form/application-form-signals';
```

Dans le `@Component`, les `imports` reçoivent le second composant : `imports: [ApplicationForm,
ApplicationFormSignals],`. Dans le template, remplacez la ligne
`<app-application-form [locationId]="housingLocationId" />` de la section `listing-apply` par ce
bloc, qui affiche deux boutons puis l'une ou l'autre version :

```html
        <div class="form-switch">
          <button type="button" [class.on]="formVersion() === 'reactive'" (click)="formVersion.set('reactive')">
            Reactive Forms
          </button>
          <button type="button" [class.on]="formVersion() === 'signals'" (click)="formVersion.set('signals')">
            Signal Forms
          </button>
        </div>
        @if (formVersion() === 'reactive') {
          <app-application-form [locationId]="housingLocationId" />
        } @else {
          <app-application-form-signals [locationId]="housingLocationId" />
        }
```

Il reste à déclarer le signal de la bascule, en dernière ligne de la classe `Details`, sous
`housingLocation = …`. Il démarre sur `'signals'`, la version que vous écrivez :

```ts
  formVersion = signal<'reactive' | 'signals'>('signals');
```

Les deux boutons ont besoin d'un peu de style : un cadre, et un fond plein pour le bouton actif. Ajoutez ces
règles dans `src/app/details/details.css`, juste avant le bloc `@media` :

```css
.form-switch {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
}
.form-switch button {
  padding: 6px 12px;
  border: solid 1px var(--primary-color);
  background: white;
  color: var(--primary-color);
  border-radius: 8px;
}
.form-switch button.on {
  background: var(--primary-color);
  color: white;
}
```

Le build est rouge pour l'instant : `Details` importe un fichier qui n'existe pas encore. C'est la
partie suivante qui le crée.

## 🚧 4 — Écrire `ApplicationFormSignals`

Le nouveau composant reprend les écrans, les libellés et les messages du dossier réactif, à
l'identique : seule la mécanique change. Les règles à poser sont celles de l'étape 18 ; le tableau
suivant les rappelle, avec le message que le template affichera :

| Champ (`path.…`) | Règles | Message |
|---|---|---|
| `identity.firstName` | obligatoire | `First name is required.` |
| `identity.lastName` | obligatoire | `Last name is required.` |
| `identity.email` | obligatoire, puis format email | `Email is required.`, puis `Enter a valid email address.` |
| `identity.phone` | obligatoire, puis exactement 10 chiffres | `Phone is required.`, puis `Enter 10 digits, without spaces.` |
| `situation.monthlyIncome` | obligatoire, au moins 1 | `Enter a monthly income greater than 0.` (les deux règles) |
| `situation.moveInDate` | obligatoire, puis dans le futur (règle maison, `kind: 'futureDate'`) | `Move-in date is required.`, puis `The move-in date must be in the future.` |
| chaque garant : `name` | obligatoire | `Name is required.` |
| chaque garant : `income` | obligatoire, au moins 1 | `Enter a monthly income greater than 0.` |

Créez le fichier `src/app/application-form/application-form-signals.ts`. Sa première partie, les
imports, le type `Dossier` et le `@Component` avec son template, est donnée : copiez-la telle
quelle, puis lisez le tableau qui la suit.

```ts
import { Component, computed, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FieldTree,
  FormField,
  applyEach,
  email,
  form,
  min,
  pattern,
  provideSignalFormsConfig,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { NG_STATUS_CLASSES } from '@angular/forms/signals/compat';
import { firstValueFrom } from 'rxjs';
import { Application } from '../application';
import { HousingService } from '../housing.service';

/** Ce que le formulaire saisit : un dossier sans id (donné par l'API) ni locationId (donné par Details). */
type Dossier = Omit<Application, 'id' | 'locationId'>;

@Component({
  selector: 'app-application-form-signals',
  imports: [FormField],
  // Signal Forms ne pose pas les classes ng-invalid / ng-touched : on les demande, pour réutiliser
  // la feuille de style du dossier Reactive (input.ng-invalid.ng-touched).
  providers: [provideSignalFormsConfig({ classes: NG_STATUS_CLASSES })],
  styleUrl: './application-form.css',
  template: `
    @if (createdId(); as id) {
      <p class="confirmation">Application #{{ id }} received. We will get back to you soon.</p>
    } @else {
      <p class="progress">Step {{ step() }} of 3 · form valid: {{ dossier().valid() }}</p>
      <form novalidate (submit)="send($event)">
        @if (step() === 1) {
          <fieldset>
            <legend>Who are you?</legend>
            <label for="first-name">First Name</label>
            <input id="first-name" type="text" [formField]="dossier.identity.firstName" />
            @if (showErrors(dossier.identity.firstName)) {
              @for (error of dossier.identity.firstName().errors(); track error.kind) {
                <p class="error">{{ error.message }}</p>
              }
            }

            <label for="last-name">Last Name</label>
            <input id="last-name" type="text" [formField]="dossier.identity.lastName" />
            @if (showErrors(dossier.identity.lastName)) {
              @for (error of dossier.identity.lastName().errors(); track error.kind) {
                <p class="error">{{ error.message }}</p>
              }
            }

            <label for="email">Email</label>
            <input id="email" type="email" [formField]="dossier.identity.email" />
            @if (showErrors(dossier.identity.email)) {
              @for (error of dossier.identity.email().errors(); track error.kind) {
                <p class="error">{{ error.message }}</p>
              }
            }

            <label for="phone">Phone</label>
            <input id="phone" type="tel" [formField]="dossier.identity.phone" />
            @if (showErrors(dossier.identity.phone)) {
              @for (error of dossier.identity.phone().errors(); track error.kind) {
                <p class="error">{{ error.message }}</p>
              }
            }
          </fieldset>
        }

        @if (step() === 2) {
          <fieldset>
            <legend>Your situation</legend>
            <label for="monthly-income">Monthly income</label>
            <input id="monthly-income" type="number" [formField]="dossier.situation.monthlyIncome" />
            @if (showErrors(dossier.situation.monthlyIncome)) {
              @for (error of dossier.situation.monthlyIncome().errors(); track error.kind) {
                <p class="error">{{ error.message }}</p>
              }
            }

            <label for="move-in-date">Move-in date</label>
            <input id="move-in-date" type="date" [formField]="dossier.situation.moveInDate" />
            @if (showErrors(dossier.situation.moveInDate)) {
              @for (error of dossier.situation.moveInDate().errors(); track error.kind) {
                <p class="error">{{ error.message }}</p>
              }
            }

            @for (guarantor of dossier.situation.guarantors; track guarantor; let i = $index) {
              <div class="guarantor">
                <label [for]="'guarantor-name-' + i">Guarantor {{ i + 1 }}: name</label>
                <input [id]="'guarantor-name-' + i" type="text" [formField]="guarantor.name" />
                @if (showErrors(guarantor.name)) {
                  @for (error of guarantor.name().errors(); track error.kind) {
                    <p class="error">{{ error.message }}</p>
                  }
                }

                <label [for]="'guarantor-income-' + i">Guarantor {{ i + 1 }}: monthly income</label>
                <input [id]="'guarantor-income-' + i" type="number" [formField]="guarantor.income" />
                @if (showErrors(guarantor.income)) {
                  @for (error of guarantor.income().errors(); track error.kind) {
                    <p class="error">{{ error.message }}</p>
                  }
                }

                <button type="button" class="secondary" (click)="removeGuarantor(i)">
                  Remove this guarantor
                </button>
              </div>
            }
            <button type="button" class="secondary" (click)="addGuarantor()">Add a guarantor</button>
          </fieldset>
        }

        @if (step() === 3) {
          @let d = model();
          <section class="summary">
            <h3>Check your application</h3>
            <p>
              {{ d.identity.firstName }} {{ d.identity.lastName }}, {{ d.identity.email }},
              {{ d.identity.phone }}
            </p>
            <p>
              Monthly income: {{ d.situation.monthlyIncome }}, move-in date:
              {{ d.situation.moveInDate }}
            </p>
            <p>Guarantors: {{ d.situation.guarantors.length }}</p>
            <ul>
              @for (guarantor of d.situation.guarantors; track $index) {
                <li>{{ guarantor.name }} ({{ guarantor.income }} per month)</li>
              }
            </ul>
          </section>
          @if (sendError()) {
            <p class="error">Sending failed ({{ sendError() }}). Please try again.</p>
          }
        }

        <div class="actions">
          @if (step() > 1) {
            <button type="button" class="secondary" (click)="prev()">Previous</button>
          }
          @if (step() < 3) {
            <button type="button" class="primary" (click)="next()">Next</button>
          } @else {
            <button type="submit" class="primary" [disabled]="!canSend()">
              {{ dossier().submitting() ? 'Sending…' : 'Send my application' }}
            </button>
          }
        </div>
      </form>
    }
  `,
})
```

Ce début de fichier encode plusieurs choix qu'il faut comprendre avant d'écrire la classe :

| Morceau | Pourquoi |
|---|---|
| `type Dossier = Omit<Application, 'id' \| 'locationId'>` | le modèle a la forme de l'`Application` du lab Init, moins ce que le formulaire ne saisit pas : l'`id` (donné par l'API) et le `locationId` (donné par `Details`) |
| `imports: [FormField]` | la directive de `[formField]` ; c'est le seul import de template : plus de `ReactiveFormsModule`, plus de `formGroupName` ni de `formArrayName`, chaque `<input>` désigne son champ par son chemin complet |
| `providers: [provideSignalFormsConfig({ classes: NG_STATUS_CLASSES })]` | Signal Forms ne pose **pas** les classes `ng-invalid` / `ng-touched` par défaut ; cette ligne les rétablit pour ce composant, et la feuille `application-form.css` du dossier réactif, partagée par `styleUrl`, souligne de nouveau en rouge les champs invalides |
| `@for (error of champ().errors(); track error.kind)` | les messages viennent du schéma (`{ message }`), le template n'a plus de `hasError('required')` à tester : il affiche les erreurs présentes |
| `@for (guarantor of dossier.situation.guarantors; track guarantor; …)` | un champ tableau se parcourt directement ; `guarantor.name` est le champ du nom de ce garant |
| `@let d = model()` | le récapitulatif lit le modèle lui-même : plus de `getRawValue()`, la donnée est déjà là, sous la forme exacte d'un `Dossier` |
| `<form novalidate (submit)="send($event)">` | sans `ReactiveFormsModule`, plus personne n'empêche le navigateur de recharger la page à l'envoi : `send()` appelle `event.preventDefault()` ; `novalidate` coupe les bulles de validation du navigateur, puisque le schéma pose aussi l'attribut `required` sur les champs |

La seconde partie du fichier est la classe, à compléter. Collez-la sous le `@Component`, puis
remplissez les sept `TODO` :

🚧 **À compléter :**

```ts
export class ApplicationFormSignals {
  readonly locationId = input.required<number>();
  private readonly housingService = inject(HousingService);

  // TODO 1 : `model`, un signal<Dossier> qui contient le dossier vide : les mêmes valeurs de départ
  //          que le formulaire réactif ('' pour les textes, 0 pour le revenu, [] pour les garants).

  // TODO 2 : `dossier = form(this.model, (path) => { … })` : toutes les règles du tableau, avec
  //          leurs messages ; validate() pour la date, applyEach() pour les garants.

  readonly step = signal(1);
  readonly createdId = signal<number | undefined>(undefined);
  readonly sendError = signal('');

  // TODO 3 : `canSend`, un computed vrai quand le dossier est valide ET qu'aucun envoi n'est en cours.

  showErrors(field: FieldTree<unknown>): boolean {
    return field().touched() && field().invalid();
  }

  next() {
    // TODO 4 : le champ de l'écran courant (this.dossier.identity ou this.dossier.situation) ;
    //          s'il est invalide, markAsTouched() puis return ; sinon, step + 1.
  }

  prev() {
    this.step.update((step) => step - 1);
  }

  addGuarantor() {
    // TODO 5 : this.model.update(…) qui ajoute { name: '', income: 0 } à la fin de situation.guarantors.
  }

  removeGuarantor(index: number) {
    // TODO 6 : this.model.update(…) qui retire le garant à cette position.
  }

  async send(event: Event) {
    event.preventDefault();
    this.sendError.set('');
    // TODO 7 : dans un try, `const accepted = await submit(this.dossier, async () => { … })` :
    //          l'action envoie { locationId: this.locationId(), ...this.model() }
    //          avec firstValueFrom(this.housingService.submitApplication(…))
    //          puis pose createdId ; si !accepted :
    //          console.log('[dossier] submit() a refusé : dossier invalide, ou envoi déjà en cours').
    //          Dans le catch, sendError reçoit `${error.status} ${error.statusText}` (HttpErrorResponse).
  }
}
```

Le build reste rouge tant que les `TODO 1` à `3` ne sont pas écrits : le template lit `model`,
`dossier` et `canSend`. Voici quelques indices pour chacun des sept `TODO` :

- **TODO 1.** `signal<Dossier>({ identity: { … }, situation: { … } })` : une seule valeur de départ,
  pour tout le dossier. C'est l'objet que `getRawValue()` reconstruisait.
- **TODO 2.** Le schéma reçoit `path` ; `required(path.identity.firstName, { message: '…' })` pose
  une règle. `pattern` attend une `RegExp`, pas une chaîne : écrivez `/^[0-9]{10}$/`, **avec** `^` et `$`
  (voir le piège 1). Pour la date, `validate(path.situation.moveInDate, ({ value }) => …)` : lisez
  `value()`, renvoyez `undefined` si le champ est vide ou dans le futur, sinon
  `{ kind: 'futureDate', message: '…' }` ; c'est la fonction `futureDate` de l'étape 18, sans le
  `AbstractControl`. Pour les garants, `applyEach(path.situation.guarantors, (guarantor) => { … })`
  reçoit le chemin d'**un** garant : `guarantor.name`, `guarantor.income`.
- **TODO 3.** `computed(() => this.dossier().valid() && !this.dossier().submitting())` : c'est le
  `computed` qui restait bloqué à `false` dans la manip de l'étape 18. Ici, il marche, parce que
  `valid()` et `submitting()` **sont** des signals.
- **TODO 4.** Même logique que `next()` dans le dossier réactif. `this.dossier.identity` est un
  champ comme un autre : `this.dossier.identity().invalid()` dit si l'écran 1 est valide, et
  `markAsTouched()` marque le champ et tous ses descendants, comme `markAllAsTouched()`.
- **TODO 5 et 6.** On ne passe plus par une API de formulaire : on modifie le modèle, et l'arbre de
  champs suit. Un `signal` attend un **nouvel** objet : recopiez chaque niveau avec `...`
  (`{ ...d, situation: { ...d.situation, guarantors: [...] } }`), et retirez avec
  `guarantors.filter((_, i) => i !== index)`.
- **TODO 7.** L'action de `submit()` doit renvoyer une `Promise`, alors que `submitApplication`
  renvoie un `Observable` : `firstValueFrom(obs$)` (importé de `rxjs`) s'y abonne et rend une
  `Promise` de la première valeur. C'est le pont dans l'autre sens. Si la requête échoue,
  `firstValueFrom` rejette, `submit()` rejette à son tour, et le `catch` de `send()` récupère la
  `HttpErrorResponse`.

> 📖 [form](https://angular.dev/api/forms/signals/form) ·
> [validate](https://angular.dev/api/forms/signals/validate) ·
> [applyEach](https://angular.dev/api/forms/signals/applyEach) ·
> [submit](https://angular.dev/api/forms/signals/submit) ·
> [firstValueFrom](https://rxjs.dev/api/index/function/firstValueFrom) ·
> [Classes de statut automatiques](https://angular.dev/guide/forms/signals/migration)

Deux différences avec le dossier réactif font tomber presque tout le monde. Les voici sous forme
de pièges, avec la cause et le correctif.

⚠️ **Piège 1 : un téléphone de 14 chiffres est accepté.**

- *Symptôme :* `06123456789012` passe l'écran 1 sans erreur.
- *Cause :* `pattern(path.identity.phone, /[0-9]{10}/)` sans ancres. `Validators.pattern('[0-9]{10}')`
  encadrait lui-même un motif **texte** par `^` et `$` ; `pattern` de Signal Forms attend
  une `RegExp` (jamais une chaîne) et la teste telle quelle (`pattern.test(value)`), et `/[0-9]{10}/` trouve bien
  dix chiffres à la suite… parmi les quatorze.
- *Correctif :* `/^[0-9]{10}$/`.

⚠️ **Piège 2 : un revenu effacé ne montre aucune erreur.**

- *Symptôme :* à l'écran 2, videz le champ du revenu : aucun message, et le champ semble valide.
- *Cause :* un `<input type="number">` vidé écrit `null` dans le modèle, comme en formulaires
  réactifs, et `min` **ignore** `null` (son code commence par `if (value === null …) return
  undefined`). Avec `min` seul, un champ vide passe.
- *Correctif :* posez aussi `required` sur `monthlyIncome` (et sur l'`income` de chaque garant),
  avec le même message : `required` attrape le `null`, `min` attrape le `0`.

## 💡 5 — Tester le dossier

Le parcours de test est celui de l'étape 18, rejoué sur la version Signal Forms. Ouvrez
`/details/5` : la bascule est sur **Signal Forms**, et la ligne de progression affiche
`Step 1 of 3 · form valid: false`.

> 💡 **Tester :**
>
> 1. **Next** sur l'écran 1 vide : quatre messages (`First name is required.` … `Phone is
>    required.`), les champs soulignés de rouge, et l'écran ne change pas.
> 2. `camille.example.com` et `06 12 34 56 78` : `Enter a valid email address.` et
>    `Enter 10 digits, without spaces.`. Puis `06123456789012` : toujours refusé (piège 1).
> 3. `Camille`, `Martin`, `camille@example.com`, `0612345678`, **Next** : `Step 2 of 3`.
> 4. **Next** sur l'écran 2 vide : `Enter a monthly income greater than 0.` et
>    `Move-in date is required.`. Videz le revenu : le message reste (piège 2).
> 5. `2500` et la date du jour : `The move-in date must be in the future.`. Une date future : le
>    message disparaît, et la ligne passe à `form valid: true`.
> 6. Deux fois **Add a guarantor**, puis **Next** : chaque garant affiche `Name is required.` et
>    `Enter a monthly income greater than 0.`, et `form valid` repasse à `false`. Remplissez le
>    second, retirez le premier : le second garde sa saisie, et devient `Guarantor 1`.
> 7. **Next** : le récapitulatif affiche `Camille Martin, camille@example.com, 0612345678`,
>    `Monthly income: 2500, move-in date: …`, `Guarantors: 1` et le garant.
> 8. **Send my application** : `Sending…` le temps du chaos, puis
>    `Application #… received. We will get back to you soon.`. La console montre
>    `[chaos] POST /api/applications +675ms` puis `POST /api/applications => 201 (703 ms)`.
>
> Le dossier enregistré (`curl -s http://localhost:3000/applications`) a exactement la forme de
> celui du dossier réactif : `locationId`, `identity`, `situation.guarantors`, puis l'`id`.

## 🌪️ 6 — L'envoi sous pression

Le chaos de l'étape 00 ne fait pas que ralentir les lectures : le `POST` du dossier y passe aussi.
C'est l'occasion de comparer, en trois situations courtes, ce que les deux versions font d'un envoi
difficile. La reprise automatique des erreurs n'arrive qu'à l'étape 08 : ici, on observe seulement.

**La latence.** Avec la latence par défaut (300 à 1500 ms), le bouton affiche `Sending…` et reste
grisé : `canSend()` lit `submitting()`, qui vaut `true` pendant toute l'action de `submit()`. Le
dossier réactif obtient le même effet avec son signal `sending` et `finalize`, écrits à la main.

**Le double clic.** Le bouton grisé suffit à l'empêcher ; pour voir ce que fait `submit()` sans
lui, faites cette manip.

> **🧪 Manip — un double clic sans bouton grisé**
>
> 1. Dans le template, retirez `[disabled]="!canSend()"` du bouton **Send my application**.
> 2. Remplissez le dossier jusqu'à l'écran 3, et double-cliquez sur le bouton.
> 3. Observez la console et `curl -s http://localhost:3000/applications`.
>
> *Observé : une ligne `[dossier] submit() a refusé : dossier invalide, ou envoi déjà en cours`,
> puis **un seul** `POST /api/applications => 201`, et un seul nouveau dossier en base. `submit()`
> refuse un envoi tant qu'un autre est en cours (« Concurrent submissions are prohibited », dans
> sa documentation) et renvoie alors `false` sans lancer l'action : c'est le comportement
> d'`exhaustMap`, que vous verrez sur la réservation à l'étape 05, intégré au formulaire.*
>
> Remettez `[disabled]="!canSend()"` avant de continuer.

**Le 503.** Pour faire échouer l'envoi à coup sûr, ajoutez provisoirement cette règle **en tête**
du tableau `CHAOS_RULES` de `src/app/chaos/chaos.config.ts` :

```ts
  { match: /\/api\/applications/, minDelayMs: 300, maxDelayMs: 1500, errorRate: 1 },
```

Envoyez ensuite un dossier depuis chaque version, en basculant entre les deux, et comparez :

| | Signal Forms | Reactive Forms (étape 18) |
|---|---|---|
| Écran | `Sending failed (503 Service Unavailable (chaos)). Please try again.` sous le récapitulatif | rien : l'écran 3 reste tel quel |
| Bouton | réactivé (`submitting()` repasse à `false` dans le `finally` de `submit()`) | réactivé (`finalize`) |
| Console | `[chaos] POST /api/applications => 503 (après 428 ms)` puis `POST /api/applications => 503 (431 ms)` | les deux mêmes lignes, puis une erreur rouge `ERROR {headers: HttpHeaders, status: 503, …}` : le `subscribe` n'a pas de gestion d'erreur |

L'écart ne tient pas à l'API de formulaire : le `catch` de `send()` aurait son équivalent en
réactif (un `error:` dans le `subscribe`). Mais `submit()` vous **oblige** à y penser, puisque son
action rejette. Retirez la règle des dossiers avant de continuer. Retenez aussi que ce `POST` ne
doit jamais être rejoué automatiquement : un dossier envoyé deux fois, ce sont deux candidatures.
L'étape 08 en tiendra compte.

## 📊 7 — Reactive Forms ou Signal Forms ?

Vous avez maintenant le même dossier écrit deux fois. Ce tableau met en regard les deux versions,
critère par critère :

| | Reactive Forms (`application-form.ts`) | Signal Forms (`application-form-signals.ts`) |
|---|---|---|
| Source de vérité | les `FormControl` de l'arbre ; `getRawValue()` reconstruit l'objet | un `signal<Dossier>` ordinaire ; le formulaire n'en garde aucune copie |
| Typage | `NonNullableFormBuilder` et un type `GuarantorForm` écrit à la main pour le `FormArray` | déduit du modèle : `Omit<Application, …>` suffit, aucun type de formulaire à écrire |
| Où sont les règles | dans chaque contrôle, à sa création (`['', Validators.required]`), plus un validateur à part | dans **un** schéma, à côté du modèle, messages compris |
| Listes | `FormArray`, `push(fb.group(…))`, `removeAt(i)`, `formArrayName` / `[formGroupName]="i"` | un tableau du modèle, `model.update(…)`, `applyEach` pour les règles, `@for` sur le champ |
| État asynchrone de l'envoi | `sending` + `finalize` + une garde, à la main | `submitting()`, et `submit()` refuse l'envoi concurrent |
| Pont vers les signals | `toSignal(statusChanges)` pour chaque état utile ; un `computed` ne voit rien sans lui | aucun : tout l'état est fait de signals. Le seul pont est dans l'autre sens, `firstValueFrom` pour envoyer un `Observable` |
| Disponible en v20 | oui, stable depuis la v2 | **non** (voir l'encadré) |

Remplissez maintenant deux lignes de la [grille](../GRILLE.md). La ligne « Formulaire => état »,
côté Signals et Pont : la recherche (étape 02) et les filtres (étape 07) la compléteront côté
RxJS. Et la ligne « File ou anti-rebond d'action », côté Signals : `submit()` refuse l'envoi
concurrent ; la réservation (étape 05) complétera les autres colonnes.

> 🗓️ **Sur votre projet v20.** Signal Forms **n'existe pas** en v20 : `@angular/forms/signals`
> n'y est pas publié. Le changelog d'Angular donne les trois dates à retenir :
>
> | Version | Ce que dit le [changelog](https://github.com/angular/angular/blob/main/CHANGELOG.md) |
> |---|---|
> | 21.0.0 (2025-11-19) | « add experimental signal-based forms » : l'API arrive, **expérimentale** |
> | 21.0.9 (2026-01-14) | « Rename signal form [field] to [formField] » : la directive change de nom en cours de version |
> | 22.0.0 (2026-06-03) | « graduate signal forms APIs to public API » : l'API devient **stable** |
>
> Le renommage de 21.0.9 montre ce que veut dire « expérimental » : une montée de version
> corrective a cassé tous les templates. Sur votre projet v20, le dossier réactif reste donc la
> bonne réponse, avec `toSignal(statusChanges)` comme pont. Le jour où vous passez en v22, la
> migration peut se faire écran par écran : le guide
> [Migrer depuis Reactive Forms](https://angular.dev/guide/forms/signals/migration) décrit les
> outils d'interopérabilité de `@angular/forms/signals/compat`, d'où vient `NG_STATUS_CLASSES`.

## Récap

- En Reactive Forms, la valeur vit dans les `FormControl` ; en Signal Forms, elle vit dans un
  `signal` ordinaire, et `form(model, schéma)` en dérive les champs.
- Toutes les règles tiennent dans un schéma : `required`, `email`, `pattern` (avec `^` et `$`),
  `min` (plus `required` contre le `null`), `validate` pour une règle maison, `applyEach` pour une
  liste.
- L'état d'un champ est fait de signals (`valid()`, `errors()`, `touched()`, `submitting()`) : un
  `computed` les lit sans pont.
- `submit(form, action)` valide, marque tout comme touché, refuse l'envoi concurrent et attend une
  `Promise` : `firstValueFrom` y fait entrer l'`Observable` du service.
- Sur un projet v20, Reactive Forms + `toSignal` reste la réponse ; Signal Forms est stable à
  partir de la v22.

---

➡️ [02 — Recherche : anti-rebond et annulation](02-RECHERCHE.md)
