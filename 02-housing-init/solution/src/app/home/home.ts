import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HousingLocation } from '../housing-location/housing-location';
import { HousingService } from '../housing.service';

@Component({
  selector: 'app-home',
  imports: [HousingLocation],
  template: `
    <section>
      <form>
        <input type="text" placeholder="Filter by city" #filter />
        <button class="primary" type="button" (click)="filterResults(filter.value)">Search</button>
      </form>
    </section>
    <section class="results">
      @for (housingLocation of filteredLocationList(); track $index) {
        <app-housing-location [housingLocation]="housingLocation" />
      }
    </section>
  `,
  styleUrl: './home.css',
})
export class Home {
  housingService: HousingService = inject(HousingService);
  housingLocationList = toSignal(this.housingService.getAllHousingLocations(), {
    initialValue: [],
  });
  filterText = signal('');
  filteredLocationList = computed(() => {
    const text = this.filterText().toLowerCase();
    if (!text) {
      return this.housingLocationList();
    }
    return this.housingLocationList().filter((housingLocation) =>
      housingLocation.city.toLowerCase().includes(text),
    );
  });

  filterResults(text: string) {
    this.filterText.set(text);
  }
}
