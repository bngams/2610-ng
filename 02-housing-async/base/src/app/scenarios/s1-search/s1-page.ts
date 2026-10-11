import { Component, signal } from '@angular/core';
import { Mode, ModeToggle } from '../mode-toggle';
import { S1Rxjs } from './s1-rxjs';
import { S1Signals } from './s1-signals';

@Component({
  selector: 'app-s1-page',
  imports: [ModeToggle, S1Rxjs, S1Signals],
  template: `
    <div class="scenario">
      <h1>S1 — Recherche live par ville</h1>
      <p class="hint">
        Tapez vite « Chi » puis « Chicago » : seul le dernier résultat doit s'afficher, les
        requêtes intermédiaires doivent apparaître « annulée » dans le log chaos.
      </p>
      <app-mode-toggle [(mode)]="mode" />
      <div class="panes">
        @if (mode() !== 'signals') {
          <section class="pane rxjs"><h2>RxJS</h2><app-s1-rxjs /></section>
        }
        @if (mode() !== 'rxjs') {
          <section class="pane signals"><h2>Signals</h2><app-s1-signals /></section>
        }
      </div>
    </div>
  `,
})
export class S1Page {
  readonly mode = signal<Mode>('both');
}
