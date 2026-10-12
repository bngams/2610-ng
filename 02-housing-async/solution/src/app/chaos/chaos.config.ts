/**
 * Configuration du chaos : latence aléatoire et taux d'erreur par route.
 *
 * Chaque règle s'applique aux requêtes dont l'URL (avec ses query params) correspond à `match`
 * (une RegExp, ou un préfixe de chaîne). La première règle qui correspond gagne ; sinon on prend
 * CHAOS_DEFAULT. Mettez CHAOS_ENABLED à false pour retrouver une API "normale".
 */
export interface ChaosRule {
  /** RegExp testée sur l'URL, ou préfixe de chaîne (startsWith). */
  match: RegExp | string;
  /** Latence minimale ajoutée AVANT l'envoi de la requête, en ms. */
  minDelayMs: number;
  /** Latence maximale, en ms. */
  maxDelayMs: number;
  /** Probabilité (0..1) de répondre 503 au lieu d'envoyer la requête. */
  errorRate: number;
}

export const CHAOS_ENABLED = true;

export const CHAOS_DEFAULT: Omit<ChaosRule, 'match'> = {
  minDelayMs: 300,
  maxDelayMs: 1500,
  errorRate: 0,
};

export const CHAOS_RULES: ChaosRule[] = [
  // S3 : passez errorRate à 0.5 pour que les avis tombent une fois sur deux.
  { match: /\/api\/reviews/, minDelayMs: 300, maxDelayMs: 1500, errorRate: 0 },
  // S4 : décommentez pour que « trois clics rapides » soit atteignable à la souris.
  // { match: /\/api\/bookings/, minDelayMs: 1000, maxDelayMs: 2000, errorRate: 0 },
];
