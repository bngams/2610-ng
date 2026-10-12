// La forme BRUTE renvoyée par dummyjson pour une liste :
// { products: [...], total, skip, limit }, { users: [...], ... }, { carts: [...], ... }
// La clé du tableau change selon la ressource, d'où le paramètre K.
export type DummyJsonList<K extends string, T> = Record<K, T[]> & {
  total: number;
  skip: number;
  limit: number;
};

// NOTRE forme, identique pour toutes les ressources : c'est elle que voient les composants.
export interface Page<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// L'adaptateur : transforme l'enveloppe dummyjson en Page<T>.
export function toPage<K extends string, T>(key: K) {
  return (raw: DummyJsonList<K, T>): Page<T> => ({
    items: raw[key],
    total: raw.total,
    skip: raw.skip,
    limit: raw.limit,
  });
}
