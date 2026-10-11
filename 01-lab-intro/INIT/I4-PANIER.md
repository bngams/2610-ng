# I4 — Le panier : `signal()` et `computed()`

> Les clics « S'inscrire » ne font qu'un `console.log`. On les transforme en un vrai panier :
> la liste des ids inscrits, et le total à payer. Cet état **change pendant que la page est
> affichée** : c'est exactement le cas d'un `signal()`.

## ✨ Objectif

Un bandeau en haut de la liste qui affiche le nombre d'inscriptions et le total HT, mis à jour à
chaque clic.

## 🧱 1 — L'état et le dérivé

Dans `formation-list.ts`, importez `signal` et `computed` depuis `@angular/core`, puis :

```ts
export class FormationList {
  private service = inject(FormationService);
  formations = this.service.getAll();

  panier = signal<number[]>([]);          // les ids des formations choisies

  total = computed(() =>
    this.panier()
      .map(id => this.formations.find(f => f.id === id)?.prixHT ?? 0)
      .reduce((somme, prix) => somme + prix, 0),
  );

  onInscrire(id: number) {
    // TODO : ajouter l'id au panier avec update(), en créant un NOUVEAU tableau : [...ids, id]
  }
}
```

| Morceau | Rôle |
|---|---|
| `signal<number[]>([])` | l'état : un tableau d'ids, vide au départ |
| `this.panier()` | lecture (dans la classe comme dans le template) |
| `this.panier.update(ids => [...ids, id])` | nouvelle valeur calculée à partir de l'ancienne, **sans modifier** l'ancien tableau |
| `computed(() => …)` | une valeur dérivée, recalculée seulement quand `panier` change |

> 📖 [Signals](https://angular.dev/guide/signals) · [Synthèse, section 4](../../00-intro-syntax-recap/index.html#s4)

## 🧩 2 — Le bandeau

En haut du template de la liste, avant le `<h2>` :

```html
<section class="panier">
  <span>Panier : <strong>{{ panier().length }}</strong> inscription(s)</span>
  <span>Total : <strong><!-- TODO : le total --> € HT</strong></span>
</section>
```

## 💡 Tester

Cliquez « S'inscrire » sur *Angular 22* puis *Angular avancé* : le bandeau passe à
`2 inscription(s)` et `3900 € HT`, sans recharger la page.

Puis lancez les tests :

```bash
npm test
```

Attendu : vert. Si vous voulez aller plus loin, la solution contient un test qui clique sur le
premier bouton et vérifie le bandeau (`solution-init/src/app/formations/formation-list.spec.ts`).

> ⚠️ **Piège : `this.panier().push(id)`.**
> Symptôme : le bandeau ne bouge pas, pourtant `console.log(this.panier())` montre bien l'id ajouté.
> Cause : `push` modifie le tableau **en place** ; pour un signal, c'est la même valeur (même
> référence), donc personne n'est prévenu.
> Correctif : `this.panier.update(ids => [...ids, id])`, un nouveau tableau à chaque fois.

## ✅ Bonus (si vous avez de l'avance)

Un filtre par ville : un `ville = signal('')`, un `filtrees = computed(…)` qui remplace
`formations` dans le `@for`, et au-dessus des cartes :

```html
<select (change)="ville.set($any($event.target).value)">
  <option value="">Toutes les villes</option>
  <option value="Toulouse">Toulouse</option>
  <option value="Paris">Paris</option>
</select>
``` La solution Avancé le fait
avec un composant dédié, vous pouvez le faire plus simplement dans la liste.

## Récap

- `signal()` pour ce qui change, `computed()` pour ce qui s'en déduit.
- Toujours une nouvelle valeur (`set` / `update` avec un nouveau tableau ou objet), jamais de
  mutation en place.
- Vous avez maintenant tout ce qu'il faut pour le cas **Housing** de cet après-midi :
  composants, `input`/`output`, service, signals. Il y ajoutera le routing et les formulaires.

🎉 Fin du parcours Init.
