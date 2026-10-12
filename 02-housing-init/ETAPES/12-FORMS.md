# 12 — Le formulaire : candidater pour un logement

> Sous la page de détail, un formulaire « Apply now » : prénom, nom, email. À l'envoi, les valeurs
> partent au service, qui les écrit dans la console du navigateur (pas d'envoi réseau dans ce lab).
> Vous découvrez les **formulaires réactifs** : le formulaire est d'abord un objet TypeScript, le
> HTML s'y branche.

## ✨ Ce que vous apprenez

- `FormGroup` et `FormControl` : décrire un formulaire côté classe.
- `[formGroup]`, `formControlName`, `(submit)` : le brancher côté template.
- Lire les valeurs : `this.applyForm.value.firstName`.

> 📖 Étape officielle : [12-forms](https://angular.dev/tutorials/first-app/12-forms) ·
> [Formulaires réactifs](https://angular.dev/guide/forms/reactive-forms) ·
> [Événements](https://angular.dev/guide/templates/event-listeners)

## 🧱 1 — La méthode du service

Dans `src/app/housing.service.ts`, ajoutez cette méthode à la fin de la classe `HousingService`,
après `getHousingLocationById` :

```ts
  submitApplication(firstName: string, lastName: string, email: string) {
    console.log(
      `Homes application received: firstName: ${firstName}, lastName: ${lastName}, email: ${email}.`,
    );
  }
```

## 🧠 2 — Le formulaire côté classe

Dans `src/app/details/details.ts`, ajoutez l'import des formulaires sous les autres imports, et
**ajoutez la ligne** `imports: [ReactiveFormsModule],` dans le `@Component`, sous `selector` (ce
`@Component` n'avait pas encore de ligne `imports`) :

```ts
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
```

```ts
  imports: [ReactiveFormsModule],
```

Puis, dans la classe `Details`, ajoutez la propriété `applyForm` **avant** le constructeur, et la
méthode `submitApplication` **après** :

```ts
  applyForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    email: new FormControl(''),
  });
```

```ts
  submitApplication() {
    this.housingService.submitApplication(
      this.applyForm.value.firstName ?? '',
      this.applyForm.value.lastName ?? '',
      this.applyForm.value.email ?? '',
    );
  }
```

| Morceau | Rôle |
|---|---|
| `FormGroup` | le formulaire entier : un groupe de champs nommés |
| `new FormControl('')` | un champ, avec sa valeur initiale (ici une chaîne vide) ; son type est déduit : `string` |
| `ReactiveFormsModule` | ce qui rend `[formGroup]` et `formControlName` connus dans le template |
| `this.applyForm.value.firstName` | la valeur saisie ; son type est `string | null` (un `reset()` remet `null`), d'où le `?? ''` : « sinon chaîne vide » |

## 🧩 3 — Le formulaire côté template

Dans le `template` de `Details`, ajoutez une dernière `<section>` à l'intérieur de `<article>`,
après `</section>` de `listing-features` :

```html
      <section class="listing-apply">
        <h2 class="section-heading">Apply now to live here</h2>
        <form [formGroup]="applyForm" (submit)="submitApplication()">
          <label for="first-name">First Name</label>
          <input id="first-name" type="text" formControlName="firstName" />

          <label for="last-name">Last Name</label>
          <input id="last-name" type="text" formControlName="lastName" />

          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" />
          <button type="submit" class="primary">Apply now</button>
        </form>
      </section>
```

| Morceau | Rôle |
|---|---|
| `[formGroup]="applyForm"` | relie la balise `<form>` à l'objet `applyForm` de la classe |
| `formControlName="firstName"` | relie ce `<input>` au `FormControl` du même nom ; ce que vous tapez met l'objet à jour |
| `(submit)="submitApplication()"` | liaison d'événement : à l'envoi du formulaire (bouton ou touche Entrée), appelle la méthode |
| `type="submit"` | c'est ce bouton qui déclenche `submit` |

> 💡 **Tester :** ouvrez la console du navigateur (F12, onglet *Console*), allez sur un logement,
> remplissez les trois champs et cliquez **Apply now** : la console affiche
> `Homes application received: firstName: Camille, lastName: …, email: ….` La page ne se recharge pas.

## 📊 Deux époques, et une troisième qui arrive

| | Formulaires par template (`ngModel`) | Formulaires réactifs (ce lab) | Signal Forms |
|---|---|---|---|
| Le modèle vit | dans le HTML | dans la classe (`FormGroup`) | dans un `signal` |
| Pour | de petits formulaires | validation, formulaires dynamiques, tests | la suite logique des signals |
| Aujourd'hui | toujours disponible | la référence sur les projets existants | nouvelle API, voir [le guide des formulaires](https://angular.dev/guide/forms) |

## ⚠️ Pièges

> ⚠️ **`NG8002: Can't bind to 'formGroup' since it isn't a known property of 'form'`.**
> Symptôme : erreur rouge dès l'enregistrement du template.
> Cause : `ReactiveFormsModule` n'est pas dans `imports` du `@Component`.
> Correctif : `imports: [ReactiveFormsModule]`.

> ⚠️ **Rien dans la console.**
> Symptôme : clic sur **Apply now**, aucune ligne.
> Cause : la console n'était pas ouverte avant, ou filtrée sur « Errors » ; ou le bouton n'est pas `type="submit"`.
> Correctif : onglet *Console*, niveau « All levels », puis réessayez.

## Récap

- Classe : `applyForm = new FormGroup({ champ: new FormControl('') })`. Template : `[formGroup]`, `formControlName`, `(submit)`.
- Valeurs : `applyForm.value.champ`, possiblement `null` => `?? ''`.

➡️ [13 — La recherche](13-SEARCH.md)
