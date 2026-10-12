import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Mode, ModeToggle } from '../mode-toggle';
import { S4Rxjs } from './s4-rxjs';
import { S4Signals } from './s4-signals';

@Component({
  selector: 'app-s4-page',
  imports: [ModeToggle, S4Rxjs, S4Signals],
  template: `
    <div class="scenario">
      <h1>S4 — Race condition : clics rapides sur « réserver »</h1>
      <p class="hint">
        Cliquez trois fois très vite sur chaque bouton, puis comptez les lignes créées dans
        <code>api/db.json</code> (section <code>bookings</code>) et lisez le log chaos.
      </p>
      <app-mode-toggle [(mode)]="mode" />
      <div class="panes">
        @if (mode() !== 'signals') {
          <section class="pane rxjs"><h2>RxJS</h2><app-s4-rxjs [locationId]="id" /></section>
        }
        @if (mode() !== 'rxjs') {
          <section class="pane signals"><h2>Signals</h2><app-s4-signals [locationId]="id" /></section>
        }
      </div>
    </div>
  `,
})
export class S4Page {
  readonly mode = signal<Mode>('both');
  readonly id = Number(inject(ActivatedRoute).snapshot.params['id']);
}
