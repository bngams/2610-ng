import { Injectable } from '@angular/core';
import { ResourceService } from '../core/resource.service';
import { Product } from './product';

@Injectable({ providedIn: 'root' })
export class ProductsService extends ResourceService<number, Product> {
  constructor() { super('products'); }
}
