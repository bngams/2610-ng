import { Service, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_URL, SUCCESS_MESSAGE } from '@shop/api';
import { User } from '../models/user';

/** La session : QUI est connecté, d'après le serveur. Aucun jeton ici : il vit dans un cookie httpOnly. */
@Service()
export class SessionStore {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  // l'état : privé ; null = personne n'est connecté
  private readonly _user = signal<User | null>(null);

  // la vue publique et les valeurs dérivées
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  /** La RÈGLE de rôle, partagée par les guards et par le menu. */
  hasRole(role: string): boolean {
    return this._user()?.roles.includes(role) ?? false;
  }

  /** « Qui suis-je ? » : le navigateur joint le cookie tout seul. Appelé au démarrage (provideAuth). */
  async loadSession(): Promise<void> {
    try {
      this._user.set(await firstValueFrom(this.http.get<User>(`${this.apiUrl}/auth/me`)));
    } catch {
      this._user.set(null); // 401 : personne n'est connecté, ce n'est pas une panne
    }
  }

  /** La réponse pose le cookie httpOnly ; son corps ne contient que l'utilisateur. Rejette si refusé. */
  async login(username: string, password: string): Promise<void> {
    const user = await firstValueFrom(
      this.http.post<User>(
        `${this.apiUrl}/auth/login`,
        { username, password },
        // un message de succès, demandé pour cette requête seulement (étape bonus 09)
        { context: new HttpContext().set(SUCCESS_MESSAGE, 'Vous êtes connecté.') },
      ),
    );
    this._user.set(user);
  }

  /** Le serveur supprime la session et efface le cookie ; vider le signal seul ne suffirait pas. */
  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/auth/logout`, {}));
    } finally {
      this._user.set(null);
    }
  }
}
