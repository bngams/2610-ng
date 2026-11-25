import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NOTIFIER, provideApi } from '@shop/api';
import { authInterceptor, provideAuth } from '@shop/auth';
import { ToastService } from '@shop/ui';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // les mêmes briques que le FO : une ligne chacune
    provideApi({ url: '/api', interceptors: [authInterceptor] }),
    provideAuth(),
    // l'application assemble : le contrat de l'api (NOTIFIER) reçoit l'implémentation de ui (ToastService)
    { provide: NOTIFIER, useExisting: ToastService },
  ],
};
