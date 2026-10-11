import { Component } from '@angular/core';
import { FormationList } from './formations/formation-list';

@Component({
  selector: 'app-root',
  imports: [FormationList],
  template: `
    <h1>Catalogue de formations</h1>
    <p class="muted">Lab Intro, parcours Avancé : point de départ.</p>
    <app-formation-list />
  `,
})
export class App {}
