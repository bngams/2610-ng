# @shop/auth

Tout ce qui touche à l'identité, partagé par le FO et le BO : le modèle `User`, le store de session
`SessionStore` (rempli par `/api/auth/me`, jamais par un jeton lu en JavaScript), `provideAuth()`
qui charge la session au démarrage, la page de connexion, le bouton de session, l'intercepteur du
401, `authGuard` et la fabrique `roleGuard(role)`. Elle dépend de `@shop/api`.

Créée à l'étape 01, remplie aux étapes 04 à 06 du lab. Tests : `npx ng test @shop/auth --watch=false`.
