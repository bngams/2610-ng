import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { ApplicationsService } from '../api/applications.service';

type GuarantorForm = FormGroup<{
  name: FormControl<string>;
  income: FormControl<number>;
}>;

function futureDate(control: AbstractControl<string>): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  return new Date(control.value) > new Date() ? null : { futureDate: true };
}

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-application-form',
  styleUrl: './application-form.css',
  template: `
    @if (createdId(); as id) {
      <p class="confirmation">Application #{{ id }} received. We will get back to you soon.</p>
    } @else {
      <p class="progress">Step {{ step() }} of 3 · form status: {{ status() }}</p>
      <form [formGroup]="form" (submit)="submit()">
        @if (step() === 1) {
          <fieldset formGroupName="identity">
            <legend>Who are you?</legend>
            <label for="first-name">First Name</label>
            <input id="first-name" type="text" formControlName="firstName" />
            @if (showErrors(identity.firstName)) {
              <p class="error">First name is required.</p>
            }

            <label for="last-name">Last Name</label>
            <input id="last-name" type="text" formControlName="lastName" />
            @if (showErrors(identity.lastName)) {
              <p class="error">Last name is required.</p>
            }

            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" />
            @if (showErrors(identity.email)) {
              @if (identity.email.hasError('required')) {
                <p class="error">Email is required.</p>
              } @else {
                <p class="error">Enter a valid email address.</p>
              }
            }

            <label for="phone">Phone</label>
            <input id="phone" type="tel" formControlName="phone" />
            @if (showErrors(identity.phone)) {
              @if (identity.phone.hasError('required')) {
                <p class="error">Phone is required.</p>
              } @else {
                <p class="error">Enter 10 digits, without spaces.</p>
              }
            }
          </fieldset>
        }

        @if (step() === 2) {
          <fieldset formGroupName="situation">
            <legend>Your situation</legend>
            <label for="monthly-income">Monthly income</label>
            <input id="monthly-income" type="number" formControlName="monthlyIncome" />
            @if (showErrors(situation.monthlyIncome)) {
              <p class="error">Enter a monthly income greater than 0.</p>
            }

            <label for="move-in-date">Move-in date</label>
            <input id="move-in-date" type="date" formControlName="moveInDate" />
            @if (showErrors(situation.moveInDate)) {
              @if (situation.moveInDate.hasError('required')) {
                <p class="error">Move-in date is required.</p>
              } @else {
                <p class="error">The move-in date must be in the future.</p>
              }
            }

            <div formArrayName="guarantors">
              @for (guarantor of guarantors.controls; track guarantor; let i = $index) {
                <div class="guarantor" [formGroupName]="i">
                  <label [for]="'guarantor-name-' + i">Guarantor {{ i + 1 }}: name</label>
                  <input [id]="'guarantor-name-' + i" type="text" formControlName="name" />
                  @if (showErrors(guarantor.controls.name)) {
                    <p class="error">Name is required.</p>
                  }

                  <label [for]="'guarantor-income-' + i">Guarantor {{ i + 1 }}: monthly income</label>
                  <input [id]="'guarantor-income-' + i" type="number" formControlName="income" />
                  @if (showErrors(guarantor.controls.income)) {
                    <p class="error">Enter a monthly income greater than 0.</p>
                  }

                  <button type="button" class="secondary" (click)="removeGuarantor(i)">
                    Remove this guarantor
                  </button>
                </div>
              }
            </div>
            <button type="button" class="secondary" (click)="addGuarantor()">Add a guarantor</button>
          </fieldset>
        }

        @if (step() === 3) {
          @let dossier = form.getRawValue();
          <section class="summary">
            <h3>Check your application</h3>
            <p>
              {{ dossier.identity.firstName }} {{ dossier.identity.lastName }},
              {{ dossier.identity.email }}, {{ dossier.identity.phone }}
            </p>
            <p>
              Monthly income: {{ dossier.situation.monthlyIncome }}, move-in date:
              {{ dossier.situation.moveInDate }}
            </p>
            <p>Guarantors: {{ dossier.situation.guarantors.length }}</p>
            <ul>
              @for (guarantor of dossier.situation.guarantors; track $index) {
                <li>{{ guarantor.name }} ({{ guarantor.income }} per month)</li>
              }
            </ul>
          </section>
        }

        @if (sendError()) {
          <p class="error">Sending failed ({{ sendError() }}). Please try again.</p>
        }

        <div class="actions">
          @if (step() > 1) {
            <button type="button" class="secondary" (click)="prev()">Previous</button>
          }
          @if (step() < 3) {
            <button type="button" class="primary" (click)="next()">Next</button>
          } @else {
            <button type="submit" class="primary" [disabled]="status() !== 'VALID' || sending()">
              {{ sending() ? 'Sending…' : 'Send my application' }}
            </button>
          }
        </div>
      </form>
    }
  `,
})
export class ApplicationForm {
  readonly locationId = input.required<number>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly applicationsService = inject(ApplicationsService);

  readonly form = this.fb.group({
    identity: this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('[0-9]{10}')]],
    }),
    situation: this.fb.group({
      monthlyIncome: [0, [Validators.required, Validators.min(1)]],
      moveInDate: ['', [Validators.required, futureDate]],
      guarantors: this.fb.array<GuarantorForm>([]),
    }),
  });
  readonly identity = this.form.controls.identity.controls;
  readonly situation = this.form.controls.situation.controls;
  readonly guarantors = this.form.controls.situation.controls.guarantors;

  readonly step = signal(1);
  readonly status = toSignal(this.form.statusChanges, { initialValue: this.form.status });
  readonly sending = signal(false);
  readonly createdId = signal<number | undefined>(undefined);
  readonly sendError = signal('');

  showErrors(control: AbstractControl): boolean {
    return control.touched && control.invalid;
  }

  next() {
    const current = this.step() === 1 ? this.form.controls.identity : this.form.controls.situation;
    if (current.invalid) {
      current.markAllAsTouched();
      return;
    }
    this.step.update((step) => step + 1);
  }

  prev() {
    this.step.update((step) => step - 1);
  }

  addGuarantor() {
    this.guarantors.push(
      this.fb.group({
        name: ['', Validators.required],
        income: [0, [Validators.required, Validators.min(1)]],
      }),
    );
  }

  removeGuarantor(index: number) {
    this.guarantors.removeAt(index);
  }

  submit() {
    if (this.form.invalid || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.sendError.set('');
    this.applicationsService
      .create({ locationId: this.locationId(), ...this.form.getRawValue() })
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: (created) => this.createdId.set(created.id),
        error: (error: HttpErrorResponse) => this.sendError.set(`${error.status} ${error.statusText}`),
      });
  }
}
