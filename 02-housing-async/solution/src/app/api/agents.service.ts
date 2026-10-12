import { Injectable } from '@angular/core';
import { Agent } from '../housinglocation';
import { ResourceService } from './resource.service';

@Injectable({ providedIn: 'root' })
export class AgentsService extends ResourceService<number, Agent> {
  protected readonly path = 'agents';
}
