import { TestBed } from '@angular/core/testing';
import { FormationList } from './formation-list';

describe('FormationList (Avancé)', () => {
  beforeEach(() => localStorage.clear());

  async function monter() {
    await TestBed.configureTestingModule({ imports: [FormationList] }).compileComponents();
    const fixture = TestBed.createComponent(FormationList);
    await fixture.whenStable();
    return fixture;
  }

  it('A1/A2 : inscription immuable, total et places restantes', async () => {
    const fixture = await monter();
    const cmp = fixture.componentInstance;
    const avant = cmp.panier();
    cmp.inscrire(1);
    expect(cmp.panier()).not.toBe(avant);           // nouveau tableau
    expect(cmp.total()).toBe(1800);
    cmp.inscrire(1);                                 // idempotent
    expect(cmp.panier()).toEqual([1]);
    await fixture.whenStable();
    const premiereCarte = fixture.nativeElement.querySelector('app-formation-card');
    expect(premiereCarte.textContent).toContain('7 place(s)');
  });

  it('A3 : la TVA n\'est trackée que si TTC est actif', async () => {
    const fixture = await monter();
    const cmp = fixture.componentInstance;
    cmp.inscrire(1);
    expect(cmp.montantAffiche()).toBe(1800);
    cmp.tauxTVA.set(0.5);
    expect(cmp.montantAffiche()).toBe(1800);          // pas de dépendance à tauxTVA
    cmp.ttc.set(true);
    expect(cmp.montantAffiche()).toBe(2700);
  });

  it('A5/A6 : la sélection survit à un filtre compatible et à une ré-application', async () => {
    const fixture = await monter();
    const cmp = fixture.componentInstance;
    cmp.selection.set(2);                                    // Angular avancé, Paris
    cmp.filtres.set({ ville: 'Paris', niveau: '' });
    expect(cmp.selection()).toBe(2);                         // encore dans la liste
    cmp.filtres.set({ ville: 'Paris', niveau: '' });         // même valeurs, objet neuf
    expect(cmp.selection()).toBe(2);                         // equal custom : rien ne bouge
    cmp.filtres.set({ ville: 'Toulouse', niveau: '' });
    expect(cmp.selection()).toBeUndefined();                 // plus dans la liste
  });

  it('A7 : le panier est persisté par un effect', async () => {
    const fixture = await monter();
    fixture.componentInstance.inscrire(3);
    await fixture.whenStable();
    expect(localStorage.getItem('lab-intro.panier')).toBe('[3]');
  });
});
