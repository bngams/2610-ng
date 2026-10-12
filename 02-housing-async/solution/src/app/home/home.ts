import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HousingLocation } from '../housing-location/housing-location';
import { LocationsService } from '../api/locations.service';

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
    <section class="pager">
      <button type="button" [disabled]="page() <= 1" (click)="page.set(page() - 1)">Précédent</button>
      <span>Page {{ page() }} / {{ lastPage() }} ({{ total() }} logements)</span>
      <button type="button" [disabled]="page() >= lastPage()" (click)="page.set(page() + 1)">Suivant</button>
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
  locationsService = inject(LocationsService);
  readonly pageSize = 4;

  filterText = signal('');
  page = signal(1);

  /** Bonus de l'étape 08 : la ville et la page partent au serveur (city_like, _page, _limit). */
  readonly result = rxResource({
    params: () => ({ city: this.filterText(), page: this.page() }),
    stream: ({ params }) =>
      this.locationsService.page({ city_like: params.city }, params.page, this.pageSize),
  });

  filteredLocationList = computed(() => this.result.value()?.data ?? []);
  readonly total = computed(() => this.result.value()?.meta?.total ?? 0);
  readonly lastPage = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));

  filterResults(text: string) {
    this.filterText.set(text);
    this.page.set(1);
  }
}
