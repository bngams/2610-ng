import { InjectionToken } from '@angular/core';

/**
 * Le contrat : « charge le module `exposed` du remote `remote` ». ui ne sait pas COMMENT
 * (Native Federation, ou autre chose) : c'est l'application qui fournit la fonction au démarrage.
 */
export type RemoteLoader = (remote: string, exposed: string) => Promise<Record<string, unknown>>;

export const REMOTE_LOADER = new InjectionToken<RemoteLoader>('REMOTE_LOADER');
