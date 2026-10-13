import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideApi } from '@shop/api';
import { authInterceptor, provideAuth } from '@shop/auth';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // les mêmes briques que le FO : une ligne chacune
    provideApi({ url: '/api', interceptors: [authInterceptor] }),
    provideAuth(),
  ],
};
