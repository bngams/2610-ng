import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { SessionStore } from '../../services/session.store';

/** Anonyme : « Se connecter ». Connecté : le nom, et « Se déconnecter ». */
@Component({
  imports: [MatButtonModule],
  selector: 'lib-session-button',
  styleUrl: './session-button.css',
  templateUrl: './session-button.html',
})
export class SessionButton {
  protected readonly session = inject(SessionStore);
  private readonly router = inject(Router);

  login(): void {
    // returnUrl : la page courante, pour y revenir après la connexion
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  async logout(): Promise<void> {
    await this.session.logout();
    // 'reload' : même si l'on est déjà sur '/', le routeur refait la navigation, donc rejoue les guards
    await this.router.navigateByUrl('/', { onSameUrlNavigation: 'reload' });
  }
}
