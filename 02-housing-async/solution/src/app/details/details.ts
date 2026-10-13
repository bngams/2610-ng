import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { LocationsService } from '../api/locations.service';
import { ApplicationForm } from '../application-form/application-form';
import { ApplicationFormSignals } from '../application-form/application-form-signals';

@Component({
  selector: 'app-details',
  imports: [ApplicationForm, ApplicationFormSignals],
  template: `
    <article>
      <img
        class="listing-photo"
        [src]="housingLocation()?.photo"
        alt="Exterior photo of {{ housingLocation()?.name }}"
        crossorigin
      />
      <section class="listing-description">
        <h2 class="listing-heading">{{ housingLocation()?.name }}</h2>
        <p class="listing-location">{{ housingLocation()?.city }}, {{ housingLocation()?.state }}</p>
      </section>
      <section class="listing-features">
        <h2 class="section-heading">About this housing location</h2>
        <ul>
          <li>Units available: {{ housingLocation()?.availableUnits }}</li>
          <li>Does this location have wifi: {{ housingLocation()?.wifi }}</li>
          <li>Does this location have laundry: {{ housingLocation()?.laundry }}</li>
          <li>Monthly rent: {{ housingLocation()?.price }} $</li>
        </ul>
      </section>
      <section class="listing-apply">
        <h2 class="section-heading">Apply now to live here</h2>
        <div class="form-switch">
          <button type="button" [class.on]="formVersion() === 'reactive'" (click)="formVersion.set('reactive')">
            Reactive Forms
          </button>
          <button type="button" [class.on]="formVersion() === 'signals'" (click)="formVersion.set('signals')">
            Signal Forms
          </button>
        </div>
        @if (formVersion() === 'reactive') {
          <app-application-form [locationId]="housingLocationId" />
        } @else {
          <app-application-form-signals [locationId]="housingLocationId" />
        }
      </section>
    </article>
  `,
  styleUrl: './details.css',
})
export class Details {
  route: ActivatedRoute = inject(ActivatedRoute);
  locationsService = inject(LocationsService);
  housingLocationId = Number(this.route.snapshot.params['id']);
  housingLocation = toSignal(this.locationsService.get(this.housingLocationId));
  formVersion = signal<'reactive' | 'signals'>('signals');
}
