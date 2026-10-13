import { Component, computed, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FieldTree,
  FormField,
  applyEach,
  email,
  form,
  min,
  pattern,
  provideSignalFormsConfig,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { NG_STATUS_CLASSES } from '@angular/forms/signals/compat';
import { firstValueFrom } from 'rxjs';
import { Application } from '../application';
import { ApplicationsService } from '../api/applications.service';

/** Ce que le formulaire saisit : un dossier sans id (donné par l'API) ni locationId (donné par Details). */
type Dossier = Omit<Application, 'id' | 'locationId'>;

@Component({
  selector: 'app-application-form-signals',
  imports: [FormField],
  // Signal Forms ne pose pas les classes ng-invalid / ng-touched : on les demande, pour réutiliser
  // la feuille de style du dossier Reactive (input.ng-invalid.ng-touched).
  providers: [provideSignalFormsConfig({ classes: NG_STATUS_CLASSES })],
  styleUrl: './application-form.css',
  template: `
    @if (createdId(); as id) {
      <p class="confirmation">Application #{{ id }} received. We will get back to you soon.</p>
    } @else {
      <p class="progress">Step {{ step() }} of 3 · form valid: {{ dossier().valid() }}</p>
      <form novalidate (submit)="send($event)">
        @if (step() === 1) {
          <fieldset>
            <legend>Who are you?</legend>
            <label for="first-name">First Name</label>
            <input id="first-name" type="text" [formField]="dossier.identity.firstName" />
            @if (showErrors(dossier.identity.firstName)) {
              @for (error of dossier.identity.firstName().errors(); track error.kind) {
                <p class="error">{{ error.message }}</p>
              }
            }

            <label for="last-name">Last Name</label>
            <input id="last-name" type="text" [formField]="dossier.identity.lastName" />
            @if (showErrors(dossier.identity.lastName)) {
              @for (error of dossier.identity.lastName().errors(); track error.kind) {
                <p class="error">{{ error.message }}</p>
              }
            }

            <label for="email">Email</label>
            <input id="email" type="email" [formField]="dossier.identity.email" />
            @if (showErrors(dossier.identity.email)) {
              @for (error of dossier.identity.email().errors(); track error.kind) {
                <p class="error">{{ error.message }}</p>
              }
            }

            <label for="phone">Phone</label>
            <input id="phone" type="tel" [formField]="dossier.identity.phone" />
            @if (showErrors(dossier.identity.phone)) {
              @for (error of dossier.identity.phone().errors(); track error.kind) {
                <p class="error">{{ error.message }}</p>
              }
            }
          </fieldset>
        }

        @if (step() === 2) {
          <fieldset>
            <legend>Your situation</legend>
            <label for="monthly-income">Monthly income</label>
            <input id="monthly-income" type="number" [formField]="dossier.situation.monthlyIncome" />
            @if (showErrors(dossier.situation.monthlyIncome)) {
              @for (error of dossier.situation.monthlyIncome().errors(); track error.kind) {
                <p class="error">{{ error.message }}</p>
              }
            }

            <label for="move-in-date">Move-in date</label>
            <input id="move-in-date" type="date" [formField]="dossier.situation.moveInDate" />
            @if (showErrors(dossier.situation.moveInDate)) {
              @for (error of dossier.situation.moveInDate().errors(); track error.kind) {
                <p class="error">{{ error.message }}</p>
              }
            }

            @for (guarantor of dossier.situation.guarantors; track guarantor; let i = $index) {
              <div class="guarantor">
                <label [for]="'guarantor-name-' + i">Guarantor {{ i + 1 }}: name</label>
                <input [id]="'guarantor-name-' + i" type="text" [formField]="guarantor.name" />
                @if (showErrors(guarantor.name)) {
                  @for (error of guarantor.name().errors(); track error.kind) {
                    <p class="error">{{ error.message }}</p>
                  }
                }

                <label [for]="'guarantor-income-' + i">Guarantor {{ i + 1 }}: monthly income</label>
                <input [id]="'guarantor-income-' + i" type="number" [formField]="guarantor.income" />
                @if (showErrors(guarantor.income)) {
                  @for (error of guarantor.income().errors(); track error.kind) {
                    <p class="error">{{ error.message }}</p>
                  }
                }

                <button type="button" class="secondary" (click)="removeGuarantor(i)">
                  Remove this guarantor
                </button>
              </div>
            }
            <button type="button" class="secondary" (click)="addGuarantor()">Add a guarantor</button>
          </fieldset>
        }

        @if (step() === 3) {
          @let d = model();
          <section class="summary">
            <h3>Check your application</h3>
            <p>
              {{ d.identity.firstName }} {{ d.identity.lastName }}, {{ d.identity.email }},
              {{ d.identity.phone }}
            </p>
            <p>
              Monthly income: {{ d.situation.monthlyIncome }}, move-in date:
              {{ d.situation.moveInDate }}
            </p>
            <p>Guarantors: {{ d.situation.guarantors.length }}</p>
            <ul>
              @for (guarantor of d.situation.guarantors; track $index) {
                <li>{{ guarantor.name }} ({{ guarantor.income }} per month)</li>
              }
            </ul>
          </section>
          @if (sendError()) {
            <p class="error">Sending failed ({{ sendError() }}). Please try again.</p>
          }
        }

        <div class="actions">
          @if (step() > 1) {
            <button type="button" class="secondary" (click)="prev()">Previous</button>
          }
          @if (step() < 3) {
            <button type="button" class="primary" (click)="next()">Next</button>
          } @else {
            <button type="submit" class="primary" [disabled]="!canSend()">
              {{ dossier().submitting() ? 'Sending…' : 'Send my application' }}
            </button>
          }
        </div>
      </form>
    }
  `,
})
export class ApplicationFormSignals {
  readonly locationId = input.required<number>();
  private readonly applicationsService = inject(ApplicationsService);

  /** La source de vérité : un signal ordinaire, qui a la forme du dossier. */
  readonly model = signal<Dossier>({
    identity: { firstName: '', lastName: '', email: '', phone: '' },
    situation: { monthlyIncome: 0, moveInDate: '', guarantors: [] },
  });

  /** Le schéma : toutes les règles, au même endroit. */
  readonly dossier = form(this.model, (path) => {
    required(path.identity.firstName, { message: 'First name is required.' });
    required(path.identity.lastName, { message: 'Last name is required.' });
    required(path.identity.email, { message: 'Email is required.' });
    email(path.identity.email, { message: 'Enter a valid email address.' });
    required(path.identity.phone, { message: 'Phone is required.' });
    pattern(path.identity.phone, /^[0-9]{10}$/, { message: 'Enter 10 digits, without spaces.' });
    required(path.situation.monthlyIncome, { message: 'Enter a monthly income greater than 0.' });
    min(path.situation.monthlyIncome, 1, { message: 'Enter a monthly income greater than 0.' });
    required(path.situation.moveInDate, { message: 'Move-in date is required.' });
    validate(path.situation.moveInDate, ({ value }) =>
      !value() || new Date(value()) > new Date()
        ? undefined
        : { kind: 'futureDate', message: 'The move-in date must be in the future.' },
    );
    applyEach(path.situation.guarantors, (guarantor) => {
      required(guarantor.name, { message: 'Name is required.' });
      required(guarantor.income, { message: 'Enter a monthly income greater than 0.' });
      min(guarantor.income, 1, { message: 'Enter a monthly income greater than 0.' });
    });
  });

  readonly step = signal(1);
  readonly createdId = signal<number | undefined>(undefined);
  readonly sendError = signal('');
  /** Un computed qui lit l'état du formulaire : possible sans pont, ce sont des signals. */
  readonly canSend = computed(() => this.dossier().valid() && !this.dossier().submitting());

  showErrors(field: FieldTree<unknown>): boolean {
    return field().touched() && field().invalid();
  }

  next() {
    const current = this.step() === 1 ? this.dossier.identity : this.dossier.situation;
    if (current().invalid()) {
      current().markAsTouched();
      return;
    }
    this.step.update((step) => step + 1);
  }

  prev() {
    this.step.update((step) => step - 1);
  }

  addGuarantor() {
    this.model.update((d) => ({
      ...d,
      situation: { ...d.situation, guarantors: [...d.situation.guarantors, { name: '', income: 0 }] },
    }));
  }

  removeGuarantor(index: number) {
    this.model.update((d) => ({
      ...d,
      situation: {
        ...d.situation,
        guarantors: d.situation.guarantors.filter((_, i) => i !== index),
      },
    }));
  }

  async send(event: Event) {
    event.preventDefault();
    this.sendError.set('');
    try {
      const accepted = await submit(this.dossier, async () => {
        const application = { locationId: this.locationId(), ...this.model() };
        const created = await firstValueFrom(this.applicationsService.create(application));
        this.createdId.set(created.id);
      });
      if (!accepted) {
        console.log('[dossier] submit() a refusé : dossier invalide, ou envoi déjà en cours');
      }
    } catch (error) {
      this.sendError.set(
        error instanceof HttpErrorResponse ? `${error.status} ${error.statusText}` : String(error),
      );
    }
  }
}
