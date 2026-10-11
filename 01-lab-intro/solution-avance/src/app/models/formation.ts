export type Niveau = 'init' | 'avance';

export interface Formation {
  id: number;
  titre: string;
  ville: string;
  niveau: Niveau;
  prixHT: number;   // en euros, hors taxes
  places: number;   // places restantes
  dateDebut: string; // AAAA-MM-JJ
}

export interface Avis {
  auteur: string;
  note: number; // 1 à 5
  commentaire: string;
}

/** Les filtres du catalogue : chaîne vide = pas de filtre. */
export interface Filtres {
  ville: string;
  niveau: Niveau | '';
}
