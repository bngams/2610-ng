import { Component } from '@angular/core';
import { ProductList } from '@shop/products';
import { RemoteSlot } from '@shop/ui';

@Component({
  imports: [ProductList, RemoteSlot],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {}
