# Homes — solution du lab 02 (tutoriel first-app, 14 étapes)

Le projet terminé, identique au code final d'angular.dev adapté à un projet `ng new` (voir le
README du lab pour les quatre différences). À ne regarder qu'en cas de blocage.

```bash
npm install          # Node 22.22 ou 24.15 minimum
npm run api          # json-server sur http://localhost:3000/locations (terminal 1)
npm start            # ng serve sur http://localhost:4200 (terminal 2)
```

- `api/db.json` : les 10 logements servis par json-server (`npm run api`).
- `src/app/housing.service.ts` : `fetch` vers l'API, comme dans le tutoriel officiel.
