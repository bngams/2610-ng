import { Service, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Les messages à l'écran, en snackbar Material. Ce service ne connaît pas l'api : il a seulement
 * la forme qu'elle attend (error, success), et c'est l'application qui le branche sur NOTIFIER.
 */
@Service()
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  error(message: string): void {
    this.snackBar.open(message, 'Fermer', { duration: 6000 });
  }

  success(message: string): void {
    this.snackBar.open(message, undefined, { duration: 3000 });
  }
}
