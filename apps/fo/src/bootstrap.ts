import { mergeApplicationConfig } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { NativeFederationResult } from '@angular-architects/native-federation';
import { REMOTE_LOADER } from '@shop/ui';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// nf : le résultat de initFederation (main.ts). Sa fonction loadRemoteModule devient injectable.
export const bootstrap = (nf: NativeFederationResult) =>
  bootstrapApplication(
    App,
    mergeApplicationConfig(appConfig, {
      providers: [{ provide: REMOTE_LOADER, useValue: nf.loadRemoteModule }],
    }),
  ).catch((err) => console.error(err));
