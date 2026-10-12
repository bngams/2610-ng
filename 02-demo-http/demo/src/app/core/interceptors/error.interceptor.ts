import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// Gestion d'erreur centralisée : un seul endroit décide quoi faire d'un 401.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router); // inject() fonctionne dans un intercepteur fonctionnel

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        router.navigate(['/connexion']); // jeton absent ou expiré => écran de connexion
      } else {
        console.error(`[HTTP] erreur ${err.status} sur ${req.url} :`, err.error?.message ?? err.message);
      }
      return throwError(() => err); // on relance : l'appelant peut encore réagir
    }),
  );
};
