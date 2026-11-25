import { initFederation } from '@angular-architects/native-federation';

// 1. lire le manifeste (où sont les remotes), 2. démarrer l'application en lui passant le résultat
initFederation('federation.manifest.json', {
  hostRemoteEntry: { url: './remoteEntry.json' },
})
  .then((nf) => import('./bootstrap').then((m) => m.bootstrap(nf)))
  .catch((err) => console.error(err));
