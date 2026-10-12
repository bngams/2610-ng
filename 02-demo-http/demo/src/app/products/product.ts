// Ce que l'API renvoie : une INTERFACE décrit la forme du JSON, sans rien créer.
export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  thumbnail: string;
}

// Une CLASSE seulement si on a un vrai comportement à porter.
// Elle ne se remplit jamais toute seule : il faut la construire (fromJson).
export class ProductModel {
  constructor(
    readonly id: number,
    readonly title: string,
    readonly price: number,
    readonly discountPercentage: number,
  ) {}

  static fromJson(json: Product): ProductModel {
    return new ProductModel(json.id, json.title, json.price, json.discountPercentage);
  }

  discountedPrice(): number {
    return Math.round(this.price * (1 - this.discountPercentage / 100) * 100) / 100;
  }
}
