import { Injectable } from '@angular/core';
import { Review } from '../housinglocation';
import { ResourceService } from './resource.service';

@Injectable({ providedIn: 'root' })
export class ReviewsService extends ResourceService<number, Review> {
  protected readonly path = 'reviews';
}
