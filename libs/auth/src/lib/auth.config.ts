import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { SessionStore } from './services/session.store';

/**
 * Prépare l'authentification de l'application : avant la première navigation, on demande au
 * serveur qui est connecté. Ainsi un F5 garde la session, et les guards la connaissent déjà.
 */
export function provideAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    // Angular attend la promesse avant de démarrer le routeur
    provideAppInitializer(() => inject(SessionStore).loadSession()),
  ]);
}
