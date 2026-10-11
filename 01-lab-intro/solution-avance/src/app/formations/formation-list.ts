import {
  afterRenderEffect, Component, computed, effect, ElementRef, inject, linkedSignal, signal, viewChildren,
} from '@angular/core';
import { Filtres, Formation } from '../models/formation';
import { FormationCard } from './formation-card';
import { FormationFiltre } from './formation-filtre';
import { FormationService } from './formation.service';

const CLE_PANIER = 'lab-intro.panier';

@Component({
  selector: 'app-formation-list',
  imports: [FormationCard, FormationFiltre],
  template: `
    <section class="panier">
      <span>Panier : <strong>{{ panier().length }}</strong> inscription(s)</span>
      <span>Total : <strong>{{ montantAffiche() }} €</strong> {{ ttc() ? 'TTC' : 'HT' }}</span>
      <label><input type="checkbox" [checked]="ttc()" (change)="ttc.set(!ttc())" /> afficher TTC</label>
      <label>TVA <input type="number" step="0.01" min="0" max="1" [value]="tauxTVA()"
                        (input)="tauxTVA.set(+($any($event.target).value))" style="width:5em" /></label>
      @if (selection(); as id) {
        <span class="muted">sélection : #{{ id }}</span>
      }
    </section>

    <h2>Formations</h2>
    <app-formation-filtre [villes]="villes()" [filtres]="filtres()" (filtresChange)="filtres.set($event)" />

    <div class="cards">
      @for (f of filtrees(); track f.id) {
        <app-formation-card #carte [attr.data-id]="f.id"
          [formation]="f"
          [inscrit]="panier().includes(f.id)"
          [selected]="selection() === f.id"
          (inscrire)="inscrire($event)"
          (desinscrire)="desinscrire($event)"
          (selectionner)="selection.set($event)" />
      } @empty {
        <p class="muted">Aucune formation ne correspond aux filtres.</p>
      }
    </div>
  `,
})
export class FormationList {
  private service = inject(FormationService);

  // ── A1 : l'état de base, en signals ───────────────────────────────────────
  formations = signal<Formation[]>(this.service.getAll());
  panier = signal<number[]>(lirePanier());

  inscrire(id: number) {
    // immuable : on crée un nouveau tableau, jamais de push()
    this.panier.update(ids => (ids.includes(id) ? ids : [...ids, id]));
  }

  desinscrire(id: number) {
    this.panier.update(ids => ids.filter(x => x !== id));
  }

  // ── A6 : les filtres, avec une égalité par valeur ─────────────────────────
  // Sans `equal`, chaque objet émis par la barre de filtres (même identique) relancerait
  // `filtrees`, et donc réinitialiserait la sélection (A4).
  filtres = signal<Filtres>(
    { ville: '', niveau: '' },
    { equal: (a, b) => a.ville === b.ville && a.niveau === b.niveau },
  );

  // ── A2 : les dérivés ──────────────────────────────────────────────────────
  villes = computed(() => [...new Set(this.formations().map(f => f.ville))].sort());

  filtrees = computed(() => {
    const { ville, niveau } = this.filtres();
    return this.formations().filter(f => (!ville || f.ville === ville) && (!niveau || f.niveau === niveau));
  });

  total = computed(() =>
    this.panier()
      .map(id => this.formations().find(f => f.id === id)?.prixHT ?? 0)
      .reduce((somme, prix) => somme + prix, 0),
  );

  // ── A3 : dépendances dynamiques ───────────────────────────────────────────
  ttc = signal(false);
  tauxTVA = signal(0.2);

  // `tauxTVA` n'est une dépendance que lorsque `ttc()` est vrai : changer la TVA
  // avec la case décochée ne recalcule rien (regardez la console).
  montantAffiche = computed(() => {
    console.log('[A3] calcul du montant affiché');
    if (!this.ttc()) {
      return this.total();
    }
    return Math.round(this.total() * (1 + this.tauxTVA()));
  });

  // ── A4 puis A5 : la sélection, liée à la liste filtrée ───────────────────
  // A4 (première version) : se réinitialise à chaque changement de la liste filtrée.
  //   selection = linkedSignal<number | undefined>(() => { this.filtrees(); return undefined; });
  // A5 (version finale) : on garde la sélection si elle est encore dans la liste.
  selection = linkedSignal<Formation[], number | undefined>({
    source: this.filtrees,
    computation: (liste, precedent) => {
      const id = precedent?.value;
      return id !== undefined && liste.some(f => f.id === id) ? id : undefined;
    },
  });

  // ── A7 : effect() pour la persistance, afterRenderEffect() pour le DOM ───
  private cartes = viewChildren('carte', { read: ElementRef<HTMLElement> });

  constructor() {
    // Un effect ne sert qu'à sortir du monde réactif : ici, écrire dans le navigateur.
    effect(() => {
      localStorage.setItem(CLE_PANIER, JSON.stringify(this.panier()));
    });

    // Toucher le DOM se fait APRÈS le rendu, jamais dans un effect() classique.
    afterRenderEffect(() => {
      const id = this.selection();
      if (id === undefined) {
        return;
      }
      const carte = this.cartes().find(c => c.nativeElement.dataset['id'] === String(id));
      carte?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
}

function lirePanier(): number[] {
  try {
    return JSON.parse(localStorage.getItem(CLE_PANIER) ?? '[]');
  } catch {
    return [];
  }
}
