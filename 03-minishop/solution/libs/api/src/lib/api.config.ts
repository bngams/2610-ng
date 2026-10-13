import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { feedbackInterceptor } from './interceptors/feedback.interceptor';

/** L'adresse de base de l'API, par exemple '/api'. Fournie par l'application, via provideApi(). */
export const API_URL = new InjectionToken<string>('API_URL');

export interface ApiConfig {
  /** L'adresse de base de l'API : '/api' en développement, grâce au proxy. */
  url: string;
  /** Les intercepteurs des autres bibliothèques (par exemple celui de @shop/auth), placés avant celui de l'api. */
  interceptors?: HttpInterceptorFn[];
}

/**
 * Branche l'accès HTTP de l'application, en un appel dans app.config.ts :
 * HttpClient, l'adresse de l'API et la chaîne d'intercepteurs, qui se termine par feedbackInterceptor.
 */
export function provideApi(config: ApiConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: API_URL, useValue: config.url },
    provideHttpClient(withInterceptors([...(config.interceptors ?? []), feedbackInterceptor])),
  ]);
}
