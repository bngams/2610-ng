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
      @for (housingLocation of filteredLocationList(); track housingLocation.id) {
        <app-housing-location [housingLocation]="housingLocation" />
      }
    </section>
  `,
  styleUrl: './home.css',
})
export class Home {
  private readonly housingService = inject(HousingService);

  /** Lab Init : fetch + then + markForCheck(). Ici : un Observable lu par toSignal, le rendu suit tout seul. */
  readonly housingLocationList = toSignal(this.housingService.getAllHousingLocations(), {
    initialValue: [],
  });
  readonly filterText = signal('');
  readonly filteredLocationList = computed(() => {
    const text = this.filterText().toLowerCase();
    const list = this.housingLocationList();
    return text ? list.filter((l) => l.city.toLowerCase().includes(text)) : list;
  });

  filterResults(text: string) {
    this.filterText.set(text);
  }
}
