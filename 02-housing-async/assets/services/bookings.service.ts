import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Booking } from '../housinglocation';
import { ResourceService } from './resource.service';

@Injectable({ providedIn: 'root' })
export class BookingsService extends ResourceService<number, Booking> {
  protected readonly path = 'bookings';

  /** Réserve : un POST qui crée une ligne dans /bookings (json-server l'écrit dans db.json). */
  book(locationId: number): Observable<Booking> {
    return this.create({ locationId, at: new Date().toISOString() });
  }
}
