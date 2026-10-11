import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  it('affiche le titre', async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Catalogue');
  });
});
