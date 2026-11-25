import { TestBed } from '@angular/core/testing';
import { ProductCard } from './product-card';
import { Product } from '../../models/product';

// un produit de test, toujours le même
const KEYBOARD: Product = {
  id: 1,
  name: 'Clavier',
  price: 89,
  category: 'test',
  description: 'AZERTY',
  thumbnail: '',
};

describe('ProductCard', () => {
  it.todo('affiche le nom du produit reçu en input');

  it.todo("n'affiche pas « Ajouter » par défaut");

  it.todo('un clic sur « Ajouter » envoie le produit au panier');
});
