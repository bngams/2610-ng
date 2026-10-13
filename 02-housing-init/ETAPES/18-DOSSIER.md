# 18 — Le dossier de candidature : un formulaire en plusieurs étapes

> Le formulaire de l'étape 12 est un brouillon : trois champs, aucune règle, et un envoi qui
> n'écrit qu'une ligne dans la console. Dans cette étape, vous le remplacez par un vrai **dossier
> de candidature** : trois étapes (votre identité, votre situation, un récapitulatif), des règles
> de validation avec leurs messages d'erreur, une liste de garants que l'on peut allonger ou
> raccourcir, et un envoi réel vers l'API, qui enregistre le dossier et lui donne un numéro. Vous
> restez sur les **formulaires réactifs** de l'étape 12, mais cette fois avec tout ce qui en fait
> l'outil des formulaires sérieux.

> **Notion nouvelle, guidage complet.** Comme aux étapes 15 et 16, chaque action sur chaque fichier
> est écrite, et chaque morceau de code est donné, avec un tableau qui l'explique. Gardez
> `npm run api` et `ng serve` lancés pendant toute l'étape, et la console du navigateur ouverte
> (F12, onglet *Console*) : l'intercepteur de l'étape 16 y écrira l'envoi du dossier.

## ✨ Ce que vous apprenez

- Les formulaires **typés** et `NonNullableFormBuilder` : des champs qui ne valent jamais `null`, et le `?? ''` de l'étape 12 qui disparaît.
- Des groupes imbriqués (`FormGroup` dans un `FormGroup`) et une liste de taille variable (`FormArray`).
- Les validateurs d'Angular (`required`, `email`, `pattern`, `min`) et un validateur écrit par vous.
- Afficher une erreur au bon moment : `touched`, `invalid`, `hasError()`, `markAllAsTouched()`.
- Un formulaire en plusieurs étapes, piloté par un `signal`, et un récapitulatif lu avec `getRawValue()` dans une variable de template `@let`.
- Le pont entre un formulaire réactif et les signals : `toSignal(form.statusChanges)`.
- Envoyer le dossier avec `http.post`, désactiver le bouton pendant l'envoi, afficher le numéro reçu.

