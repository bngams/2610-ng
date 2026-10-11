import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { finalize, switchMap, tap, throwError, timer } from 'rxjs';
import { CHAOS_DEFAULT, CHAOS_ENABLED, CHAOS_RULES, ChaosRule } from './chaos.config';

function resolveRule(url: string): Omit<ChaosRule, 'match'> {
  const rule = CHAOS_RULES.find((r) =>
    typeof r.match === 'string' ? url.startsWith(r.match) : r.match.test(url),
  );
  return rule ?? CHAOS_DEFAULT;
}

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

/**
 * Intercepteur "chaos" : pour chaque requête HttpClient, attend un délai aléatoire PUIS
 * soit envoie la requête, soit la remplace par une erreur 503.
 *
 * Le délai est placé AVANT l'envoi (timer -> switchMap) et non après la réponse : ainsi, quand
 * un switchMap ou un resource se désabonne pendant l'attente, la requête ne part jamais, et le
 * log affiche "annulée". C'est ce qui rend l'annulation observable dans les scénarios.
 *
 * Trois lignes de log possibles dans la console du navigateur :
 *   [chaos] GET /api/reviews?locationId=3 +842ms
 *   [chaos] GET /api/reviews?locationId=3 => 503
 *   [chaos] GET /api/locations?city_like=Chi => annulée
 */
export const chaosInterceptor: HttpInterceptorFn = (req, next) => {
  if (!CHAOS_ENABLED) {
    return next(req);
  }

  const rule = resolveRule(req.urlWithParams);
  const delayMs = randomBetween(rule.minDelayMs, rule.maxDelayMs);
  const shouldFail = Math.random() < rule.errorRate;
  const label = `${req.method} ${req.urlWithParams}`;
  let settled = false;

  return timer(delayMs).pipe(
    switchMap(() => {
      if (shouldFail) {
        settled = true;
        console.warn(`[chaos] ${label} => 503 (après ${delayMs} ms)`);
        return throwError(
          () =>
            new HttpErrorResponse({
              status: 503,
              statusText: 'Service Unavailable (chaos)',
              url: req.urlWithParams,
              error: { message: 'chaos: service indisponible' },
            }),
        );
      }
      return next(req).pipe(
        tap({
          next: (event) => {
            if (event instanceof HttpResponse) {
              settled = true;
              console.log(`[chaos] ${label} +${delayMs}ms`);
            }
          },
          error: (err: unknown) => {
            settled = true;
            const status = err instanceof HttpErrorResponse ? err.status : '?';
            console.warn(`[chaos] ${label} => ${status} (erreur serveur réelle)`);
          },
        }),
      );
    }),
    finalize(() => {
      if (!settled) {
        console.log(`[chaos] ${label} => annulée`);
      }
    }),
  );
};
