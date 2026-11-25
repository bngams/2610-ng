import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideApi } from '@shop/api';
import { provideAuth } from '@shop/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // lancée seule, marketing a besoin de sa propre session (la bannière lit SessionStore) ;
    // chargée dans le FO ou le BO, la bannière utilise celle de l'hôte
    provideApi({ url: '/api' }),
    provideAuth(),
  ],
};
