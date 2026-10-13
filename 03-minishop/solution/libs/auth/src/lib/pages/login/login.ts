import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SessionStore } from '../../services/session.store';

@Component({
  imports: [FormField, MatFormFieldModule, MatInputModule, MatButtonModule],
  selector: 'lib-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  protected readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // le modèle du formulaire, et le formulaire Signal Forms construit dessus
  private readonly credentials = signal({ username: '', password: '' });
  protected readonly loginForm = form(this.credentials, (path) => {
    required(path.username);
    required(path.password);
  });
  protected readonly error = signal('');

  async send(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set('');
    await submit(this.loginForm, async () => {
      const { username, password } = this.credentials();
      try {
        await this.session.login(username, password);
      } catch {
        this.error.set('Identifiants invalides');
        return; // refusé : on reste sur la page
      }
      // retour à la page demandée avant la redirection (guard, intercepteur ou bouton)
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(returnUrl?.startsWith('/login') ? '/' : (returnUrl ?? '/'));
    });
  }
}
