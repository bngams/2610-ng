import { TestBed } from '@angular/core/testing';
import { Product } from '@shop/products';
import { CartStore } from './cart.store';

const PEN: Product = {
  id: 1,
  name: 'Stylo',
  price: 1.5,
  category: 'test',
  description: '',
  thumbnail: '',
};
const NOTEBOOK: Product = {
  id: 2,
  name: 'Cahier',
  price: 4,
  category: 'test',
  description: '',
  thumbnail: '',
};

describe('CartStore', () => {
  // le store relit localStorage à sa construction : chaque test part d'un stockage vide
  beforeEach(() => localStorage.clear());

  it('calcule count et total après des ajouts', () => {
    const cart = TestBed.inject(CartStore);
    cart.add(PEN);
    cart.add(PEN);
    cart.add(NOTEBOOK);
    expect(cart.lines()).toHaveLength(2); // deux lignes : le stylo (x2) et le cahier
    expect(cart.count()).toBe(3);
    expect(cart.total()).toBe(7); // 2 x 1,5 + 4
  });

  it('changeQty à 0 retire la ligne', () => {
    const cart = TestBed.inject(CartStore);
    cart.add(PEN);
    cart.changeQty(PEN.id, 0);
    expect(cart.lines()).toEqual([]);
  });

  it('clear vide le panier', () => {
    const cart = TestBed.inject(CartStore);
    cart.add(NOTEBOOK);
    cart.clear();
    expect(cart.count()).toBe(0);
  });

  it('sauvegarde dans localStorage, et relit au démarrage', () => {
    TestBed.inject(CartStore).add(NOTEBOOK);
    TestBed.tick(); // laisse l'effect s'exécuter
    expect(JSON.parse(localStorage.getItem('minishop.cart')!)).toHaveLength(1);

    TestBed.resetTestingModule(); // une « nouvelle application », comme après F5
    expect(TestBed.inject(CartStore).count()).toBe(1);
  });
});
