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

  it.todo('affiche « Chargement » puis une carte par produit reçu');

  it.todo("affiche un message si l'API répond en erreur");
});
