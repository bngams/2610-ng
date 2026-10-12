import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  readonly pending = signal(0);

  start() {
    this.pending.update((count) => count + 1);
  }

  stop() {
    this.pending.update((count) => count - 1);
  }
}
