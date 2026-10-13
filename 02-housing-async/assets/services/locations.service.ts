import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HousingLocationInfo } from '../housinglocation';
import { ResourceService } from './resource.service';

@Injectable({ providedIn: 'root' })
export class LocationsService extends ResourceService<number, HousingLocationInfo> {
  protected readonly path = 'locations';

  /** Recherche par ville, côté serveur (json-server 0.17 : `?city_like=` est une regex insensible à la casse). */
  searchByCity(query: string): Observable<HousingLocationInfo[]> {
    return this.list({ city_like: query });
  }
}
