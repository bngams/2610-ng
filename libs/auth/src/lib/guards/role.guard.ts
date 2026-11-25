import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { SessionStore } from '../services/session.store';

/**
 * Une FABRIQUE de guard : roleGuard('admin') renvoie un CanMatchFn qui exige ce rôle.
 * Sans le rôle, page de connexion (avec returnUrl) : on peut y changer de compte.
 */
export function roleGuard(role: string): CanMatchFn {
  return (_route, segments) => {
    const session = inject(SessionStore);
    const router = inject(Router);
    if (session.hasRole(role)) return true;
    // canMatch ne reçoit pas l'URL complète : on la recompose à partir des segments
    const returnUrl = '/' + segments.map((segment) => segment.path).join('/');
    return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
  };
}
