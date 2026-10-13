import { TestBed } from '@angular/core/testing';
import { ProductCard } from './product-card';
import { Product } from '../../models/product';

const KEYBOARD: Product = {
  id: 1,
  name: 'Clavier',
  price: 89,
  category: 'test',
  description: 'AZERTY',
  thumbnail: '',
};

describe('ProductCard', () => {
  it('affiche le nom du produit reçu en input', async () => {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', KEYBOARD); // un input se donne par setInput
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Clavier');
  });

  it("n'affiche pas « Ajouter » par défaut", async () => {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', KEYBOARD);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });

  it('un clic sur « Ajouter » envoie le produit au panier', async () => {
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', KEYBOARD);
    fixture.componentRef.setInput('canAdd', true);
    // le panier est remplacé par une fonction espion, branchée sur l'output add
    const cartAdd = vi.fn();
    fixture.componentInstance.add.subscribe(cartAdd);
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();

    expect(cartAdd).toHaveBeenCalledTimes(1);
    expect(cartAdd).toHaveBeenCalledWith(KEYBOARD);
  });
});
