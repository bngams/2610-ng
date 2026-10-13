import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from '@shop/api';
import { ProductsService } from './products.service';
import { Product } from '../models/product';

describe('ProductsService', () => {
  let service: ProductsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(ProductsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() fait un GET sur /api/products', () => {
    let received: Product[] = [];
    service.list().subscribe((products) => (received = products));

    const req = http.expectOne('/api/products');
    expect(req.request.method).toBe('GET');
    req.flush([
      { id: 1, name: 'Clavier', price: 89, category: 'test', description: '', thumbnail: '' },
    ]);

    expect(received).toHaveLength(1);
  });

  it('get(3) fait un GET sur /api/products/3', () => {
    let received: Product | undefined;
    service.get(3).subscribe((product) => (received = product));

    http
      .expectOne('/api/products/3')
      .flush({
        id: 3,
        name: 'Écran',
        price: 249,
        category: 'test',
        description: '',
        thumbnail: '',
      });

    expect(received?.name).toBe('Écran');
  });
});
