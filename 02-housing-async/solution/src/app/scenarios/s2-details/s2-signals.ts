import { Component, computed, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Agent, HousingLocationInfo, Review } from '../../housinglocation';

/**
 * S2 côté signals : trois resources indépendantes, chacune avec son propre statut.
 * UX : chaque bloc apparaît dès qu'il est prêt (pas de "tout ou rien"), et un computed
 * `ready` dit quand tout est là, si vous préférez l'UX de forkJoin.
 *
 * L'agent dépend du logement : ses params renvoient `undefined` tant que location n'a pas de
 * valeur, et un resource dont les params valent undefined reste idle (aucune requête). Dès que
 * location se résout, les params changent et la requête part : c'est le switchMap de RxJS,
 * exprimé en dérivation. (Angular 22.2 propose aussi `chain()` dans le contexte des params.)
 *
 * S3 : l'erreur est locale à la resource. reviews.error() pour l'afficher, reviews.reload()
 * pour ne relancer QUE les avis : c'est exactement ce que forkJoin ne savait pas faire.
 */
@Component({
  selector: 'app-s2-signals',
  template: `
    <p class="status">ready() = {{ ready() }}</p>

    @if (location.isLoading()) {
      <div class="skeleton"></div>
    } @else if (location.error()) {
      <p class="error">Logement : {{ location.error()?.message }}</p>
      <button type="button" (click)="location.reload()">Réessayer</button>
    } @else if (location.hasValue()) {
      <h3>{{ location.value().name }}</h3>
      <p>{{ location.value().city }}, {{ location.value().state }} — {{ location.value().price }} $/mois</p>
    }

    @if (agent.isLoading()) {
      <div class="skeleton"></div>
    } @else if (agent.error()) {
      <p class="error">Agent : {{ agent.error()?.message }}</p>
    } @else if (agent.hasValue()) {
      <p>Agent : {{ agent.value().name }} ({{ agent.value().agency }})</p>
    }

    @if (reviews.isLoading()) {
      <div class="skeleton"></div>
      <div class="skeleton"></div>
    } @else if (reviews.error()) {
      <p class="error">Avis indisponibles ({{ reviews.error()?.message }})</p>
      <button type="button" (click)="reviews.reload()">Réessayer (les avis seulement)</button>
    } @else if (reviews.hasValue()) {
      <ul>
        @for (r of reviews.value(); track r.id) {
          <li>{{ r.rating }}/5 — {{ r.author }} : {{ r.text }}</li>
        }
      </ul>
    }
  `,
})
export class S2Signals {
  readonly locationId = input.required<number>();

  readonly location = httpResource<HousingLocationInfo>(() => `/api/locations/${this.locationId()}`);

  readonly reviews = httpResource<Review[]>(() => ({
    url: '/api/reviews',
    params: { locationId: this.locationId() },
  }));

  readonly agent = httpResource<Agent>(() =>
    this.location.hasValue() ? `/api/agents/${this.location.value().agentId}` : undefined,
  );

  readonly ready = computed(
    () => this.location.hasValue() && this.reviews.hasValue() && this.agent.hasValue(),
  );
}
