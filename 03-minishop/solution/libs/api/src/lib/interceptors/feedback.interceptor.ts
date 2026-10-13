import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { NOTIFIER, Notifier } from '../models/notifier';

/** Facultatif : un message de succès, demandé requête par requête (null = pas de message). */
export const SUCCESS_MESSAGE = new HttpContextToken<string | null>(() => null);

/**
 * Le retour à l'utilisateur, centralisé : chaque appel HTTP qui échoue est signalé ici, et nulle part ailleurs.
 * Le COMMENT est fourni par l'application (NOTIFIER) ; sans lui, on retombe sur la console.
 */
export const feedbackInterceptor: HttpInterceptorFn = (req, next) => {
  // optional : une application qui ne fournit pas de NOTIFIER fonctionne toujours (null)
  const notifier = inject(NOTIFIER, { optional: true });

  return next(req).pipe(
    tap((event) => {
      const success = req.context.get(SUCCESS_MESSAGE);
      if (success && event instanceof HttpResponse) {
        notifier?.success?.(success);
      }
    }),
    catchError((err: unknown) => {
      // 401 n'est pas une panne : « personne n'est connecté », c'est l'affaire de @shop/auth
      if (err instanceof HttpErrorResponse && err.status !== 401) {
        report(notifier, messageFor(err));
      }
      return throwError(() => err); // l'erreur continue son chemin jusqu'à l'appelant
    }),
  );
};

/** Un message pour un humain, à partir du statut HTTP. */
function messageFor(err: HttpErrorResponse): string {
  if (err.status === 403) {
    return "Action refusée : votre compte n'a pas les droits nécessaires.";
  }
  if (err.status === 0 || err.status >= 500) {
    return 'Le serveur ne répond pas. Réessayez dans un instant.';
  }
  return `La requête a échoué (erreur ${err.status}).`;
}

/** Le seul endroit qui décide où va le message : le Notifier de l'application, sinon la console. */
function report(notifier: Notifier | null, message: string): void {
  if (notifier) {
    notifier.error(message);
  } else {
    console.error(`[api] ${message}`);
  }
}
