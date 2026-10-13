import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SessionStore } from '../services/session.store';

/**
 * Un 401 sur un appel métier veut dire « session expirée » : on oublie l'utilisateur et on renvoie
 * vers la page de connexion, en gardant la page courante dans returnUrl.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      // les appels /auth/ sont exclus : un mauvais mot de passe (401 aussi) ne doit pas rediriger
      if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.includes('/auth/')) {
        // efface aussi un cookie devenu invalide ; sans await, et une erreur éventuelle est ignorée :
        // la session locale est vidée dans tous les cas (le finally de logout)
        session.logout().catch(() => {});
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => err);
    }),
  );
};
