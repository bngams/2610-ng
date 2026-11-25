import { Component } from '@angular/core';
import { PromoBanner } from './components/promo-banner/promo-banner';

@Component({
  imports: [PromoBanner],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
