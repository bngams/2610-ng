import { InjectionToken, inject } from '@angular/core';
import { HttpClient, HttpResourceRef, httpResource } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * L'adresse de base de l'API. Un jeton plutôt qu'un import direct d'`environment` dans la
 * classe : un test peut fournir une autre valeur (`{ provide: API_URL, useValue: '…' }`), et la
 * classe ne dépend plus d'un fichier propre à cette application.
 */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});

/** Les paramètres de requête d'une liste, par exemple `{ locationId: 3 }` ou `{ city_like: 'chi' }`. */
export type ListParams = Record<string, string | number | boolean>;

/** Ce que l'API v2 dit d'une liste : le nombre total d'éléments, la page et sa taille. */
export interface ApiMeta {
  total: number;
  page: number;
  limit: number;
}

/** Le contrat v2 : toute réponse est enveloppée ; `meta` vaut `null` pour un élément seul. */
export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta | null;
}

/** Désenveloppe une réponse v2 : utilisée par les Observables (`map`) et par les resources (`parse`). */
function unwrap<T>(response: ApiResponse<T>): T {
  return response.data;
}

/**
 * Le CRUD commun à toutes les ressources json-server, écrit une fois.
 *
 * - `I` : le type de l'identifiant (`number` ici ; `string` pour une API qui utilise des UUID).
 * - `T` : le modèle ; `id` est optionnel, car un objet qu'on va créer n'en a pas encore.
 *
 * Les méthodes renvoient des Observables, pas des Promises : les composants les combinent avec
 * des opérateurs (`switchMap`, `forkJoin`, `exhaustMap`…), et se désabonner annule la requête.
 * `getResource` et `listResource` renvoient un `httpResource`, pour le côté signals.
 */
export abstract class ResourceService<I extends number | string, T extends { id?: I }> {
  protected readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  /** Le segment de la ressource dans l'URL, par exemple `'locations'`. */
  protected abstract readonly path: string;

  /** Un getter, pas un champ : un champ de la classe mère serait calculé avant que la sous-classe ait défini `path`. */
  protected get url(): string {
    return `${this.apiUrl}/${this.path}`;
  }

  list(params: ListParams = {}): Observable<T[]> {
    return this.http.get<ApiResponse<T[]>>(this.url, { params }).pipe(map(unwrap));
  }

  /** Une page de la liste, sans désenvelopper : l'appelant a besoin de `meta` (total, page, taille). */
  page(params: ListParams, page: number, limit: number): Observable<ApiResponse<T[]>> {
    return this.http.get<ApiResponse<T[]>>(this.url, {
      params: { ...params, _page: page, _limit: limit },
    });
  }

  get(id: I): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.url}/${id}`).pipe(map(unwrap));
  }

  create(item: Omit<T, 'id'>): Observable<T> {
    return this.http.post<ApiResponse<T>>(this.url, item).pipe(map(unwrap));
  }

  patch(id: I, changes: Partial<T>): Observable<T> {
    return this.http.patch<ApiResponse<T>>(`${this.url}/${id}`, changes).pipe(map(unwrap));
  }

  /** Un élément, rechargé quand `id()` change ; reste `idle` tant que `id()` vaut `undefined`. */
  getResource(id: () => I | undefined): HttpResourceRef<T | undefined> {
    return httpResource<T>(
      () => {
        const value = id();
        return value === undefined ? undefined : `${this.url}/${value}`;
      },
      { parse: (raw) => unwrap(raw as ApiResponse<T>) },
    );
  }

  /** Une liste, rechargée quand `params()` change ; reste `idle` tant que `params()` vaut `undefined`. */
  listResource(params: () => ListParams | undefined): HttpResourceRef<T[] | undefined> {
    return httpResource<T[]>(
      () => {
        const value = params();
        return value === undefined ? undefined : { url: this.url, params: value };
      },
      { parse: (raw) => unwrap(raw as ApiResponse<T[]>) },
    );
  }
}
