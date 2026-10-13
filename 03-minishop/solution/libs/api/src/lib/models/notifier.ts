import { InjectionToken } from '@angular/core';

/**
 * Le contrat d'un notificateur : ce dont l'api a besoin pour prévenir l'utilisateur.
 * L'api ne sait pas COMMENT (snackbar, toast, bandeau) : c'est l'application qui fournit l'implémentation.
 */
export interface Notifier {
  error(message: string): void;
  success?(message: string): void;
}

/** Le jeton sous lequel l'application fournit son Notifier : { provide: NOTIFIER, useExisting: … }. */
export const NOTIFIER = new InjectionToken<Notifier>('NOTIFIER');