> 📖 [Formulaires réactifs](https://angular.dev/guide/forms/reactive-forms) ·
> [Formulaires typés](https://angular.dev/guide/forms/typed-forms) ·
> [`@let` dans un template](https://angular.dev/guide/templates/variables) ·
> [Valider un formulaire](https://angular.dev/guide/forms/form-validation) ·
> [`Validators`](https://angular.dev/api/forms/Validators) ·
> [Envoyer des données avec `HttpClient`](https://angular.dev/guide/http/making-requests)

## 🧭 1 — Ce que vous allez construire

Le dossier se remplit en trois écrans, toujours sous la page de détail d'un logement. Voici ce que
vous verrez à la fin de l'étape, écran par écran :

```
Step 1 of 3            Step 2 of 3                 Step 3 of 3
Who are you?           Your situation              Check your application
 First Name             Monthly income              Camille Martin, camille@…
 Last Name              Move-in date                Monthly income: 2500, …
 Email                  Guarantor 1: name           Guarantors: 1
 Phone                  Guarantor 1: monthly income - Alex Martin (3200 per month)
                        [Remove this guarantor]
                        [Add a guarantor]
           [Next]       [Previous] [Next]           [Previous] [Send my application]
                                                          │
                                                          ▼  POST /applications
                                       « Application #1 received. We will get back to you soon. »
```

Derrière ces trois écrans, il n'y a qu'**un seul** formulaire, décrit dans la classe. Sa forme suit
celle du dossier : un groupe par étape, et dans le second une liste de garants. Voici l'arbre que
vous allez construire, avec les règles de chaque champ :

```
form                      (FormGroup, le dossier entier)
├── identity              (FormGroup)   <- l'écran 1
│   ├── firstName         obligatoire
│   ├── lastName          obligatoire
│   ├── email             obligatoire, au format email
│   └── phone             obligatoire, exactement 10 chiffres
└── situation             (FormGroup)   <- l'écran 2
    ├── monthlyIncome     obligatoire, supérieur à 0
    ├── moveInDate        obligatoire, dans le futur (votre propre validateur)
    └── guarantors        (FormArray)   0, 1 ou plusieurs garants
        └── { name : obligatoire, income : supérieur à 0 }
```

Pourquoi un groupe par écran ? Parce que le bouton **Next** ne doit vérifier que l'écran en cours :
un groupe a sa propre validité (`identity.invalid`), indépendante du reste du dossier. Et pourquoi
un **composant à part**, `ApplicationForm`, plutôt que de tout écrire dans `Details` ? Parce que le
dossier devient gros : `Details` affiche un logement, `ApplicationForm` gère une candidature, et
chacun reste lisible. `Details` ne lui transmet qu'une seule information, le numéro du logement,
par un `input()` comme à l'étape 5.

## 🗄️ 2 — Une collection `applications` dans l'API

json-server ne sert que les collections présentes dans `api/db.json` : pour l'instant, une seule,
`locations`. Pour qu'il accepte des dossiers, il lui faut une seconde collection, vide au départ.
Ouvrez `api/db.json`, allez tout en bas, et ajoutez la ligne `"applications": []` après le crochet
fermant de `locations`, **sans oublier la virgule** après ce crochet. La fin du fichier doit
ressembler à ceci :

```json
      "laundry": true
    }
  ],
  "applications": []
}
```

| Morceau | Rôle |
|---|---|
| `"applications"` | le nom de la collection, donc de l'URL : json-server servira `http://localhost:3000/applications` |
| `[]` | une liste vide : aucun dossier pour l'instant. json-server y ajoutera chaque dossier reçu, avec un `id` qu'il choisit lui-même (1, 2, 3…) |
| la virgule après `]` | en JSON, deux propriétés d'un objet sont séparées par une virgule ; l'oublier rend le fichier illisible pour json-server |

Inutile de relancer l'API : le script `api` contient `--watch`, json-server relit le fichier dès
que vous l'enregistrez.

> 💡 **Tester :** ouvrez http://localhost:3000/applications dans un nouvel onglet : la page affiche
> `[]`, une liste vide. Si elle affiche `{}` ou une page d'erreur, relisez la virgule.

## 🧾 3 — L'interface `Application`

Comme à l'étape 4 pour un logement, on décrit d'abord la forme d'un dossier avec une interface :
le service et le composant parleront alors du même type. Dans le second terminal, à la racine du
projet, générez-la :

```bash
ng generate interface application
```

La CLI crée un seul fichier, avec une interface vide :

```
CREATE src/app/application.ts (33 bytes)
```

Ouvrez `src/app/application.ts` et **remplacez tout son contenu** par celui-ci. Il décrit un
garant, puis le dossier complet, avec les mêmes groupes que l'arbre de la partie 1 :

```ts
export interface Guarantor {
  name: string;
  income: number;
}

export interface Application {
  id?: number;
  locationId: number;
  identity: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  situation: {
    monthlyIncome: number;
    moveInDate: string;
    guarantors: Guarantor[];
  };
}
```

| Morceau | Rôle |
|---|---|
| `Guarantor` | un garant : son nom et son revenu mensuel. Deux interfaces dans un fichier, c'est permis : on les exporte toutes les deux |
| `id?: number` | le `?` rend la propriété **facultative** : le dossier que vous envoyez n'a pas d'`id`, celui que json-server renvoie en a un |
| `locationId` | le numéro du logement visé ; il ne vient pas du formulaire mais de la page de détail |
| `identity: { … }` | un objet dans l'objet, comme le groupe `identity` du formulaire |
| `moveInDate: string` | une date saisie dans un `<input type="date">` arrive sous forme de texte `AAAA-MM-JJ`, par exemple `2026-11-01` |
| `guarantors: Guarantor[]` | un tableau de garants, éventuellement vide |

## 🌐 4 — Le service envoie le dossier

À l'étape 12, `submitApplication` ne faisait qu'écrire dans la console. Elle va maintenant envoyer
le dossier à l'API avec une requête **POST**, la méthode HTTP qui sert à créer une ressource.
Ouvrez `src/app/housing.service.ts` et faites-y trois modifications.

Ajoutez d'abord l'import de l'interface, sous celui de `HousingLocationInfo` :

```ts
import { Application } from './application';
```

Ajoutez ensuite l'adresse de la collection, sous la ligne `readonly url = …` :

```ts
  readonly applicationsUrl = `${environment.apiUrl}/applications`;
```

> ℹ️ Vous avez sauté l'étape 17, facultative ? Votre service n'importe pas `environment`. Écrivez
> alors l'adresse en dur, comme `url` : `readonly applicationsUrl = 'http://localhost:3000/applications';`.

Enfin, **remplacez toute la méthode `submitApplication`** (de `submitApplication(` jusqu'à son `}`
fermant, le `console.log` compris) par celle-ci :

```ts
  submitApplication(application: Application): Observable<Application> {
    return this.http.post<Application>(this.applicationsUrl, application);
  }
```

| Morceau | Rôle |
|---|---|
| `http.post<Application>(url, corps)` | prépare une requête POST ; le second argument est le **corps** de la requête, que `HttpClient` convertit en JSON lui-même |
| `<Application>` | le type de la réponse : json-server renvoie le dossier qu'il a enregistré, avec son `id` |
| `Observable<Application>` | comme pour `get` à l'étape 15, rien ne part tant que personne ne s'abonne : c'est le composant qui s'abonnera, au clic sur le bouton d'envoi |

La méthode garde son nom, mais elle attend maintenant **un** argument au lieu de trois. Or
`Details` l'appelle encore à l'ancienne.

> 💡 **Tester :** enregistrez. Le terminal de `ng serve` affiche
> `TS2554: Expected 1 arguments, but got 3.` (un code d'erreur TypeScript : l'appel ne correspond
> plus à la signature de la méthode) dans `details.ts`, sur l'appel à
> `submitApplication`. C'est attendu : la partie suivante retire l'ancien formulaire de `Details`,
> et l'erreur avec lui.

## 🧩 5 — Le composant `ApplicationForm`, branché dans `Details`

Le dossier aura son propre composant. Dans le second terminal, générez-le :

```bash
ng generate component application-form
```

La CLI crée le dossier `application-form/` avec ses deux fichiers, comme pour `Details` à
l'étape 10 :

```
CREATE src/app/application-form/application-form.css (0 bytes)
CREATE src/app/application-form/application-form.ts (248 bytes)
```

Le composant s'appelle `ApplicationForm`, et son sélecteur est `app-application-form`. Avant de le
remplir, on le met à sa place : dans `Details`, à la place de l'ancien formulaire. Ouvrez
`src/app/details/details.ts` et faites-y quatre modifications.

Remplacez d'abord la ligne d'import des formulaires,
`import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';`, par l'import du
nouveau composant : `Details` n'a plus besoin des formulaires, c'est `ApplicationForm` qui s'en
chargera.

```ts
import { ApplicationForm } from '../application-form/application-form';
```

Dans le `@Component`, remplacez de même `imports: [ReactiveFormsModule],` par la ligne suivante :

```ts
  imports: [ApplicationForm],
```

Dans le `template`, **supprimez tout le bloc `<form …>` … `</form>`** de la section
`listing-apply`, et mettez à sa place la balise du nouveau composant. La section doit devenir
celle-ci :

```html
      <section class="listing-apply">
        <h2 class="section-heading">Apply now to live here</h2>
        <app-application-form [locationId]="housingLocationId" />
      </section>
```

Enfin, dans la classe `Details`, **supprimez la propriété `applyForm`** (de `applyForm = new
FormGroup({` jusqu'à `});`) **et la méthode `submitApplication`** (jusqu'à son `}` fermant). La
classe ne garde que ses quatre premières lignes :

```ts
export class Details {
  route: ActivatedRoute = inject(ActivatedRoute);
  housingService = inject(HousingService);
  housingLocationId = Number(this.route.snapshot.params['id']);
  housingLocation = toSignal(this.housingService.getHousingLocationById(this.housingLocationId));
}
```

| Morceau | Rôle |
|---|---|
| `<app-application-form />` | affiche le composant, comme `<app-housing-location />` dans `Home` |
| `[locationId]="housingLocationId"` | liaison de propriété (étape 6) : `Details` transmet le numéro du logement, lu dans l'URL à l'étape 11 |
| `imports: [ApplicationForm]` | rend la balise `<app-application-form>` connue dans le template de `Details` |

Le `[locationId]` vise un input que le composant n'a pas encore : ouvrez
`src/app/application-form/application-form.ts` et, dans la classe vide `export class
ApplicationForm {}`, ajoutez-le. La classe devient :

```ts
export class ApplicationForm {
  readonly locationId = input.required<number>();
}
```

Ajoutez aussi `input` à l'import d'Angular, en haut du même fichier : la ligne devient
`import { Component, input } from '@angular/core';`.

Reste le style. Les règles des champs (`label`, `input`) sont dans `details.css` depuis l'étape 11,
mais un composant ne voit que **son** fichier CSS : les champs de `ApplicationForm` ne les
recevraient pas. Ouvrez [`assets/18/application-form.css`](../assets/18/application-form.css) :
il reprend ces trois règles à l'identique, et ajoute le soulignement rouge d'un champ invalide
déjà touché, les messages d'erreur en rouge, la ligne de progression, le titre de chaque écran,
les garants (un filet lavande à gauche), la rangée de boutons, les boutons secondaires blancs
(**Previous**, **Add a guarantor**), le bouton désactivé (à moitié transparent), la liste du
récapitulatif sans puces, et l'encadré de confirmation. Copiez
tout son contenu dans `src/app/application-form/application-form.css`, qui est vide. Puis, dans
`src/app/details/details.css`, **supprimez les trois règles devenues inutiles** : celle qui
commence par `label,` et `input {` (le `display: block`), celle de `label {` et celle de
`input {`, juste avant le bloc `@media`.

> 💡 **Tester :** le terminal de `ng serve` n'affiche plus d'erreur. Ouvrez un logement
> (`/details/5`) : sous **Apply now to live here**, l'ancien formulaire a disparu, remplacé par le
> texte `application-form works!` du composant généré. Le branchement fonctionne, il reste à
> écrire le dossier.

## 🧠 6 — Le modèle du formulaire

Comme à l'étape 12, le formulaire est d'abord un objet de la classe. Mais au lieu d'écrire
`new FormGroup(…)` et `new FormControl(…)` pour chaque champ, vous allez demander à Angular un
**constructeur de formulaires**, `NonNullableFormBuilder`, qui écrit tout cela pour vous, en plus
court et en mieux typé.

Pourquoi « non-nullable » ? À l'étape 12, `new FormControl('')` créait un champ de type
`string | null` : un `reset()` le remettait à `null`, d'où les `?? ''` dans `submitApplication`.
Avec `NonNullableFormBuilder`, chaque champ garde le type de sa valeur initiale (`string`,
`number`), et un `reset()` le ramène à cette valeur initiale, jamais à `null`. Le formulaire a
alors **exactement** la forme de l'interface `Application`. Lu avec `getRawValue()` (parties 10
et 12), il donne un objet complet, sans aucun `null` : les `?? ''` disparaissent.

Dans `src/app/application-form/application-form.ts`, **remplacez la ligne d'import** d'Angular par
ce bloc d'imports. Quelques noms ne serviront que dans les parties suivantes (`signal`, `toSignal`,
`finalize`) ; votre éditeur les grise en attendant, ce n'est pas une erreur.

```ts
import { Component, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { HousingService } from '../housing.service';
```

Dans le `@Component`, remplacez `imports: [],` par la ligne suivante, comme à l'étape 12 :

```ts
  imports: [ReactiveFormsModule],
```

Entre les imports et le `@Component`, ajoutez deux choses : un **type** qui décrit le formulaire
d'un garant, et votre **validateur** de date. Le mot-clé `type` donne un nom à un type, comme une
interface ; les `< >` précisent, comme pour `http.get<T>()` à l'étape 15, ce que contient un
`FormGroup` ou un `FormControl`. Les voici, à coller tels quels :

```ts
type GuarantorForm = FormGroup<{
  name: FormControl<string>;
  income: FormControl<number>;
}>;

function futureDate(control: AbstractControl<string>): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  return new Date(control.value) > new Date() ? null : { futureDate: true };
}
```

| Morceau | Rôle |
|---|---|
| `type GuarantorForm = FormGroup<{ … }>` | le type exact d'un garant dans le formulaire : un groupe de deux champs, l'un `string`, l'autre `number`. Il servira à typer la liste des garants, vide au départ (voir la classe) |
| `function futureDate(control)` | un **validateur** : une simple fonction qui reçoit le champ et renvoie `null` s'il est valide, ou un objet qui nomme l'erreur s'il ne l'est pas |
| `if (!control.value) return null` | champ vide : ce n'est pas à ce validateur de le signaler, `Validators.required` s'en charge. Chaque validateur vérifie **une** règle |
| `new Date(control.value) > new Date()` | `control.value` vaut par exemple `'2026-11-01'` ; `new Date('2026-11-01')` est le début de ce jour-là, `new Date()` l'instant présent. Plus grand signifie dans le futur |
| `{ futureDate: true }` | le nom de l'erreur : le template le testera avec `hasError('futureDate')` |

Passez à la classe. **Remplacez toute la classe `ApplicationForm`** (de `export class
ApplicationForm {` jusqu'à la dernière `}` du fichier) par celle-ci : elle garde votre input, et
ajoute le formulaire.

```ts
export class ApplicationForm {
  readonly locationId = input.required<number>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly housingService = inject(HousingService);

  readonly form = this.fb.group({
    identity: this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('[0-9]{10}')]],
    }),
    situation: this.fb.group({
      monthlyIncome: [0, [Validators.required, Validators.min(1)]],
      moveInDate: ['', [Validators.required, futureDate]],
      guarantors: this.fb.array<GuarantorForm>([]),
    }),
  });
  readonly identity = this.form.controls.identity.controls;
  readonly situation = this.form.controls.situation.controls;
  readonly guarantors = this.form.controls.situation.controls.guarantors;
}
```

| Morceau | Rôle |
|---|---|
| `inject(NonNullableFormBuilder)` | le constructeur de formulaires, fourni par Angular ; déclaré **avant** `form`, qui l'utilise (même règle qu'à l'étape 15) |
| `this.fb.group({ … })` | crée un `FormGroup` ; un groupe peut en contenir d'autres : `identity` et `situation` |
| `firstName: ['', Validators.required]` | la forme courte d'un champ : un tableau `[valeur initiale, validateur]`. Le builder en fait un `FormControl<string>` |
| `[Validators.required, Validators.email]` | plusieurs validateurs : un tableau ; le champ est valide s'ils le sont tous |
| `Validators.pattern('[0-9]{10}')` | le texte doit correspondre à cette expression régulière : 10 chiffres. Donnée sous forme de **texte**, Angular l'encadre lui-même par `^` et `$` : ni plus, ni moins de 10 chiffres (voir les pièges) |
| `monthlyIncome: [0, … Validators.min(1)]` | un champ `number`, à 0 au départ ; `min(1)` refuse 0 et les nombres négatifs |
| `moveInDate: ['', [Validators.required, futureDate]]` | votre validateur s'utilise exactement comme ceux d'Angular : on donne la fonction, sans parenthèses |
| `this.fb.array<GuarantorForm>([])` | un `FormArray` : une liste de groupes, vide au départ. Le `<GuarantorForm>` dit ce qu'elle contiendra ; sans lui, TypeScript ne pourrait pas le deviner d'une liste vide |
| `identity`, `situation`, `guarantors` | des raccourcis pour le template : `identity.email` au lieu de `form.controls.identity.controls.email` |
| `housingService` | servira à l'envoi, à la fin de l'étape |

> 💡 **Tester :** enregistrez. Le terminal de `ng serve` ne doit afficher aucune erreur, et la
> page affiche toujours `application-form works!` : le formulaire existe dans la classe, mais le
> template ne s'y branche pas encore. Survolez avec la souris le mot `identity` de la ligne
> `readonly identity = …` : votre éditeur indique `firstName: FormControl<string>`, sans `| null`.

## 🪜 7 — L'écran 1 et la navigation entre écrans

Le formulaire est prêt, il faut maintenant l'afficher, un écran à la fois. L'écran affiché est un
simple numéro, 1, 2 ou 3 : un `signal`, comme le texte de recherche de l'étape 15. Dans la classe,
ajoutez-le sous la ligne `readonly guarantors = …` :

```ts
  readonly step = signal(1);
```

Ajoutez ensuite trois méthodes, à la fin de la classe, avant sa dernière `}`. La première dit si
un champ doit montrer son erreur, les deux autres passent à l'écran suivant ou reviennent au
précédent :

```ts
  showErrors(control: AbstractControl): boolean {
    return control.touched && control.invalid;
  }

  next() {
    const current = this.step() === 1 ? this.form.controls.identity : this.form.controls.situation;
    if (current.invalid) {
      current.markAllAsTouched();
      return;
    }
    this.step.update((step) => step + 1);
  }

  prev() {
    this.step.update((step) => step - 1);
  }
```

| Morceau | Rôle |
|---|---|
| `control.touched && control.invalid` | on n'affiche une erreur que si le champ est invalide **et** que l'utilisateur y est passé (il l'a quitté au moins une fois). Sans `touched`, l'écran s'ouvrirait couvert de rouge avant toute saisie |
| `const current = … ? identity : situation` | le groupe de l'écran en cours : on ne vérifie que lui, pas tout le dossier |
| `current.markAllAsTouched()` | marque tous les champs du groupe comme « touchés » : les erreurs des champs que l'utilisateur a sautés s'affichent d'un coup |
| `return` | on reste sur l'écran tant qu'il est invalide |
| `this.step.update((step) => step + 1)` | passe à l'écran suivant ; `update` calcule la nouvelle valeur à partir de l'ancienne, comme le compteur de l'étape 16 |

Passez au template. Le composant généré a un template d'une ligne :
`` template: ` <p>application-form works!</p> `, ``. **Remplacez toute cette ligne** par celle-ci, qui
contient l'écran 1, les boutons, et deux commentaires qui marquent la place des écrans 2 et 3 :

```ts
  template: `
    <p class="progress">Step {{ step() }} of 3</p>
    <form [formGroup]="form">
      @if (step() === 1) {
        <fieldset formGroupName="identity">
          <legend>Who are you?</legend>
          <label for="first-name">First Name</label>
          <input id="first-name" type="text" formControlName="firstName" />
          @if (showErrors(identity.firstName)) {
            <p class="error">First name is required.</p>
          }

          <label for="last-name">Last Name</label>
          <input id="last-name" type="text" formControlName="lastName" />
          @if (showErrors(identity.lastName)) {
            <p class="error">Last name is required.</p>
          }

          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" />
          @if (showErrors(identity.email)) {
            @if (identity.email.hasError('required')) {
              <p class="error">Email is required.</p>
            } @else {
              <p class="error">Enter a valid email address.</p>
            }
          }

          <label for="phone">Phone</label>
          <input id="phone" type="tel" formControlName="phone" />
          @if (showErrors(identity.phone)) {
            @if (identity.phone.hasError('required')) {
              <p class="error">Phone is required.</p>
            } @else {
              <p class="error">Enter 10 digits, without spaces.</p>
            }
          }
        </fieldset>
      }

      <!-- ici viendra l'écran 2 -->

      <!-- ici viendra l'écran 3 -->

      <div class="actions">
        @if (step() > 1) {
          <button type="button" class="secondary" (click)="prev()">Previous</button>
        }
        @if (step() < 3) {
          <button type="button" class="primary" (click)="next()">Next</button>
        }
      </div>
    </form>
  `,
```

| Morceau | Rôle |
|---|---|
| `[formGroup]="form"` | relie la balise `<form>` au dossier entier, comme à l'étape 12 |
| `formGroupName="identity"` | « à l'intérieur de cette balise, on est dans le groupe `identity` » : les `formControlName` qui suivent y cherchent leur champ |
| `@if (step() === 1)` | l'écran 1 n'existe dans la page que si `step` vaut 1. Quand on passe à l'écran 2, ses `<input>` disparaissent, mais **pas les valeurs** : elles vivent dans `form`, dans la classe |
| `showErrors(identity.firstName)` | la méthode de la classe, appelée avec le champ ; `identity` est le raccourci déclaré en partie 6 |
| `identity.email.hasError('required')` | vrai si **cette** erreur-là est présente : on choisit le message selon la règle qui échoue |
| `<fieldset>` et `<legend>` | les balises HTML d'un groupe de champs et de son titre |
| `type="button"` | ces boutons ne doivent **pas** envoyer le formulaire : sans `type`, un bouton dans un `<form>` vaut `submit` |

> 💡 **Tester :** sur `/details/5`, le dossier affiche `Step 1 of 3`, les quatre champs et le
> bouton **Next**. Cliquez **Next** sans rien saisir : vous restez sur l'écran 1, et quatre
> messages apparaissent sous des champs soulignés de rouge (`First name is required.`, …,
> `Phone is required.`). Saisissez `Camille` et `Martin` comme prénom et nom, `camille.example.com` comme email et `06 12 34 56 78` comme
> téléphone : les messages deviennent `Enter a valid email address.` et
> `Enter 10 digits, without spaces.`. Corrigez (`camille@example.com`, `0612345678`), puis
> **Next** : `Step 2 of 3` s'affiche avec un bouton **Previous**, mais encore aucun champ, c'est
> la partie suivante. **Previous** ramène à l'écran 1 : vos quatre saisies sont toujours là.

Le soulignement rouge ne vient pas de votre code : Angular pose lui-même sur chaque champ des
classes CSS qui décrivent son état, et la feuille de style copiée en partie 5 s'en sert
(`input.ng-invalid.ng-touched`). Inspectez un champ (clic droit, *Inspecter*) pour les voir changer
pendant que vous tapez :

| Classe | Posée quand… |
|---|---|
| `ng-valid` / `ng-invalid` | le champ respecte / ne respecte pas ses validateurs |
| `ng-untouched` / `ng-touched` | l'utilisateur n'a pas encore quitté / a quitté le champ (ou `markAllAsTouched()` a été appelé) |
| `ng-pristine` / `ng-dirty` | la valeur n'a pas / a été modifiée par l'utilisateur |

## 🏠 8 — L'écran 2 : revenus et date d'emménagement

L'écran 2 suit le même schéma que l'écran 1, dans le groupe `situation`. Dans le template,
**remplacez la ligne `<!-- ici viendra l'écran 2 -->`** par ce bloc. Il contient à son tour un
commentaire, qui marque la place des garants (partie 9) :

```html
      @if (step() === 2) {
        <fieldset formGroupName="situation">
          <legend>Your situation</legend>
          <label for="monthly-income">Monthly income</label>
          <input id="monthly-income" type="number" formControlName="monthlyIncome" />
          @if (showErrors(situation.monthlyIncome)) {
            <p class="error">Enter a monthly income greater than 0.</p>
          }

          <label for="move-in-date">Move-in date</label>
          <input id="move-in-date" type="date" formControlName="moveInDate" />
          @if (showErrors(situation.moveInDate)) {
            @if (situation.moveInDate.hasError('required')) {
              <p class="error">Move-in date is required.</p>
            } @else {
              <p class="error">The move-in date must be in the future.</p>
            }
          }

          <!-- ici viendront les garants -->
        </fieldset>
      }
```

| Morceau | Rôle |
|---|---|
| `type="number"` | Angular convertit la saisie en nombre : `monthlyIncome` reste un `number`, pas un texte. Seule exception : un champ **vidé** vaut `null`, malgré le type ; `Validators.required` l'attrape, et le message s'affiche |
| `type="date"` | le navigateur affiche un calendrier, et la valeur arrive au format `AAAA-MM-JJ` attendu par `futureDate` |
| `@else` sous `moveInDate` | si le champ n'est pas vide mais reste invalide, c'est votre validateur `futureDate` qui a échoué |

> 💡 **Tester :** passez l'écran 1, puis cliquez **Next** sur l'écran 2 sans rien saisir (le revenu affiche `0`) : deux messages,
> `Enter a monthly income greater than 0.` et `Move-in date is required.`. Saisissez `2500`, puis
> la date du jour dans le calendrier : `The move-in date must be in the future.` (le début de la
> journée est déjà passé). Une date passée donne le même message. Choisissez une date dans le
> futur : le message disparaît, et **Next** mène à `Step 3 of 3`, encore vide.

## 👥 9 — Les garants : une liste qui s'allonge

Un garant est une personne qui s'engage à payer le loyer si le locataire ne le peut plus. Un
dossier peut n'en avoir aucun, ou plusieurs : leur nombre change pendant la saisie. C'est le rôle
d'un `FormArray`, une liste de groupes à laquelle on ajoute et on retire des éléments.

Dans la classe, ajoutez ces deux méthodes à la fin, après `prev()` :

```ts
  addGuarantor() {
    this.guarantors.push(
      this.fb.group({
        name: ['', Validators.required],
        income: [0, [Validators.required, Validators.min(1)]],
      }),
    );
  }

  removeGuarantor(index: number) {
    this.guarantors.removeAt(index);
  }
```

| Morceau | Rôle |
|---|---|
| `this.guarantors.push(groupe)` | ajoute un garant à la fin de la liste ; le groupe créé par `fb.group` a exactement le type `GuarantorForm`, c'est pourquoi TypeScript l'accepte |
| `removeAt(index)` | retire le garant à cette position (0 pour le premier) |
| les validateurs de chaque garant | chaque groupe ajouté apporte ses règles : un garant sans nom rend `situation` invalide, et bloque **Next** |

Dans le template, **remplacez la ligne `<!-- ici viendront les garants -->`** par ce bloc :

```html
          <div formArrayName="guarantors">
            @for (guarantor of guarantors.controls; track guarantor; let i = $index) {
              <div class="guarantor" [formGroupName]="i">
                <label [for]="'guarantor-name-' + i">Guarantor {{ i + 1 }}: name</label>
                <input [id]="'guarantor-name-' + i" type="text" formControlName="name" />
                @if (showErrors(guarantor.controls.name)) {
                  <p class="error">Name is required.</p>
                }

                <label [for]="'guarantor-income-' + i">Guarantor {{ i + 1 }}: monthly income</label>
                <input [id]="'guarantor-income-' + i" type="number" formControlName="income" />
                @if (showErrors(guarantor.controls.income)) {
                  <p class="error">Enter a monthly income greater than 0.</p>
                }

                <button type="button" class="secondary" (click)="removeGuarantor(i)">
                  Remove this guarantor
                </button>
              </div>
            }
          </div>
          <button type="button" class="secondary" (click)="addGuarantor()">Add a guarantor</button>
```

| Morceau | Rôle |
|---|---|
| `formArrayName="guarantors"` | « ici, on est dans la liste `guarantors` du groupe `situation` » |
| `@for (guarantor of guarantors.controls; …)` | parcourt les groupes de la liste ; `guarantors.controls` est un tableau de `GuarantorForm` |
| `track guarantor` | Angular reconnaît chaque garant par son groupe, pas par sa position : quand on retire le premier, le second garde ses champs et sa saisie |
| `let i = $index` | la position du garant ; elle sert au `[formGroupName]`, aux identifiants et au libellé |
| `[formGroupName]="i"` | entre crochets cette fois : dans une liste, un groupe se désigne par sa **position**, un nombre calculé, et non par un nom écrit en dur |
| `[id]="'guarantor-name-' + i"` | un identifiant différent par garant (`guarantor-name-0`, `guarantor-name-1`…), pour que chaque `<label for>` désigne le bon champ |

> 💡 **Tester :** sur l'écran 2, cliquez deux fois **Add a guarantor** : deux blocs apparaissent,
> `Guarantor 1: name` et `Guarantor 2: name`, chacun avec son revenu et son bouton
> **Remove this guarantor**. Cliquez **Next** : vous restez sur l'écran, et chaque garant affiche
> `Name is required.` et `Enter a monthly income greater than 0.`. Remplissez le premier
> (`Alex Martin`, `3200`), puis retirez le second avec son bouton **Remove this guarantor** : il
> disparaît, le premier garde sa saisie, et **Next** passe à l'écran 3.

## 📋 10 — L'écran 3 : le récapitulatif

Avant d'envoyer, l'utilisateur relit son dossier. Le récapitulatif n'a aucun champ : il lit les
valeurs du formulaire. Dans le template, **remplacez la ligne `<!-- ici viendra l'écran 3 -->`**
par ce bloc :

```html
      @if (step() === 3) {
        @let dossier = form.getRawValue();
        <section class="summary">
          <h3>Check your application</h3>
          <p>
            {{ dossier.identity.firstName }} {{ dossier.identity.lastName }},
            {{ dossier.identity.email }}, {{ dossier.identity.phone }}
          </p>
          <p>
            Monthly income: {{ dossier.situation.monthlyIncome }}, move-in date:
            {{ dossier.situation.moveInDate }}
          </p>
          <p>Guarantors: {{ dossier.situation.guarantors.length }}</p>
          <ul>
            @for (guarantor of dossier.situation.guarantors; track $index) {
              <li>{{ guarantor.name }} ({{ guarantor.income }} per month)</li>
            }
          </ul>
        </section>
      }
```

| Morceau | Rôle |
|---|---|
| `@let dossier = …` | déclare une variable **dans le template**, utilisable jusqu'à la fin du bloc `@if` : on évite d'écrire `form.getRawValue()` dix fois |
| `form.getRawValue()` | toutes les valeurs du dossier, sous la forme exacte de l'arbre : `{ identity: { … }, situation: { …, guarantors: [ … ] } }`, chaque champ avec son vrai type |
| `form.getRawValue()` dans le template | Angular la rappelle à chaque vérification de l'écran ; pour un petit formulaire, c'est sans conséquence |
| pourquoi pas `form.value` ? | `value` omet les champs **désactivés** ; TypeScript rend donc chacune de ses propriétés facultative (`string \| undefined`). `getRawValue()` les donne toutes, sans `undefined` (voir les pièges) |

> 💡 **Tester :** remplissez les deux écrans comme précédemment, avec un garant. L'écran 3
> affiche `Check your application`, puis
> `Camille Martin, camille@example.com, 0612345678`,
> `Monthly income: 2500, move-in date: 2026-11-01` (votre date), `Guarantors: 1` et
> `Alex Martin (3200 per month)`. **Previous** permet de corriger : le récapitulatif suit.

## 🌉 11 — Un pont entre le formulaire et les signals

Jusqu'ici, tout ce que vous avez lu dans le template, `step()` excepté, venait du formulaire :
`touched`, `invalid`, `hasError()`, `getRawValue()`. Ce ne sont **pas** des signals. Les
formulaires réactifs ont été conçus avant les signals, sur RxJS : chaque changement de valeur ou
d'état est publié dans un `Observable`, `form.valueChanges` ou `form.statusChanges`. Le template
les relit simplement à chaque événement (une frappe, un clic). En revanche, un `computed` ou tout
autre code construit sur les signals ne les voit pas changer (voir la manip plus bas).

Pour obtenir l'état du formulaire **sous forme de signal**, on utilise le même outil qu'à
l'étape 15, `toSignal`, sur `statusChanges`. Dans la classe, ajoutez cette ligne sous
`readonly step = signal(1);` :

```ts
  readonly status = toSignal(this.form.statusChanges, { initialValue: this.form.status });
```

| Morceau | Rôle |
|---|---|
| `this.form.statusChanges` | un `Observable` qui publie l'état du dossier entier à chaque changement : `'VALID'`, `'INVALID'` (ou `'PENDING'`, `'DISABLED'`, que ce lab n'utilise pas) |
| `toSignal(…)` | s'y abonne et en fait un signal, comme pour la liste des logements à l'étape 15 |
| `initialValue: this.form.status` | `statusChanges` ne publie qu'au **premier changement** : sans valeur initiale, le signal vaudrait `undefined` jusqu'à la première frappe |

Dans le template, affichez cet état dans la ligne de progression. **Remplacez la ligne**
`<p class="progress">Step {{ step() }} of 3</p>` par celle-ci :

```html
    <p class="progress">Step {{ step() }} of 3 · form status: {{ status() }}</p>
```

> 💡 **Tester :** rechargez `/details/5` : `Step 1 of 3 · form status: INVALID`. Remplissez
> correctement les quatre champs de l'écran 1 : l'état reste `INVALID`. C'est normal, et c'est
> exactement pourquoi `next()` ne vérifie que le groupe de l'écran en cours : le dossier entier
> est invalide tant que l'écran 2 est vide. Passez à l'écran 2 et remplissez-le : l'état passe à
> `VALID` dès que la date est correcte.

> **🧪 Manip — un `computed` ne voit pas le formulaire**
>
> 1. Ajoutez `computed` à l'import d'Angular, puis cette ligne sous `readonly status = …` :
>    `readonly formValid = computed(() => this.form.valid);`
> 2. Dans la ligne de progression, ajoutez à la fin, avant `</p>` :
>    `· formValid: {{ formValid() }} · form.valid: {{ form.valid }}`
> 3. Rechargez la page, remplissez les écrans 1 et 2 correctement, et observez la ligne.
>
> *Observé : à l'écran 2, une fois tout rempli, la ligne affiche
> `form status: VALID · formValid: false · form.valid: true`. `form.valid`, relu par le template
> à chaque frappe, est à jour ; `status()`, le signal du pont, aussi. Mais `formValid()` est resté
> bloqué à `false` : un `computed` ne se recalcule que lorsqu'un **signal** qu'il lit change, et
> `this.form.valid` n'en est pas un. Pour Angular, rien n'a changé.*
>
> Retirez la ligne `formValid`, l'ajout à la ligne de progression et l'import `computed` avant de
> continuer.

C'est la limite de fond des formulaires réactifs dans une application à base de signals : il faut
un pont comme `toSignal` pour chaque information dont on a besoin. Les **Signal Forms**, la
nouvelle API de formulaires d'Angular, n'ont pas ce problème : le formulaire y est construit sur
un signal, et chaque état (`valid()`, `touched()`, `errors()`…) est déjà un signal. L'encadré
« Deux époques » en fin d'étape vous en montre un aperçu.

## 📨 12 — Envoyer le dossier

Il reste le bouton d'envoi. Pendant l'envoi, il doit être désactivé (pour qu'un double clic ne
crée pas deux dossiers), et à la réponse, le formulaire laisse la place à une confirmation avec le
numéro du dossier. Deux nouveaux signals portent ces deux informations : ajoutez-les dans la
classe, sous la ligne `readonly status = …` :

```ts
  readonly sending = signal(false);
  readonly createdId = signal<number | undefined>(undefined);
```

Ajoutez ensuite la méthode d'envoi à la fin de la classe, après `removeGuarantor` :

```ts
  submit() {
    if (this.form.invalid || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.housingService
      .submitApplication({ locationId: this.locationId(), ...this.form.getRawValue() })
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe((created) => this.createdId.set(created.id));
  }
```

| Morceau | Rôle |
|---|---|
| `if (this.form.invalid \|\| this.sending())` | une sécurité : on n'envoie jamais un dossier invalide, ni deux fois le même pendant qu'il part |
| `{ locationId: …, ...this.form.getRawValue() }` | le dossier à envoyer : le numéro du logement, puis toutes les valeurs du formulaire, recopiées par l'opérateur `...` (*spread*). L'objet obtenu a la forme d'`Application`, sans `?? ''` ni conversion |
| `this.locationId()` | l'input est un signal : on le lit avec `()` |
| `.pipe(finalize(…))` | l'opérateur de l'étape 16 : quoi qu'il arrive (succès ou erreur), le bouton se réactive à la fin de la requête |
| `.subscribe((created) => …)` | **c'est l'abonnement qui envoie la requête** (un `Observable` est froid, étape 15) ; `created` est le dossier renvoyé par json-server, avec son `id` |
| `signal<number \| undefined>(undefined)` | pas encore de numéro : `undefined` ; le type est écrit entre `< >`, car TypeScript ne peut pas le deviner de `undefined` seul |

Le template change à trois endroits. D'abord, le formulaire doit appeler `submit()` à l'envoi,
comme à l'étape 12 : **remplacez la ligne** `<form [formGroup]="form">` par celle-ci :

```html
    <form [formGroup]="form" (submit)="submit()">
```

Ensuite, à l'écran 3, le bouton **Next** doit laisser la place au bouton d'envoi. Dans le bloc
`<div class="actions">`, **remplacez le second `@if`** (celui du bouton **Next**, de
`@if (step() < 3) {` jusqu'à son `}`) par ce bloc, qui ajoute un `@else` :

```html
        @if (step() < 3) {
          <button type="button" class="primary" (click)="next()">Next</button>
        } @else {
          <button type="submit" class="primary" [disabled]="status() !== 'VALID' || sending()">
            {{ sending() ? 'Sending…' : 'Send my application' }}
          </button>
        }
```

| Morceau | Rôle |
|---|---|
| `type="submit"` | le seul bouton qui envoie le formulaire : il déclenche `(submit)`, donc `submit()` |
| `(submit)` | gardé de l'étape 12. Vous lirez aussi `(ngSubmit)`, l'événement fourni par `ReactiveFormsModule` : il part au même moment, et c'est la forme qu'on trouve le plus souvent dans la documentation |
| `[disabled]="status() !== 'VALID' \|\| sending()"` | le bouton est grisé si le dossier n'est pas valide (lu par le pont de la partie 11) **ou** si un envoi est en cours |
| `sending() ? 'Sending…' : '…'` | une condition dans l'interpolation : le texte du bouton change pendant l'envoi |

Enfin, une fois le dossier enregistré, on remplace le formulaire par une confirmation. Il faut pour
cela **entourer** tout le contenu actuel du template (la ligne de progression et le `<form>`) d'un
`@if` / `@else`. Ajoutez ces trois lignes **au tout début** du template, juste après le
`` ` `` d'ouverture, avant la ligne `<p class="progress">` :

```html
    @if (createdId(); as id) {
      <p class="confirmation">Application #{{ id }} received. We will get back to you soon.</p>
    } @else {
```

Puis ajoutez une ligne avec une seule `}` **à la toute fin** du template, après `</form>` et avant
le `` ` `` de fermeture. Le template a maintenant cette structure (votre éditeur peut le
réindenter : Shift+Alt+F, ou Shift+Option+F sur Mac) :

```
@if (createdId(); as id) {
  <p class="confirmation"> … </p>     <- après l'envoi
} @else {
  <p class="progress"> … </p>         <- inchangé
  <form …> … </form>                  <- inchangé
}
```

| Morceau | Rôle |
|---|---|
| `@if (createdId(); as id)` | vrai dès que `createdId` contient un numéro ; `as id` donne un nom court à cette valeur dans le bloc |
| `@else { … }` | tant qu'aucun dossier n'est enregistré, on affiche le formulaire |

> 💡 **Tester :** remplissez le dossier jusqu'à l'écran 3 et cliquez **Send my application**.
> Le formulaire laisse place à l'encadré `Application #1 received. We will get back to you soon.`.
> Dans la console, votre intercepteur de l'étape 16 a écrit la requête :
>
> ```
> POST http://localhost:3000/applications => 201 (18 ms)
> ```
>
> Le code `201` signifie *Created* : json-server a créé le dossier. Ouvrez `api/db.json` : la
> collection `applications` contient votre dossier, avec `"locationId": 5`, vos deux groupes
> `identity` et `situation`, le garant, et `"id": 1` à la fin. Ouvrez aussi
> http://localhost:3000/applications : le même dossier, servi par l'API.

L'envoi est trop rapide pour voir le bouton désactivé. Pour l'observer, ralentissez l'API comme à
l'étape 16 : Ctrl+C dans le terminal de l'API, puis cette commande.

```bash
npm run api -- --delay 1500
```

> 💡 **Tester :** rechargez `/details/5`, remplissez un nouveau dossier et envoyez-le. Pendant une
> seconde et demie, le bouton affiche `Sending…` et reste grisé, et le bandeau **Loading…** de
> l'étape 16 apparaît sous le logo : votre intercepteur de chargement compte aussi les POST. Puis
> la confirmation affiche `Application #2 received. …`. Revenez ensuite à une API rapide : Ctrl+C,
> puis `npm run api`.

> ⚖️ **Ce que ce dossier simplifie.** Il ne gère pas l'échec de l'envoi : si l'API répond par une
> erreur, le bouton se réactive (grâce à `finalize`), mais l'utilisateur ne voit aucun message ;
> l'erreur n'apparaît qu'en rouge dans la console. Gérer les erreurs proprement est le sujet du lab
> avancé. Le validateur de date compare au début de la journée en temps universel : en France,
> entre minuit et 1 ou 2 h du matin, la date du jour passe encore. Enfin, un vrai dossier contient
> des données personnelles : une vraie API les recevrait en HTTPS, derrière une authentification,
> et ne les stockerait pas en clair dans un fichier comme le fait json-server.

## 📊 Deux époques : le même dossier en Signal Forms

Vous avez construit ce dossier avec les formulaires réactifs, l'API de référence sur les projets
Angular existants. Angular propose aussi les **Signal Forms** (`@angular/forms/signals`), où le
modèle **est** un signal et les règles sont déclarées à côté. Le début du même dossier s'y écrirait
ainsi :

```ts
readonly dossier = signal({ identity: { firstName: '', email: '' /* … */ } /* , situation … */ });
readonly dossierForm = form(this.dossier, (path) => { required(path.identity.firstName); email(path.identity.email); });
```

Dans le template, un champ se branche alors avec `<input [formField]="dossierForm.identity.firstName" />`,
et `dossierForm().valid()` est déjà un signal : plus besoin du pont `toSignal(statusChanges)`.

| | Formulaires réactifs (cette étape) | Signal Forms |
|---|---|---|
| Le modèle vit | dans un `FormGroup`, avec ses `FormControl` | dans un `signal` ordinaire, l'objet du dossier |
| L'état (`valid`, `touched`…) | des propriétés, et des `Observable` (`statusChanges`) | des signals : `valid()`, `touched()`, `errors()` |
| Avec `computed` | il faut un pont `toSignal` | directement |
| Aujourd'hui | la référence sur les projets existants | la nouvelle API d'Angular, vers laquelle migrer |

> 📖 [Signal Forms, vue d'ensemble](https://angular.dev/guide/forms/signals/overview) ·
> [La synthèse des formulaires](../../02-intro-forms/index.html) : les trois façons d'écrire un
> formulaire en Angular, côte à côte. Le lab avancé, lui, **migre exactement ce dossier** vers les
> Signal Forms, juste après sa mise en route.

## ⚠️ Pièges

> ⚠️ **`POST http://localhost:3000/applications => 404`.**
> Symptôme : au clic sur **Send my application**, rien ne change à l'écran ; la console affiche
> `Failed to load resource: … 404 (Not Found)`, la ligne de l'intercepteur avec `=> 404`, puis
> `ERROR {… status: 404, statusText: Not Found, url: http://localhost:3000/applications …}`.
> Cause : la collection `applications` n'existe pas dans `api/db.json` (partie 2 oubliée, ou
> fichier remplacé par [`assets/db.json`](../assets/db.json), la base de l'étape 14, qui ne la contient pas). json-server ne crée pas
> une collection inconnue.
> Correctif : ajoutez `"applications": []` à la fin de `api/db.json`, enregistrez, et renvoyez le
> dossier (le bouton s'est réactivé grâce à `finalize`).

> ⚠️ **`ERROR Error: Cannot find control with name: 'firstName'`.**
> Symptôme : la console affiche cette erreur, une fois par champ (`'lastName'`, `'email'`…), et
> les champs de l'écran 1 ne réagissent pas.
> Cause : il manque `formGroupName="identity"` sur le `<fieldset>`. Les `formControlName` cherchent
> alors `firstName` à la racine du dossier, où il n'y a que `identity` et `situation`.
> Correctif : `<fieldset formGroupName="identity">` (et `formGroupName="situation"` à l'écran 2).

> ⚠️ **`TS2345: Argument of type 'FormGroup<…>' is not assignable to parameter of type 'FormControl<unknown> | FormControl<unknown>[]'`.**
> Symptôme : erreur dans le terminal de `ng serve`, sur le `this.fb.group({` de `addGuarantor`.
> Cause : la liste a été créée avec `this.fb.array([])`, sans `<GuarantorForm>`. D'une liste vide,
> TypeScript ne peut pas deviner ce qu'elle contiendra, et choisit un type qui refuse les groupes.
> Correctif : `guarantors: this.fb.array<GuarantorForm>([])`.

> ⚠️ **`TS2345: … Type 'Partial<{ firstName: string; … }> | undefined' is not assignable to type '{ firstName: string; … }'`.**
> Symptôme : erreur sur l'appel à `submitApplication`, dans `submit()`.
> Cause : `...this.form.value` au lieu de `...this.form.getRawValue()`. `value` omet les champs
> désactivés : TypeScript rend donc chaque groupe et chaque champ facultatif, ce que l'interface
> `Application` refuse.
> Correctif : `...this.form.getRawValue()`.

> ⚠️ **Un téléphone de 14 chiffres est accepté.**
> Symptôme : `06123456789012` passe l'écran 1 sans erreur.
> Cause : le motif a été écrit comme une expression régulière JavaScript, `Validators.pattern(/[0-9]{10}/)`,
> au lieu d'un texte. Angular n'encadre par `^` et `$` que les motifs donnés **en texte** ; une
> expression régulière est utilisée telle quelle, et `/[0-9]{10}/` trouve bien 10 chiffres à la
> suite… parmi les 14.
> Correctif : `Validators.pattern('[0-9]{10}')`, ou `/^[0-9]{10}$/` avec les ancres écrites.

## Récap

- `inject(NonNullableFormBuilder)` : `fb.group({ champ: [valeur, validateurs] })`, des champs typés qui ne valent jamais `null`, donc plus de `?? ''`.
- Des groupes imbriqués (`formGroupName`) et une liste de groupes (`FormArray`, `formArrayName`, `[formGroupName]="i"`, `push`, `removeAt`).
- Un validateur est une fonction : `null` si c'est valide, `{ nomDeLErreur: true }` sinon ; le template la teste avec `hasError('nomDeLErreur')`.
- On affiche une erreur si `touched && invalid` ; `markAllAsTouched()` les révèle toutes avant de bloquer **Next**.
- `getRawValue()` donne le dossier complet et typé, prêt pour `http.post`.
- Un formulaire réactif n'est pas fait de signals : `toSignal(form.statusChanges)` sert de pont. Les Signal Forms suppriment ce pont.

➡️ Retour au [README](../README.md) pour le challenge final et les bonus.

Vous avez de l'avance ? Le lab avancé [02-housing-async](../../02-housing-async/) part de ce projet,
et, juste après sa mise en route, migre ce dossier vers les Signal Forms.
