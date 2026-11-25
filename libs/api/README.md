# @shop/api

La mécanique HTTP commune, sans aucun service métier : l'adresse de l'API (`API_URL`) et
`provideApi({ url, interceptors? })`, la classe générique `ResourceService<I, T>` dont héritent les
services de données, l'intercepteur qui signale les erreurs HTTP, et le contrat `Notifier` avec son
jeton `NOTIFIER` (étape 09). Elle ne dépend d'aucune autre bibliothèque du workspace.

Créée à l'étape 01, remplie à l'étape 02, complétée à l'étape 09 du lab.
