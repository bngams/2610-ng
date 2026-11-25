import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { NOTIFIER, provideApi } from '@shop/api';
import { authInterceptor, provideAuth } from '@shop/auth';
import { ToastService } from '@shop/ui';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding : le paramètre :id de la route arrive dans un input() du composant
    provideRouter(routes, withComponentInputBinding()),
    // HttpClient + l'adresse de l'API + la chaîne d'intercepteurs : celui de @shop/auth, puis celui de l'api
    provideApi({ url: '/api', interceptors: [authInterceptor] }),
    // la session est chargée avant la première navigation
    provideAuth(),
    // l'application assemble : le contrat de l'api (NOTIFIER) reçoit l'implémentation de ui (ToastService)
    { provide: NOTIFIER, useExisting: ToastService },
  ],
};
