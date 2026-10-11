import { TestBed } from '@angular/core/testing';
import { FormationList } from './formation-list';

describe('FormationList (Init)', () => {
  it('affiche les 8 formations et met le panier à jour au clic', async () => {
    await TestBed.configureTestingModule({ imports: [FormationList] }).compileComponents();
    const fixture = TestBed.createComponent(FormationList);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelectorAll('app-formation-card').length).toBe(8);

    const premierBouton = el.querySelector<HTMLButtonElement>('app-formation-card button')!;
    premierBouton.click();
    await fixture.whenStable();

    expect(el.querySelector('.panier')?.textContent).toContain('1 inscription');
    expect(el.querySelector('.panier')?.textContent).toContain('1800 € HT');
  });
});
