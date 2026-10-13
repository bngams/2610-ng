import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { HousingService } from '../housing.service';
import { ApplicationForm } from '../application-form/application-form';

@Component({
  selector: 'app-details',
  imports: [ApplicationForm],
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
        </ul>
      </section>
      <section class="listing-apply">
        <h2 class="section-heading">Apply now to live here</h2>
        <app-application-form [locationId]="housingLocationId" />
      </section>
    </article>
  `,
  styleUrl: './details.css',
})
export class Details {
  route: ActivatedRoute = inject(ActivatedRoute);
  housingService = inject(HousingService);
  housingLocationId = Number(this.route.snapshot.params['id']);
  housingLocation = toSignal(this.housingService.getHousingLocationById(this.housingLocationId));
}
