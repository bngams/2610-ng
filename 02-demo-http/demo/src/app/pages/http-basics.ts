import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product, ProductModel } from '../products/product';

@Component({
  selector: 'app-http-basics',
  template: `
    <h1>Bases HttpClient</h1>

    <h2>1. Lire un Observable dans un composant</h2>
    <p>Reçu par toSignal : <strong>{{ product()?.title ?? 'chargement…' }}</strong>
      (le subscribe écrit dans la console)</p>

    <h2>2. Le piège de la classe</h2>
    <table>
      <tr><th></th><th>get&lt;ProductModel&gt;()</th><th>get&lt;Product&gt;() + map(fromJson)</th></tr>
      <tr><td>instanceof ProductModel</td><td>{{ wrongIsInstance() }}</td><td>{{ rightIsInstance() }}</td></tr>
      <tr><td>typeof discountedPrice</td><td>{{ wrongMethodType() }}</td><td>{{ rightMethodType() }}</td></tr>
      <tr><td>discountedPrice()</td><td>TypeError si on l'appelle</td><td>{{ right()?.discountedPrice() }}</td></tr>
    </table>

    <h2>3. Provoquer des erreurs</h2>
    <button (click)="call('/auth/me')">GET /auth/me avec le faux jeton (401)</button>
    <button (click)="call('/products/99999')">GET /products/99999 (404)</button>
    @if (lastError(); as status) { <p class="error">Le composant a reçu l'erreur {{ status }}.</p> }
  `,
})
export class HttpBasics {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  // un Observable HTTP est FROID : rien ne part tant que personne ne s'abonne,
  // et CHAQUE abonnement relance la requête (ici : 2 abonnements => 2 requêtes)
  private readonly product$ = this.http.get<Product>(`${environment.apiUrl}/products/1`);

  // abonnement n°1 : toSignal s'abonne, et se désabonne à la destruction du composant
  readonly product = toSignal(this.product$);

  constructor() {
    // abonnement n°2 : subscribe à la main, takeUntilDestroyed coupe à la destruction
    this.product$
      .pipe(takeUntilDestroyed())
      .subscribe((p) => console.log('[bases] reçu par subscribe :', p.title));
  }

  // PIÈGE : le <ProductModel> ne construit rien, c'est une promesse faite au compilateur
  readonly wrong = toSignal(this.http.get<ProductModel>(`${environment.apiUrl}/products/2`));
  readonly wrongIsInstance = computed(() => this.wrong() instanceof ProductModel); // false
  readonly wrongMethodType = computed(() => typeof this.wrong()?.discountedPrice); // 'undefined'

  // CORRECT : on reçoit l'interface, puis on construit l'instance explicitement
  readonly right = toSignal(
    this.http.get<Product>(`${environment.apiUrl}/products/2`).pipe(map(ProductModel.fromJson)),
  );
  readonly rightIsInstance = computed(() => this.right() instanceof ProductModel); // true
  readonly rightMethodType = computed(() => typeof this.right()?.discountedPrice); // 'function'

  readonly lastError = signal<number | undefined>(undefined);

  call(path: string) {
    this.lastError.set(undefined);
    this.http
      .get(`${environment.apiUrl}${path}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: (err: HttpErrorResponse) => this.lastError.set(err.status) });
  }
}
