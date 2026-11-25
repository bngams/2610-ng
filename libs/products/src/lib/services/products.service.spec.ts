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
    // TODO : la même configuration que dans product-list.spec.ts
    service = TestBed.inject(ProductsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it.todo('list() fait un GET sur /api/products');

  it.todo('get(3) fait un GET sur /api/products/3');
});
