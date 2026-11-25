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

  it.todo('calcule count et total après des ajouts');

  it.todo('changeQty à 0 retire la ligne');

  it.todo('clear vide le panier');

  it.todo('sauvegarde dans localStorage, et relit au démarrage');
});
