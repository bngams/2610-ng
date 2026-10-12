import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { loggingInterceptor } from './logging-interceptor';
import { loadingInterceptor } from './loading-interceptor';
import { chaosInterceptor } from './chaos/chaos.interceptor';
import { retryInterceptor } from './retry-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Ordre : le journal et l'indicateur englobent tout (ils mesurent et affichent ce que vit
    // l'utilisateur) ; la reprise est juste avant le chaos, pour que chaque reprise refasse un tirage.
    provideHttpClient(
      withInterceptors([loggingInterceptor, loadingInterceptor, retryInterceptor, chaosInterceptor]),
    ),
  ]
};
