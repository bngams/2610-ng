import { Avis, Formation } from '../models/formation';

export const FORMATIONS: Formation[] = [
  { id: 1, titre: 'Angular 22 : les fondamentaux',      ville: 'Toulouse', niveau: 'init',   prixHT: 1800, places: 8, dateDebut: '2026-11-03' },
  { id: 2, titre: 'Angular avancé : signals et RxJS',   ville: 'Paris',    niveau: 'avance', prixHT: 2100, places: 6, dateDebut: '2026-11-17' },
  { id: 3, titre: 'TypeScript pour le front',           ville: 'Toulouse', niveau: 'init',   prixHT: 1200, places: 2, dateDebut: '2026-11-24' },
  { id: 4, titre: 'Tests unitaires Angular (Vitest)',   ville: 'Lyon',     niveau: 'avance', prixHT: 1500, places: 0, dateDebut: '2026-12-01' },
  { id: 5, titre: 'Micro-frontends avec Angular',       ville: 'Paris',    niveau: 'avance', prixHT: 2400, places: 5, dateDebut: '2026-12-08' },
  { id: 6, titre: 'Accessibilité web (RGAA)',           ville: 'Lyon',     niveau: 'init',   prixHT: 1100, places: 9, dateDebut: '2026-12-15' },
  { id: 7, titre: 'Angular Material et CDK',            ville: 'Toulouse', niveau: 'avance', prixHT: 1600, places: 3, dateDebut: '2027-01-12' },
  { id: 8, titre: 'Git et GitLab CI pour les devs',     ville: 'Nantes',   niveau: 'init',   prixHT: 1000, places: 7, dateDebut: '2027-01-19' },
];

export const AVIS: Record<number, Avis[]> = {
  1: [
    { auteur: 'Camille', note: 5, commentaire: 'Très progressif, parfait pour démarrer.' },
    { auteur: 'Idris',   note: 4, commentaire: 'Bon rythme, un peu dense le 3e jour.' },
  ],
  2: [
    { auteur: 'Nour',    note: 5, commentaire: 'Enfin clair sur signals vs RxJS.' },
    { auteur: 'Théo',    note: 4, commentaire: 'Les cas réels font la différence.' },
    { auteur: 'Alex',    note: 3, commentaire: 'J\'aurais aimé plus de temps sur le store.' },
  ],
  3: [{ auteur: 'Lou', note: 4, commentaire: 'Indispensable avant Angular.' }],
  5: [{ auteur: 'Sam', note: 5, commentaire: 'Module Federation démystifié.' }],
  7: [{ auteur: 'Jo',  note: 4, commentaire: 'Le CDK vaut le détour.' }],
};
