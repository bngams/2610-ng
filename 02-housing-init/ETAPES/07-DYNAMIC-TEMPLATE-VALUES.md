# 07 — L'interpolation : la carte affiche son logement

> La carte a reçu son logement (étape 5) ; elle l'affiche enfin. Vous remplacez le
> « housing-location works! » par la photo, le nom et la ville, lus depuis l'input.

## ✨ Ce que vous apprenez

- `{{ expression }}` : afficher une valeur dans le texte du template.
- Un input est un signal : il se lit avec des parenthèses, `housingLocation().name`.
- `[src]="…"` : la liaison de propriété de l'étape 6, cette fois sur une balise HTML.

> 📖 Étape officielle : [07-dynamic-template-values](https://angular.dev/tutorials/first-app/07-dynamic-template-values) ·
> [Interpolation](https://angular.dev/guide/templates/binding#render-dynamic-text-with-text-interpolation)

## 🧱 1 — Le template de la carte

🚧 **À compléter** dans `src/app/housing-location/housing-location.ts` : remplacez le `template`
par celui-ci, en comblant les trous avec les propriétés de l'interface (`photo`, `name`, `city`, `state`) :

```ts
  template: `
    <section class="listing">
      <img
        class="listing-photo"
        [src]="housingLocation().TODO"
        alt="Exterior photo of {{ housingLocation().TODO }}"
        crossorigin
      />
      <h2 class="listing-heading">{{ TODO }}</h2>
      <p class="listing-location">{{ TODO }}, {{ TODO }}</p>
    </section>
  `,
```

| Morceau | Rôle |
|---|---|
| `housingLocation()` | l'input est un **signal** : les parenthèses donnent sa valeur, l'objet `HousingLocationInfo` |
| `[src]="housingLocation().photo"` | liaison de propriété sur `<img>` : l'attribut `src` reçoit l'URL contenue dans `photo` |
| `{{ housingLocation().name }}` | interpolation : la valeur est insérée dans le texte |
| `alt="Exterior photo of {{ … }}"` | une interpolation marche aussi au milieu d'un attribut texte |
| `crossorigin` | demande l'image à `angular.dev` en mode CORS, comme le fait le tutoriel officiel (une `<img>` se charge sans, l'attribut n'est utile que pour certains usages avancés) |
| `class="listing"`, `listing-photo`… | les classes du CSS copié à l'étape 3 : la carte prend sa forme |

> 💡 **Tester :** une carte violette aux coins arrondis, avec la photo d'un immeuble, le titre
> **Test Home** et **📍 Test city, ST**. La photo vient d'internet : sans connexion, un cadre vide.

## ⚠️ Pièges

> ⚠️ **`Property 'photo' does not exist on type 'InputSignal<HousingLocationInfo>'`.**
> Symptôme : erreur rouge dans le terminal.
> Cause : vous avez écrit `housingLocation.photo` ; sans parenthèses, c'est le signal lui-même, pas le logement.
> Correctif : `housingLocation().photo`, parenthèses puis point.

> ⚠️ **La photo ne s'affiche pas, mais le texte oui.**
> Symptôme : cadre vide à la place de l'image.
> Cause : `src="housingLocation().photo"` sans crochets (le navigateur cherche une image appelée littéralement ainsi), ou pas d'internet.
> Correctif : `[src]="…"` avec crochets.

## Récap

- `{{ }}` pour du texte, `[attr]` pour une propriété : dans les deux cas, la droite est une expression.
- Un `input()` se lit avec `()`, comme un signal.

➡️ [08 — La liste avec @for](08-NGFOR.md)
