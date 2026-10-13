import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Le retour d'erreur, centralisé : chaque appel HTTP qui échoue est signalé ici, et nulle part ailleurs.
 * Pour l'instant, dans la console ; pour un vrai message à l'écran, voir l'étape bonus 09.
 */
export const feedbackInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: unknown) => {
      // 401 n'est pas une panne : « personne n'est connecté », c'est l'affaire de @shop/auth
      if (err instanceof HttpErrorResponse && err.status !== 401) {
        report(`${req.method} ${req.urlWithParams} : erreur ${err.status}`);
      }
      return throwError(() => err); // l'erreur continue son chemin jusqu'à l'appelant
    }),
  );

/** Le seul endroit qui décide COMMENT on signale : à remplacer par un vrai message (étape bonus 09). */
function report(message: string): void {
  console.error(`[api] ${message}`);
}
