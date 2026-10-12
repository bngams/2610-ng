import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { defer, retry, throwError, timer } from 'rxjs';

/** Nombre maximal de reprises après le premier essai. */
const MAX_RETRIES = 3;
/** Attente avant la première reprise ; elle double à chaque reprise (200, 400, 800 ms). */
const BASE_DELAY_MS = 200;

/**
 * Facultatif : un jeton de contexte pour désactiver la reprise sur une requête précise.
 * Usage : http.get(url, { context: new HttpContext().set(RETRY_ENABLED, false) }).
 */
export const RETRY_ENABLED = new HttpContextToken<boolean>(() => true);

/**
 * Reprend les GET qui échouent en 503, avec une attente qui double à chaque essai.
 *
 * - Seulement GET : une lecture est idempotente, la rejouer ne change rien côté serveur. Un POST
 *   rejoué peut créer une deuxième réservation (le 503 a pu arriver APRÈS l'écriture).
 * - Seulement 503 : « service indisponible, réessayez ». Un 404 ou un 400 ne guérira pas tout seul.
 * - `defer(() => next(req))` et non `next(req)` : `next(req)` appelle tout de suite les
 *   intercepteurs suivants, donc le chaos tire son délai et son erreur UNE fois. `retry` se
 *   réabonne au même Observable : sans `defer`, chaque reprise rejoue le même tirage (même 503,
 *   même délai). Avec `defer`, chaque reprise rappelle `next(req)` : nouveau passage dans le chaos.
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET' || !req.context.get(RETRY_ENABLED)) {
    return next(req);
  }
  return defer(() => next(req)).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error: unknown, retryCount: number) => {
        if (error instanceof HttpErrorResponse && error.status === 503) {
          console.log(`[retry] ${req.method} ${req.urlWithParams} : reprise ${retryCount}/${MAX_RETRIES}`);
          return timer(BASE_DELAY_MS * 2 ** (retryCount - 1));
        }
        return throwError(() => error);
      },
    }),
  );
};
