import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// FAUX JETON, POUR LA DÉMO UNIQUEMENT. Dans une vraie app, le jeton vient d'un
// AuthService (après connexion), jamais d'une constante dans le code.
export const FAKE_DEMO_TOKEN = 'faux-jeton-de-demo';

// Ajoute l'en-tête Authorization aux appels vers NOTRE API, et à eux seuls
// (le "/" final évite qu'un domaine comme dummyjson.com.autre.io passe le test).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(`${environment.apiUrl}/`)) {
    return next(req);
  }
  // une HttpRequest est immuable : on la clone avec l'en-tête en plus
  const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${FAKE_DEMO_TOKEN}` } });
  return next(authReq);
};
