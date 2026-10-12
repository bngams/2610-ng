import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Mode, ModeToggle } from '../mode-toggle';
import { S5Rxjs } from './s5-rxjs';
import { S5Signals } from './s5-signals';

@Component({
  selector: 'app-s5-page',
  imports: [ModeToggle, S5Rxjs, S5Signals],
  template: `
    <div class="scenario">
      <h1>S5 — Polling de disponibilité toutes les 3 s</h1>
      <p class="hint">
        Changez <code>available</code> dans <code>api/db.json</code> (ou via PATCH) : l'affichage
        doit suivre en moins de 3 s. Quittez la page : les appels doivent cesser.
      </p>
      <app-mode-toggle [(mode)]="mode" />
      <div class="panes">
        @if (mode() !== 'signals') {
          <section class="pane rxjs"><h2>RxJS</h2><app-s5-rxjs [locationId]="id" /></section>
        }
        @if (mode() !== 'rxjs') {
          <section class="pane signals"><h2>Signals</h2><app-s5-signals [locationId]="id" /></section>
        }
      </div>
    </div>
  `,
})
export class S5Page {
  readonly mode = signal<Mode>('both');
  readonly id = Number(inject(ActivatedRoute).snapshot.params['id']);
}
