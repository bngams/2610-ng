import { Component, model } from '@angular/core';

export type Mode = 'both' | 'rxjs' | 'signals';

/**
 * Bascule RxJS / Signals / les deux côte à côte, partagée par toutes les pages de scénario.
 * Chaque page fait son propre `@if` sur le mode : quand un volet est masqué, son composant est
 * réellement détruit (utile pour vérifier le nettoyage, S5).
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
  readonly mode = model<Mode>('both');
  readonly modes: Mode[] = ['both', 'rxjs', 'signals'];
  readonly labels: Record<Mode, string> = { both: 'Les deux', rxjs: 'RxJS seul', signals: 'Signals seul' };
}
