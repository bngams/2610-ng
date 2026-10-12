import { Injectable } from '@angular/core';
import { Availability } from '../housinglocation';
import { ResourceService } from './resource.service';

/** L'`id` d'une disponibilité vaut le `locationId` du logement : `get(locationId)` suffit. */
@Injectable({ providedIn: 'root' })
export class AvailabilityService extends ResourceService<number, Availability> {
  protected readonly path = 'availability';
}
