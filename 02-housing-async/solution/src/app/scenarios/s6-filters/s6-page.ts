import { Component, signal } from '@angular/core';
import { Mode, ModeToggle } from '../mode-toggle';
import { S6Rxjs } from './s6-rxjs';
import { S6Signals } from './s6-signals';

@Component({
  selector: 'app-s6-page',
  imports: [ModeToggle, S6Rxjs, S6Signals],
  template: `
    <div class="scenario">
      <h1>Filtres : dérivation synchrone, sans requête</h1>
      <p class="hint">
        Ville (texte), prix max (nombre), tri (nom ou prix) : les trois se combinent sans nouvel appel HTTP.
      </p>
      <app-mode-toggle [(mode)]="mode" />
      @if (mode() === 'rxjs') {
        <section class="pane rxjs"><h2>RxJS</h2><app-s6-rxjs /></section>
      } @else {
        <section class="pane signals"><h2>Signals</h2><app-s6-signals /></section>
      }
    </div>
  `,
})
export class S6Page {
  readonly mode = signal<Mode>('rxjs');
}
