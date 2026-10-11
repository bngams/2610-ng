import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Mode, ModeToggle } from '../mode-toggle';
import { S2Rxjs } from './s2-rxjs';
import { S2Signals } from './s2-signals';

@Component({
  selector: 'app-s2-page',
  imports: [ModeToggle, S2Rxjs, S2Signals],
  template: `
    <div class="scenario">
      <h1>S2-S3 — Détail + avis + agent, en parallèle, avec erreur partielle</h1>
      <p class="hint">
        S2 : trois appels en parallèle (le logement, ses avis, puis l'agent qui dépend du logement).
        S3 : les avis échouent une fois sur deux (chaos) ; le reste doit rester affiché, avec un
        bouton « réessayer » sur les avis.
      </p>
      <app-mode-toggle [(mode)]="mode" />
      <div class="panes">
        @if (mode() !== 'signals') {
          <section class="pane rxjs"><h2>RxJS</h2><app-s2-rxjs [locationId]="id" /></section>
        }
        @if (mode() !== 'rxjs') {
          <section class="pane signals"><h2>Signals</h2><app-s2-signals [locationId]="id" /></section>
        }
      </div>
    </div>
  `,
})
export class S2Page {
  readonly mode = signal<Mode>('both');
  readonly id = Number(inject(ActivatedRoute).snapshot.params['id']);
}
