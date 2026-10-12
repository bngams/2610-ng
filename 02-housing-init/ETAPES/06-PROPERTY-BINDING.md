# 06 — La liaison de propriété : les crochets

> Vous venez d'écrire `[housingLocation]="housingLocation"`. Cette étape courte explique ce que
> font les crochets, et vous le fait constater en les enlevant. Aucun nouveau fichier.

## ✨ Ce que vous apprenez

- `[prop]="expression"` envoie une **valeur** (ici un objet) ; `prop="texte"` envoie une **chaîne**.
- Angular vérifie le type de ce que vous passez à un input.

> 📖 Étape officielle : [06-property-binding](https://angular.dev/tutorials/first-app/06-property-binding) ·
> [Property binding](https://angular.dev/guide/templates/binding) ·
> [Synthèse, section 6](../../00-intro-syntax-recap/index.html#s6)

## 🔍 1 — Relire la balise

Ouvrez `src/app/home/home.ts` et vérifiez que le template contient exactement :

```ts
    <section class="results">
      <app-housing-location [housingLocation]="housingLocation" />
    </section>
```

| Partie | Ce qu'Angular en fait |
|---|---|
| `[housingLocation]` | « mets à jour l'input `housingLocation` de l'enfant » ; les crochets signalent une liaison |
| `="housingLocation"` | la **droite est du code**, évalué dans la classe `Home` : ici la propriété `housingLocation` ; ce pourrait être `maListe[0]` ou `creerLogement()` |
| sans crochets, `housingLocation="housingLocation"` | la droite serait le **texte** `"housingLocation"`, pas l'objet |

## 🧪 2 — Manip : enlever les crochets

Pour voir la différence, enlevez les crochets, enregistrez, et lisez le terminal de `ng serve` :

```
✘ [ERROR] TS2322: Type 'string' is not assignable to type 'HousingLocationInfo'.
         │         <app-housing-location housingLocation="housingLocation" />
```

Angular a compris que vous passiez une chaîne de caractères à un input qui attend un
`HousingLocationInfo`, et refuse : c'est l'interface de l'étape 4 qui travaille pour vous, jusque
dans le template. **Remettez les crochets** et vérifiez que l'erreur disparaît.

> 💡 **Tester :** la page affiche toujours « housing-location works! », sans erreur dans le terminal.

## ⚠️ Pièges

> ⚠️ **Les crochets, les parenthèses, les accolades.**
> `[prop]="…"` fait descendre une valeur vers l'enfant ; `(event)="…"` fait remonter un événement
> (vous l'avez vu avec `(click)` et `output()` ce matin, vous le reverrez à l'étape 13) ;
> `{{ … }}` affiche une valeur dans le texte (étape 7). Trois sens, trois notations.

## Récap

- Crochets = liaison de propriété : la droite est une expression TypeScript, pas un texte.
- Le type de l'input est vérifié à la compilation.

➡️ [07 — L'interpolation](07-DYNAMIC-TEMPLATE-VALUES.md)
