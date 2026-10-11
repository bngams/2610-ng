/**
 * Les pièges du parcours Avancé, prouvés par des tests.
 * Chaque test reproduit le comportement surprenant décrit dans le guide (A1 à A7).
 * Lancez `npm test` : tout est vert, c'est-à-dire que les pièges se comportent bien comme annoncé.
 */
import { TestBed } from '@angular/core/testing';
import { computed, effect, signal, untracked } from '@angular/core';

describe('Pièges signals', () => {
  it('A1 : push() sur le tableau d\'un signal ne prévient personne', () => {
    const panier = signal<number[]>([1]);
    const taille = computed(() => panier().length);
    expect(taille()).toBe(1);

    panier().push(2);                 // mutation en place : même référence
    expect(panier().length).toBe(2);  // le tableau a bien changé…
    expect(taille()).toBe(1);         // …mais le computed ne le sait pas

    panier.update(ids => [...ids, 3]); // nouvelle référence : tout le monde est prévenu
    expect(taille()).toBe(3);
  });

  it('A2 : un computed est paresseux et mémorisé, un effet de bord dedans est imprévisible', () => {
    let executions = 0;
    const prix = signal(100);
    const avecLog = computed(() => { executions++; return prix() * 2; });

    expect(executions).toBe(0);       // personne n'a lu : rien ne s'est exécuté
    avecLog(); avecLog();
    expect(executions).toBe(1);       // deux lectures, un seul calcul
    prix.set(200);
    expect(executions).toBe(1);       // le changement ne déclenche rien tant qu'on ne relit pas
    avecLog();
    expect(executions).toBe(2);
  });

  it('A3 : une dépendance lue sous condition n\'est trackée que quand la branche s\'exécute', () => {
    let executions = 0;
    const ttc = signal(false);
    const taux = signal(0.2);
    const total = signal(100);
    const montant = computed(() => { executions++; return ttc() ? total() * (1 + taux()) : total(); });

    expect(montant()).toBe(100);
    taux.set(0.5);
    expect(montant()).toBe(100);
    expect(executions).toBe(1);       // taux n'est pas (encore) une dépendance
    ttc.set(true);
    expect(montant()).toBe(150);
    taux.set(1);
    expect(montant()).toBe(200);      // maintenant si
    expect(executions).toBe(3);
  });

  it('A3 bis : untracked() fige une lecture', () => {
    const total = signal(100);
    const taux = signal(0.2);
    const montant = computed(() => total() * (1 + untracked(taux)));
    expect(montant()).toBe(120);
    taux.set(0.5);
    expect(montant()).toBe(120);      // la TVA a changé, le montant non
    total.set(200);
    expect(montant()).toBe(300);      // seulement quand `total` bouge, et avec la TVA du moment
  });

  it('A6 : un objet recréé à chaque set() redéclenche tout, sauf avec un equal par valeur', () => {
    let calculs = 0;
    const sansEqual = signal({ ville: 'Paris' });
    const d1 = computed(() => { calculs++; return sansEqual().ville; });
    d1(); sansEqual.set({ ville: 'Paris' }); d1();
    expect(calculs).toBe(2);          // mêmes valeurs, objet neuf : recalcul

    calculs = 0;
    const avecEqual = signal({ ville: 'Paris' }, { equal: (a, b) => a.ville === b.ville });
    const d2 = computed(() => { calculs++; return avecEqual().ville; });
    d2(); avecEqual.set({ ville: 'Paris' }); d2();
    expect(calculs).toBe(1);          // considéré inchangé : rien ne bouge
  });

  it('A7 : un effect qui écrit dans un signal fonctionne, mais la valeur dérivée est en retard', () => {
    const count = signal(1);
    const double = signal(0);
    TestBed.runInInjectionContext(() => effect(() => double.set(count() * 2)));

    expect(double()).toBe(0);         // l'effect n'a pas encore tourné
    TestBed.tick();
    expect(double()).toBe(2);
    count.set(5);
    expect(double()).toBe(2);         // en retard : l'effect est planifié, pas exécuté
    TestBed.tick();
    expect(double()).toBe(10);

    const doubleComputed = computed(() => count() * 2);
    expect(doubleComputed()).toBe(10); // un computed est toujours à jour, sans planification
  });
});
