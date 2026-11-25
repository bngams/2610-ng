import { FormArray, FormControl, FormGroup } from '@angular/forms';

/**
 * Décrit les contrôles d'un formulaire réactif typé à partir d'un modèle.
 *
 * - tableau d'objets           => FormArray<FormGroup<…>>
 * - tableau de valeurs simples => FormArray<FormControl<…>>
 * - objet imbriqué             => FormGroup<…>
 * - Date et valeurs simples    => FormControl<…>
 *
 * Exemple : `form: FormGroup<ControlsOf<Dossier>>`.
 * Un objet optionnel ou nullable (`address?: Address`, `Address | null`) devient un FormControl :
 * gardez obligatoires les objets que vous voulez éditer champ par champ.
 */
export type ControlsOf<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends Array<infer U>
    ? U extends Date
      ? FormArray<FormControl<U>>
      : U extends Record<string, any>
        ? FormArray<FormGroup<ControlsOf<U>>>
        : FormArray<FormControl<U>>
    : T[K] extends Date
      ? FormControl<T[K]>
      : T[K] extends Record<string, any>
        ? FormGroup<ControlsOf<T[K]>>
        : FormControl<T[K]>;
};
