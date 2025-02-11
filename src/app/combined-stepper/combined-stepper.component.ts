import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';

@Component({
  selector: 'app-combined-stepper',
  templateUrl: './combined-stepper.component.html',
  styleUrls: ['./combined-stepper.component.css'],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true },
    },
  ],
})
export class CombinedStepperComponent {
  accountForm: FormGroup;
  bookingForm: FormGroup;
  isEditable = true;

  constructor(private fb: FormBuilder, private router: Router) {
    this.accountForm = this.fb.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );

    this.bookingForm = this.fb.group({
      location: ['', Validators.required],
      time: ['', Validators.required],
      date: ['', Validators.required],
      serviceRequired: ['', Validators.required],
    });
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password');
    const confirmPassword = g.get('confirmPassword');
    if (!password || !confirmPassword) return null;
    return password.value === confirmPassword.value ? null : { mismatch: true };
  }

  onAccountSubmit() {
    if (this.accountForm.valid) {
      localStorage.setItem(
        'userDetails',
        JSON.stringify(this.accountForm.value)
      );
    }
  }

  onBookingSubmit() {
    if (this.bookingForm.valid) {
      localStorage.setItem(
        'bookingDetails',
        JSON.stringify(this.bookingForm.value)
      );
      this.router.navigate(['confirmation']);
    }
  }
}
