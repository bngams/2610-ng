/** L'utilisateur connecté, tel que l'API le renvoie sur /api/auth/me et /api/auth/login. */
export interface User {
  username: string;
  roles: string[];
}
