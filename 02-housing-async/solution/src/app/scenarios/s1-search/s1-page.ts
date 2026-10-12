import { Component, signal } from '@angular/core';
import { Mode, ModeToggle } from '../mode-toggle';
import { S1Rxjs } from './s1-rxjs';
import { S1Signals } from './s1-signals';

@Component({
  selector: 'app-s1-page',
  imports: [ModeToggle, S1Rxjs, S1Signals],
  template: `
    <div class="scenario">
      <h1>S1 — Recherche : anti-rebond et annulation</h1>
      <p class="hint">
        Tapez « Jun », une courte pause, puis « eau » : seul le résultat de « Juneau » doit
        s'afficher, et le log chaos doit montrer « Jun => annulée ».
      </p>
      <app-mode-toggle [(mode)]="mode" />
      @if (mode() === 'rxjs') {
        <section class="pane rxjs"><h2>RxJS</h2><app-s1-rxjs /></section>
      } @else {
        <section class="pane signals"><h2>Signals</h2><app-s1-signals /></section>
      }
    </div>
  `,
})
export class S1Page {
  readonly mode = signal<Mode>('rxjs');
}
