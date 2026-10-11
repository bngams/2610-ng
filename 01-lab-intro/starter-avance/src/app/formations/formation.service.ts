import { Injectable } from '@angular/core';
import { Formation } from '../models/formation';
import { FORMATIONS } from '../data/formations.data';

@Injectable({ providedIn: 'root' })
export class FormationService {
  getAll(): Formation[] {
    return FORMATIONS;
  }
}
