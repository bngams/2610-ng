import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '@shop/api';
import { ProductList } from './product-list';

describe('ProductList', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(), // remplace le réseau : aucune requête ne part
        { provide: API_URL, useValue: '/api' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify()); // aucune requête inattendue ou oubliée

  it('affiche « Chargement » puis une carte par produit reçu', async () => {
    const fixture = TestBed.createComponent(ProductList);
    // pas de whenStable ici : la requête en attente empêcherait l'application d'être « stable »
    fixture.detectChanges(); // premier rendu : la requête part
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Chargement');

    // on répond à la main à la requête que le composant a envoyée
    http.expectOne('/api/products').flush([
      { id: 1, name: 'Clavier', price: 89, category: 'test', description: '', thumbnail: '' },
      { id: 2, name: 'Souris', price: 45, category: 'test', description: '', thumbnail: '' },
    ]);
    await fixture.whenStable();

    expect(element.querySelectorAll('lib-product-card').length).toBe(2);
  });

  it("affiche un message si l'API répond en erreur", async () => {
    const fixture = TestBed.createComponent(ProductList);
    fixture.detectChanges();

    http.expectOne('/api/products').flush('boom', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('indisponibles');
  });
});
