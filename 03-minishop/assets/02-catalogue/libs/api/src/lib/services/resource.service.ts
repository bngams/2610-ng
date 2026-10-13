import { inject } from '@angular/core';
import { HttpClient, HttpResourceRef, httpResource } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';

/** Les paramètres de requête d'une liste, par exemple `{ name_like: 'clavier' }`. */
export type ListParams = Record<string, string | number | boolean>;

/**
 * Le CRUD commun à toutes les ressources json-server, écrit une fois (la classe du jour 2).
 *
 * - `I` : le type de l'identifiant (`number` avec json-server, `string` pour des UUID).
 * - `T` : le modèle ; `id` est optionnel, car un objet qu'on va créer n'en a pas encore.
 *
 * Les méthodes renvoient des Observables (côté RxJS) ; `getResource` et `listResource`
 * renvoient un `httpResource` (côté signals).
 */
export abstract class ResourceService<I extends number | string, T extends { id?: I }> {
  protected readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  /** Le segment de la ressource dans l'URL, par exemple `'products'`. */
  protected abstract readonly path: string;

  /** Un getter, pas un champ : un champ de la classe mère serait calculé avant que la sous-classe ait défini `path`. */
  protected get url(): string {
    return `${this.apiUrl}/${this.path}`;
  }

  list(params: ListParams = {}): Observable<T[]> {
    return this.http.get<T[]>(this.url, { params });
  }

  get(id: I): Observable<T> {
    return this.http.get<T>(`${this.url}/${id}`);
  }

  create(item: Omit<T, 'id'>): Observable<T> {
    return this.http.post<T>(this.url, item);
  }

  patch(id: I, changes: Partial<T>): Observable<T> {
    return this.http.patch<T>(`${this.url}/${id}`, changes);
  }

  /** Un élément, rechargé quand `id()` change ; reste `idle` tant que `id()` vaut `undefined`. */
  getResource(id: () => I | undefined): HttpResourceRef<T | undefined> {
    return httpResource<T>(() => {
      const value = id();
      return value === undefined ? undefined : `${this.url}/${value}`;
    });
  }

  /** Une liste, rechargée quand `params()` change ; reste `idle` tant que `params()` vaut `undefined`. */
  listResource(
    params: () => ListParams | undefined = () => ({}),
  ): HttpResourceRef<T[] | undefined> {
    return httpResource<T[]>(() => {
      const value = params();
      return value === undefined ? undefined : { url: this.url, params: value };
    });
  }
}
