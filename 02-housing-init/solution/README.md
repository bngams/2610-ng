# Homes — solution du lab 02 (tutoriel first-app + étapes 15 à 18)

Le projet terminé à la fin de l'étape 18 : le code final d'angular.dev adapté à un projet `ng new`
(voir le README du lab pour les quatre différences), migré sur `HttpClient`, avec deux
intercepteurs, l'URL de l'API dans `environment.ts`, et un dossier de candidature en trois écrans
qui remplace le formulaire de l'étape 12. À ne regarder qu'en cas de blocage.

```bash
npm install          # Node 22.22 ou 24.15 minimum
npm run api          # json-server sur http://localhost:3000/locations (terminal 1)
npm start            # ng serve sur http://localhost:4200 (terminal 2)
```

Pour voir l'indicateur de chargement, lancez l'API avec un délai : `npm run api -- --delay 1500`.

- `api/db.json` : les 10 logements servis par json-server (`npm run api`), et la collection `applications`, vide, qui reçoit les dossiers (étape 18). Chaque envoi y ajoute un dossier : remettez `"applications": []` pour repartir de zéro.
- `src/app/housing.service.ts` : `HttpClient`, des méthodes qui renvoient des `Observable` (étape 15), URL lue dans `environment.apiUrl` (étape 17), `submitApplication(application)` qui envoie le dossier en `POST` (étape 18).
- `src/app/home/home.ts`, `src/app/details/details.ts` : `toSignal`, `signal` + `computed` pour la recherche, plus de `markForCheck()` (étape 15).
- `src/app/logging-interceptor.ts`, `src/app/loading-interceptor.ts`, `src/app/loading.service.ts` : le journal des requêtes et le compteur de requêtes en cours, déclarés dans `app.config.ts` (étape 16).
- `src/environments/` : `environment.ts` (utilisé par `ng build`) et `environment.development.ts` (utilisé par `ng serve`), reliés par le `fileReplacements` d'`angular.json` (étape 17).
- `src/app/application.ts` : les interfaces `Application` et `Guarantor`, la forme d'un dossier (étape 18).
- `src/app/application-form/` : `ApplicationForm` (`<app-application-form [locationId]="…" />`), le dossier en trois écrans : `NonNullableFormBuilder`, groupes `identity` et `situation`, `FormArray` de garants, validateurs (dont `futureDate`), `toSignal(form.statusChanges)`, envoi et confirmation (étape 18). `Details` l'affiche à la place de l'ancien formulaire.
