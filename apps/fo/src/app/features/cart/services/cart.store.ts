import { Service, computed, effect, signal } from '@angular/core';
import { Product } from '@shop/products';

/** Une ligne du panier : un produit et sa quantité. */
export interface CartLine {
  product: Product;
  qty: number;
}

const STORAGE_KEY = 'minishop.cart';

/** Le panier : un service qui sert de store (une seule instance, un état privé, des signals). */
@Service() // Angular 22 : fourni à la racine (en v20 : @Injectable({ providedIn: 'root' }))
export class CartStore {
  // l'état : PRIVÉ, seul le store peut l'écrire ; relu dans localStorage au démarrage
  private readonly _lines = signal<CartLine[]>(readSavedCart());

  // la vue publique : le même signal, en lecture seule (pas de set ni d'update)
  readonly lines = this._lines.asReadonly();

  // les valeurs dérivées : des computed, recalculés quand _lines change
  readonly count = computed(() => this._lines().reduce((n, line) => n + line.qty, 0));
  readonly total = computed(() =>
    this._lines().reduce((sum, line) => sum + line.qty * line.product.price, 0),
  );

  constructor() {
    // effet de bord : recopier l'état dans localStorage à chaque changement
    effect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(this._lines())));
  }

  // les actions : les seules portes d'entrée, qui produisent toujours un NOUVEAU tableau
  add(product: Product): void {
    this._lines.update((lines) => {
      const existing = lines.find((line) => line.product.id === product.id);
      return existing
        ? lines.map((line) => (line === existing ? { ...line, qty: line.qty + 1 } : line))
        : [...lines, { product, qty: 1 }];
    });
  }

  remove(productId: number): void {
    this._lines.update((lines) => lines.filter((line) => line.product.id !== productId));
  }

  changeQty(productId: number, qty: number): void {
    if (qty <= 0) {
      this.remove(productId);
      return;
    }
    this._lines.update((lines) =>
      lines.map((line) => (line.product.id === productId ? { ...line, qty } : line)),
    );
  }

  clear(): void {
    this._lines.set([]);
  }
}

/** Relit le panier sauvegardé, sans jamais faire planter le démarrage. */
function readSavedCart(): CartLine[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as CartLine[]) : [];
  } catch {
    return []; // JSON corrompu, ou stockage indisponible
  }
}
