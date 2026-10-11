import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HousingService } from '../housing.service';

@Component({
  selector: 'app-details',
  imports: [ReactiveFormsModule, RouterLink],
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
        <p class="scenario-links">
          Scénarios sur ce logement :
          <a [routerLink]="['/s2', id]">S2-S3</a> ·
          <a [routerLink]="['/s4', id]">S4</a> ·
          <a [routerLink]="['/s5', id]">S5</a>
        </p>
      </section>
      <section class="listing-apply">
        <h2 class="section-heading">Apply now to live here</h2>
        <form [formGroup]="applyForm" (submit)="submitApplication()">
          <label for="first-name">First Name</label>
          <input id="first-name" type="text" formControlName="firstName" />

          <label for="last-name">Last Name</label>
          <input id="last-name" type="text" formControlName="lastName" />

          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" />
          <button type="submit" class="primary">Apply now</button>
        </form>
      </section>
    </article>
  `,
  styleUrls: ['./details.css'],
})
export class Details {
  private readonly route = inject(ActivatedRoute);
  private readonly housingService = inject(HousingService);

  readonly id = Number(this.route.snapshot.params['id']);
  readonly housingLocation = toSignal(this.housingService.getHousingLocationById(this.id));

  applyForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    email: new FormControl(''),
  });

  submitApplication() {
    this.housingService.submitApplication(
      this.applyForm.value.firstName ?? '',
      this.applyForm.value.lastName ?? '',
      this.applyForm.value.email ?? '',
    );
  }
}
