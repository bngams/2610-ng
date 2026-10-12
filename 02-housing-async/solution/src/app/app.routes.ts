import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Details } from './details/details';
import { S1Page } from './scenarios/s1-search/s1-page';
import { S2Page } from './scenarios/s2-details/s2-page';
import { S4Page } from './scenarios/s4-booking/s4-page';
import { S5Page } from './scenarios/s5-polling/s5-page';
import { S6Page } from './scenarios/s6-filters/s6-page';

export const routes: Routes = [
  { path: '', component: Home, title: 'Home page' },
  { path: 'details/:id', component: Details, title: 'Home details' },
  { path: 's1', component: S1Page, title: 'S1 — Recherche : anti-rebond et annulation' },
  { path: 's2/:id', component: S2Page, title: 'S2-S3 — Détail : trois appels en parallèle, un sur trois échoue' },
  { path: 's4/:id', component: S4Page, title: 'S4 — Réserver : clics rapides' },
  { path: 's5/:id', component: S5Page, title: 'S5 — Disponibilité : polling, arrêt en quittant la page' },
  { path: 's6', component: S6Page, title: 'S6 — Filtres : dérivation synchrone, sans requête' },
];
