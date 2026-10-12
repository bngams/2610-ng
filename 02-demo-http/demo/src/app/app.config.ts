import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { loggingInterceptor } from './core/interceptors/logging.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding : les paramètres de route arrivent dans les input()
    provideRouter(routes, withComponentInputBinding()),
    // ordre = ordre de passage de la requête (et ordre inverse pour la réponse)
    provideHttpClient(withInterceptors([loggingInterceptor, authInterceptor, errorInterceptor])),
  ],
};
