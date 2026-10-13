import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { API_URL } from '@shop/api';
import { authInterceptor } from './auth.interceptor';
import { SessionStore } from '../services/session.store';

describe('authInterceptor', () => {
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;
  let logout: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    logout = vi.spyOn(TestBed.inject(SessionStore), 'logout').mockResolvedValue();
  });

  it('un 401 sur un appel métier renvoie vers /login', () => {
    TestBed.inject(HttpClient)
      .delete('/api/products/1')
      .subscribe({ error: () => {} });
    http.expectOne('/api/products/1').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/' } });
  });

  it('un 401 sur /auth/login (mauvais mot de passe) ne redirige pas', () => {
    TestBed.inject(HttpClient)
      .post('/api/auth/login', {})
      .subscribe({ error: () => {} });
    http.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(navigate).not.toHaveBeenCalled();
  });
});
