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
      <h1>S5 — Disponibilité : polling, arrêt en quittant la page</h1>
      <p class="hint">
        Changez <code>available</code> côté serveur (PATCH, voir l'énoncé) : l'affichage doit suivre au tick suivant. Quittez la page : les appels doivent cesser.
      </p>
      <app-mode-toggle [(mode)]="mode" />
      @if (mode() === 'rxjs') {
        <section class="pane rxjs"><h2>RxJS</h2><app-s5-rxjs [locationId]="id" /></section>
      } @else {
        <section class="pane signals"><h2>Signals</h2><app-s5-signals [locationId]="id" /></section>
      }
    </div>
  `,
})
export class S5Page {
  readonly mode = signal<Mode>('rxjs');
  readonly id = Number(inject(ActivatedRoute).snapshot.params['id']);
}
