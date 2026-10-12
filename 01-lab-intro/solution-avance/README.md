# Lab Intro — solution du parcours Avancé

Le catalogue terminé après les étapes A1 à A8 : filtres, sélection en `linkedSignal`, égalité
personnalisée, panier persisté par un `effect`, défilement en `afterRenderEffect`, et avis chargés
en `@defer`. À ne regarder qu'en cas de blocage ; le guide est dans [`AVANCE/`](../AVANCE/).

```bash
npm install          # Node 22.22 ou 24.15 minimum
npm start            # ng serve sur http://localhost:4200
npm test             # 11 tests
```

- `src/app/pieges.spec.ts` prouve chaque piège du parcours : lancez `npm test` pour les voir
  se comporter comme le guide l'annonce.
- `npm run build` liste un chunk `formation-avis` à part : c'est le bloc `@defer` de l'étape A8.
