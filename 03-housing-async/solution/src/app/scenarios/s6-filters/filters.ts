import { HousingLocationInfo } from '../../housinglocation';

export type SortKey = 'name' | 'price';

/** Filtre + tri purs : la même fonction sert aux deux volets, seule la plomberie réactive change. */
export function applyFilters(
  list: HousingLocationInfo[],
  city: string,
  maxPrice: number,
  sort: SortKey,
): HousingLocationInfo[] {
  const q = city.trim().toLowerCase();
  return list
    .filter((l) => (!q || l.city.toLowerCase().includes(q)) && l.price <= maxPrice)
    .sort((a, b) => (sort === 'price' ? a.price - b.price : a.name.localeCompare(b.name)));
}
