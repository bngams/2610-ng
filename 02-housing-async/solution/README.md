# Homes — solution du lab « Housing sous pression asynchrone »

Le projet du lab Housing Init, mis sous pression (étape 0) et complété des six scénarios, côté
RxJS et côté signals. À ne regarder qu'en cas de blocage, ou pour comparer avec le vôtre.

```bash
nvm use 24           # Node 24.15 ou 22.22.3 minimum
npm install
npm run api          # json-server sur http://localhost:3000 (terminal 1)
npm start            # ng serve sur http://localhost:4200, proxy /api -> :3000 (terminal 2)
```

- `src/app/chaos/chaos.config.ts` : le réglage du chaos. Livré avec `errorRate: 0` sur
  `/api/reviews` (passez à `0.5` pour S3) et la règle `/api/bookings` en commentaire (décommentez
  pour S4).
- `npm run api:reset` : recopie `api/db.seed.json` dans `api/db.json` (API arrêtée) pour vider
  `bookings` et remettre `available` à `true`.
- `src/app/scenarios/` : un dossier par scénario, `sN-page.ts` + `sN-rxjs.ts` + `sN-signals.ts`
  (S3 est dans `s2-details/`). `GRILLE-corrigee.md`, à côté de ce fichier, est la grille attendue.
