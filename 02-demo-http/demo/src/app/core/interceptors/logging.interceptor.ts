import { HttpErrorResponse, HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';

// Journalise chaque requête avec son statut et sa durée.
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const started = performance.now();
  const elapsed = () => Math.round(performance.now() - started);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          console.log(`[HTTP] ${req.method} ${req.urlWithParams} -> ${event.status} en ${elapsed()} ms`);
        }
      },
      error: (err: HttpErrorResponse) =>
        console.warn(`[HTTP] ${req.method} ${req.urlWithParams} -> ${err.status} en ${elapsed()} ms`),
    }),
  );
};
