import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HousingLocationInfo } from './housinglocation';
import { Application } from './application';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class HousingService {
  private readonly http = inject(HttpClient);
  readonly url = `${environment.apiUrl}/locations`;
  readonly applicationsUrl = `${environment.apiUrl}/applications`;

  getAllHousingLocations(): Observable<HousingLocationInfo[]> {
    return this.http.get<HousingLocationInfo[]>(this.url);
  }

  getHousingLocationById(id: number): Observable<HousingLocationInfo> {
    return this.http.get<HousingLocationInfo>(`${this.url}/${id}`);
  }

  submitApplication(application: Application): Observable<Application> {
    return this.http.post<Application>(this.applicationsUrl, application);
  }
}
