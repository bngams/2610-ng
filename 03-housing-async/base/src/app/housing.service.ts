import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Agent, Availability, Booking, HousingLocationInfo, Review } from './housinglocation';

/**
 * Accès à l'API json-server, via le proxy du serveur de dev (`/api` -> http://localhost:3000).
 *
 * Migré depuis le `fetch` du tutoriel vers `HttpClient` : chaque méthode renvoie un Observable
 * froid (rien ne part tant que personne ne s'abonne), annulable (unsubscribe = requête abandonnée),
 * et surtout interceptable : c'est ce qui permet à l'intercepteur "chaos" d'ajouter latence et
 * erreurs sur chaque appel.
 */
@Injectable({ providedIn: 'root' })
export class HousingService {
  private readonly http = inject(HttpClient);
  readonly url = '/api';

  getAllHousingLocations(): Observable<HousingLocationInfo[]> {
    return this.http.get<HousingLocationInfo[]>(`${this.url}/locations`);
  }

  getHousingLocationById(id: number): Observable<HousingLocationInfo> {
    return this.http.get<HousingLocationInfo>(`${this.url}/locations/${id}`);
  }

  /** Recherche par ville, côté serveur (json-server : `?city_like=` est une regex insensible à la casse). */
  searchByCity(query: string): Observable<HousingLocationInfo[]> {
    return this.http.get<HousingLocationInfo[]>(`${this.url}/locations`, {
      params: { city_like: query },
    });
  }

  getReviews(locationId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.url}/reviews`, { params: { locationId } });
  }

  getAgent(agentId: number): Observable<Agent> {
    return this.http.get<Agent>(`${this.url}/agents/${agentId}`);
  }

  getAvailability(locationId: number): Observable<Availability> {
    return this.http.get<Availability>(`${this.url}/availability/${locationId}`);
  }

  /** Réserve : un POST qui crée une ligne dans /bookings (json-server l'ajoute à db.json). */
  book(locationId: number): Observable<Booking> {
    const body: Booking = { locationId, at: new Date().toISOString() };
    return this.http.post<Booking>(`${this.url}/bookings`, body);
  }

  getBookings(locationId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.url}/bookings`, { params: { locationId } });
  }

  submitApplication(firstName: string, lastName: string, email: string) {
    console.log(
      `Homes application received: firstName: ${firstName}, lastName: ${lastName}, email: ${email}.`,
    );
  }
}
