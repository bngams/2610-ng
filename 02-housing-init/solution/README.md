# Homes — solution du lab 02 (tutoriel first-app + étapes 15 à 17)

Le projet terminé à la fin de l'étape 17 : le code final d'angular.dev adapté à un projet `ng new`
(voir le README du lab pour les quatre différences), migré sur `HttpClient`, avec deux
intercepteurs et l'URL de l'API dans `environment.ts`. À ne regarder qu'en cas de blocage.

```bash
npm install          # Node 22.22 ou 24.15 minimum
npm run api          # json-server sur http://localhost:3000/locations (terminal 1)
npm start            # ng serve sur http://localhost:4200 (terminal 2)
```

Pour voir l'indicateur de chargement, lancez l'API avec un délai : `npm run api -- --delay 1500`.

- `api/db.json` : les 10 logements servis par json-server (`npm run api`).
- `src/app/housing.service.ts` : `HttpClient`, des méthodes qui renvoient des `Observable` (étape 15), URL lue dans `environment.apiUrl` (étape 17).
- `src/app/home/home.ts`, `src/app/details/details.ts` : `toSignal`, `signal` + `computed` pour la recherche, plus de `markForCheck()` (étape 15).
- `src/app/logging-interceptor.ts`, `src/app/loading-interceptor.ts`, `src/app/loading.service.ts` : le journal des requêtes et le compteur de requêtes en cours, déclarés dans `app.config.ts` (étape 16).
- `src/environments/` : `environment.ts` (utilisé par `ng build`) et `environment.development.ts` (utilisé par `ng serve`), reliés par le `fileReplacements` d'`angular.json` (étape 17).
