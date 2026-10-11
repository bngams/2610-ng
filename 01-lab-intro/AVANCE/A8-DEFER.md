# A8 — `@defer` : les avis d'une formation

## 🧠 Concept

`@defer` sort un bloc du bundle initial et ne le charge (code **et** rendu) que sur un
déclencheur : `on viewport`, `on idle`, `on interaction`, `when condition`. `@placeholder`
s'affiche avant, `@loading` pendant le chargement du code. Il se justifie pour un bloc
**lourd ou non critique au premier rendu**, pas pour un `<p>`.

> 📖 [Deferred loading](https://angular.dev/guide/templates/defer)

## 🎯 Scénario

1. Un composant `FormationAvis` (`input formationId`, `avis = computed(() => service.getAvis(id))`,
   ajoutez `getAvis()` au service à partir de la constante `AVIS`).
2. Dans la carte :
   ```html
   @defer (on viewport) {
     <app-formation-avis [formationId]="formation().id" />
   } @placeholder {
     <p class="placeholder">Les avis s'affichent quand la carte est visible.</p>
   } @loading (minimum 300ms) {
     <p class="placeholder">Chargement des avis…</p>
   }
   ```

Critère : `npm run build` liste un **chunk lazy** `formation-avis` ; dans le navigateur, onglet
Réseau, le fichier n'est téléchargé que quand une carte entre dans la fenêtre.

> ⚠️ **Piège d'outillage : en `ng serve`, tout se charge d'un coup.** Symptôme : la console affiche
> `NG0751` et le chunk est téléchargé dès le départ. Cause : avec le rechargement à chaud (HMR),
> Angular télécharge d'avance le code des blocs `@defer` (le `@placeholder` reste affiché jusqu'au
> déclencheur, mais l'onglet Réseau ne montre plus rien de différé). Correctif : pour observer le vrai comportement,
> `npm start -- --no-hmr`, ou servez le `dist/` d'un `npm run build` (`npx serve dist/<projet>/browser`).

```
Lazy chunk files    | Names          |  Raw size
chunk-XXXXXXXX.js   | formation-avis | 884 bytes
```

## 🪤 Piège : un `@defer` qui ne diffère rien

```html
@defer (on viewport) {
  <span class="badge">{{ placesRestantes() }} place(s)</span>
} @placeholder {
  <span class="badge">…</span>
}
```

Le build affiche bien un chunk. Pourquoi est-ce une mauvaise idée ?

<details>
<summary>Réponse</summary>

Le badge est au-dessus de la ligne de flottaison, minuscule, et sans dépendance : on paie un
aller-retour réseau, un placeholder qui clignote et une complexité de template pour ne rien
économiser. `@defer` se justifie quand le bloc embarque du code (un composant avec ses
dépendances : graphique, éditeur, carte) ou coûte à rendre, **et** qu'il n'est pas nécessaire au
premier écran. Mesurez (taille du chunk, position dans la page) avant de différer.

Autre contrainte à connaître : avec `on viewport` sans référence explicite, le `@placeholder`
doit avoir **un seul élément racine**, c'est lui qu'Angular observe.
</details>

## 🎉 Fin du parcours Avancé

Vous avez parcouru toute la famille : `signal`, `computed`, dépendances dynamiques,
`linkedSignal` (deux formes), `equal`, `effect` / `afterRenderEffect`, plus `@defer`.
Tout est **synchrone**. Cet après-midi, l'asynchrone : `resource`, `toSignal`, et la
confrontation avec RxJS sur Housing.

Pour vérifier votre travail : `npm test` dans `solution-avance/` lance 11 tests, dont les 6
pièges de ce parcours.
