# Homes — solution du lab « Housing sous pression asynchrone »

Le projet du lab Housing Init (étape 17), mis sous pression (étape 0), complété des six
expériences côté RxJS et côté signals (étapes 01 à 06), d'un intercepteur de reprise (étape 07),
puis factorisé en `ResourceService<I, T>` et adapté au contrat v2 de l'API (étape 08, bonus de
pagination compris). À ne regarder qu'en cas de blocage, ou pour comparer avec le vôtre.

> ⚠️ **Cette solution parle le contrat v2** (`{ data, meta }`) : lancez l'API avec
> `npm run api:v2`. Avec `npm run api` (json-server en ligne de commande, réponses non
> enveloppées), `unwrap` cherche un `data` qui n'existe pas : l'accueil affiche
> `Page 1 / 1 (0 logements)`, la recherche `Aucun résultat.`, et la fiche détail RxJS
> `Tout a échoué : TypeError: Cannot read properties of undefined (reading 'agentId')`. C'est la
> situation de l'étape 08, partie B, dans l'autre sens : le front a changé, pas le back.

```bash
nvm use 24           # Node 24.15 ou 22.22.3 minimum
npm install
npm run api:v2       # API v2 sur http://localhost:3000 (terminal 1)
npm start            # ng serve sur http://localhost:4200, proxy /api -> :3000 (terminal 2)
```

- `src/environments/` : `apiUrl: '/api'` dans les deux fichiers ; le proxy (`proxy.conf.json`)
  relaie vers json-server.
- `src/app/app.config.ts` : `withInterceptors([logging, loading, retry, chaos])`, l'ordre est
  commenté.
- `src/app/chaos/chaos.config.ts` : le réglage du chaos. Livré avec `errorRate: 0` sur
  `/api/reviews` (passez à `0.5` pour l'erreur partielle et pour la reprise) et la règle
  `/api/bookings` en commentaire (décommentez pour la réservation).
- `src/app/retry-interceptor.ts` : reprise des `GET` en 503, trois fois, 200 / 400 / 800 ms,
  avec `defer(() => next(req))` ; le jeton facultatif `RETRY_ENABLED` est défini et lu, mais
  aucun service ne l'utilise.
- `src/app/api/` : `resource.service.ts` (`API_URL`, `ApiResponse<T>`, `ResourceService<I, T>`
  avec `map(unwrap)` et `parse`, plus `page()` pour le bonus) et les cinq services qui en
  héritent. `housing.service.ts` n'existe plus.
- `src/app/home/home.ts` : l'accueil paginé par 4 avec `meta` (bonus de l'étape 08), filtre par
  ville côté serveur.
- `api/server.js` : json-server 0.17.4 utilisé comme module, `router.render` réécrit pour
  envelopper les réponses.
- `npm run api:reset` : recopie `api/db.seed.json` dans `api/db.json` (API arrêtée) pour vider
  `bookings` et remettre `available` à `true`.
- `src/app/scenarios/` : un dossier par expérience, `sN-page.ts` + `sN-rxjs.ts` + `sN-signals.ts`
  (l'erreur partielle est dans `s2-details/`). `GRILLE-corrigee.md`, à côté de ce fichier, est la
  grille attendue.
