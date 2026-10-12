import { inject, Signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { DummyJsonList, Page, toPage } from './page';

// Service CRUD générique : I = type de l'id, T = type de la ressource.
// - Observables pour tout ce qui est appelé à la demande (lectures ET mutations),
//   pour pouvoir composer avec RxJS (switchMap, exhaustMap, retry...).
// - Fabriques httpResource pour les lectures pilotées par des signals.
export abstract class ResourceService<I, T> {
  protected readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // endpoint = 'products' : sert à la fois pour l'URL et pour la clé de l'enveloppe
  constructor(protected readonly endpoint: string) {}

  protected url(path = ''): string {
    return `${this.baseUrl}/${this.endpoint}${path}`;
  }

  // --- Observables ---
  list(skip = 0, limit = 10): Observable<Page<T>> {
    return this.http
      .get<DummyJsonList<string, T>>(this.url(), { params: { skip, limit } })
      .pipe(map(toPage<string, T>(this.endpoint))); // on déballe ICI, une seule fois
  }

  get(id: I): Observable<T> {
    return this.http.get<T>(this.url(`/${id}`));
  }

  // dummyjson simule les écritures : la réponse est correcte, rien n'est enregistré
  create(item: Partial<T>): Observable<T> {
    return this.http.post<T>(this.url('/add'), item); // dummyjson : POST /products/add
  }

  patch(id: I, changes: Partial<T>): Observable<T> {
    return this.http.patch<T>(this.url(`/${id}`), changes);
  }

  // --- Fabriques httpResource (lecture seule, réactives) ---
  listResource(params: Signal<{ skip: number; limit: number }>) {
    return httpResource<Page<T>>(() => ({ url: this.url(), params: params() }), {
      parse: (raw) => toPage<string, T>(this.endpoint)(raw as DummyJsonList<string, T>),
    });
  }

  oneResource(id: Signal<I>) {
    return httpResource<T>(() => this.url(`/${id()}`));
  }
}
