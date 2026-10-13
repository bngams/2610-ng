/** Un lien du menu de l'en-tête. */
export interface MenuItem {
  /** Le texte du lien. */
  title: string;
  /** La route visée, par exemple '/catalog'. */
  path: string;
  /** Facultatif : le lien n'est affiché que si cette fonction renvoie true. */
  visible?: () => boolean;
}
