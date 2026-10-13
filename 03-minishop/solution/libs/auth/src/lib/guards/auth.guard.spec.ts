import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '@shop/api';
import { authGuard } from './auth.guard';
import { SessionStore } from '../services/session.store';

describe('authGuard', () => {
  // un guard fonctionnel s'exécute dans un contexte d'injection
  const runGuard = (url: string) =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
  });

  it('anonyme : renvoie vers /login avec returnUrl', () => {
    const result = runGuard('/cart/checkout');
    expect(result).toBeInstanceOf(UrlTree);
    expect(String(result)).toBe('/login?returnUrl=%2Fcart%2Fcheckout');
  });

  it('connecté : laisse passer', () => {
    const session = TestBed.inject(SessionStore);
    vi.spyOn(session, 'isLoggedIn').mockReturnValue(true);
    expect(runGuard('/cart/checkout')).toBe(true);
  });
});
