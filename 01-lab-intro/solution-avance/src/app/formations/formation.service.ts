import { Injectable } from '@angular/core';
import { Avis, Formation } from '../models/formation';
import { AVIS, FORMATIONS } from '../data/formations.data';

@Injectable({ providedIn: 'root' })
export class FormationService {
  getAll(): Formation[] {
    return FORMATIONS;
  }

  getAvis(formationId: number): Avis[] {
    return AVIS[formationId] ?? [];
  }
}
