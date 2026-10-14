import { TestBed } from '@angular/core/testing';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { ControlsOf } from './controls-of';

interface Guarantor {
  name: string;
  income: number;
}

interface Dossier {
  name: string;
  moveIn: Date;
  address: { city: string };
  tags: string[];
  guarantors: Guarantor[];
}

describe('ControlsOf', () => {
  it('type un formulaire construit avec NonNullableFormBuilder', () => {
    const fb = TestBed.inject(NonNullableFormBuilder);

    const form: FormGroup<ControlsOf<Dossier>> = fb.group({
      name: fb.control('Alice'),
      moveIn: fb.control(new Date('2027-01-15')),
      address: fb.group({ city: fb.control('Toulouse') }),
      tags: fb.array([fb.control('calme')]),
      guarantors: fb.array([fb.group({ name: fb.control('Bob'), income: fb.control(2500) })]),
    });

    // le type guide la suite : chaque accès est vérifié par le compilateur
    const city: FormControl<string> = form.controls.address.controls.city;
    const guarantors: FormArray<FormGroup<ControlsOf<Guarantor>>> = form.controls.guarantors;
    const moveIn: FormControl<Date> = form.controls.moveIn;

    expect(city.value).toBe('Toulouse');
    expect(guarantors.at(0).controls.income.value).toBe(2500);
    expect(moveIn.value).toBeInstanceOf(Date);
    expect(form.getRawValue().tags).toEqual(['calme']);
  });

  it('refuse un groupe là où le modèle attend une valeur', () => {
    const fb = TestBed.inject(NonNullableFormBuilder);
    // @ts-expect-error : moveIn est une Date, donc un FormControl<Date>, pas un FormGroup
    const wrong: ControlsOf<Dossier>['moveIn'] = fb.group({ year: fb.control(2027) });
    expect(wrong).toBeTruthy();
  });
});
