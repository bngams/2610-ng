/** Un produit du catalogue, tel que l'API le renvoie sur /api/products. */
export interface Product {
  id: number;
  name: string;
  /** Le prix, en dollars. */
  price: number;
  category: string;
  description: string;
  /** L'adresse de la vignette : une image hébergée sur internet (cdn.dummyjson.com). */
  thumbnail: string;
}
