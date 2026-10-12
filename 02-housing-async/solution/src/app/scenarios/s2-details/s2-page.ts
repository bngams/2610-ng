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
      <h1>S2-S3 — Détail : trois appels en parallèle, un sur trois échoue</h1>
      <p class="hint">
        S2 : le logement, ses avis et son agent (qui dépend du logement), lancés au plus tôt. S3 — Détail : un appel sur trois échoue : même page, avec <code>errorRate: 0.5</code> sur <code>/api/reviews</code> dans <code>chaos.config.ts</code> ; le reste doit rester affiché, avec un bouton « réessayer » sur les avis.
      </p>
      <app-mode-toggle [(mode)]="mode" />
      @if (mode() === 'rxjs') {
        <section class="pane rxjs"><h2>RxJS</h2><app-s2-rxjs [locationId]="id" /></section>
      } @else {
        <section class="pane signals"><h2>Signals</h2><app-s2-signals [locationId]="id" /></section>
      }
    </div>
  `,
})
export class S2Page {
  readonly mode = signal<Mode>('rxjs');
  readonly id = Number(inject(ActivatedRoute).snapshot.params['id']);
}
