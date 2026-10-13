import { Component, model } from '@angular/core';

export type Mode = 'rxjs' | 'signals';

/**
 * Bascule RxJS / Signals, partagée par toutes les pages de scénario. Un seul volet à la fois :
 * quand on change de mode, le composant du volet précédent est détruit (c'est la façon de
 * vérifier qu'un flux s'arrête bien, le suivi de disponibilité), et le log chaos ne montre que les requêtes d'un volet.
 */
@Component({
  selector: 'app-mode-toggle',
  template: `
    <div class="mode-toggle">
      @for (m of modes; track m) {
        <button type="button" [class.on]="mode() === m" (click)="mode.set(m)">{{ labels[m] }}</button>
      }
    </div>
  `,
})
export class ModeToggle {
  readonly mode = model<Mode>('rxjs');
  readonly modes: Mode[] = ['rxjs', 'signals'];
  readonly labels: Record<Mode, string> = { rxjs: 'RxJS', signals: 'Signals' };
}
