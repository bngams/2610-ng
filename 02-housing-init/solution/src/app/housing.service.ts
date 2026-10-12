import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HousingLocationInfo } from './housinglocation';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class HousingService {
  private readonly http = inject(HttpClient);
  readonly url = `${environment.apiUrl}/locations`;

  getAllHousingLocations(): Observable<HousingLocationInfo[]> {
    return this.http.get<HousingLocationInfo[]>(this.url);
  }

  getHousingLocationById(id: number): Observable<HousingLocationInfo> {
    return this.http.get<HousingLocationInfo>(`${this.url}/${id}`);
  }

  submitApplication(firstName: string, lastName: string, email: string) {
    console.log(
      `Homes application received: firstName: ${firstName}, lastName: ${lastName}, email: ${email}.`,
    );
  }
}
