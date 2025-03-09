import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../Service/auth.service';
import { SnackbarService } from '../Service/snackbar.service';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent {
  registrationForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private snackbarService: SnackbarService
  ) {
    this.registrationForm = this.fb.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password');
    const confirmPassword = g.get('confirmPassword');

    if (!password || !confirmPassword) return null;
    return password.value === confirmPassword.value ? null : { mismatch: true };
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility() {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  onSubmit() {
    if (this.registrationForm.valid) {
      this.isLoading = true;

      const { firstName, lastName, email, password } =
        this.registrationForm.value;

      this.authService
        .register(firstName, lastName, email, password)
        .pipe(
          catchError((error: HttpErrorResponse) => {
            this.isLoading = false;

            if (
              error.status === 409 ||
              (error.status === 400 &&
                JSON.stringify(error.error).includes(
                  'Email address already in use'
                ))
            ) {
              this.snackbarService.showError(
                'Email address is already in use. Please use a different email or log in.',
                'Close'
              );
            } else {
              this.snackbarService.showError(
                'Registration failed. Please try again.',
                'Close'
              );
            }

            console.error('Registration error:', error);
            return throwError(() => error);
          })
        )
        .subscribe((user) => {
          this.isLoading = false;
          this.snackbarService.showSuccess(
            'Account created successfully!',
            'Close'
          );

          const redirectUrl = localStorage.getItem('redirectUrl') || '/booking';

          localStorage.removeItem('redirectUrl');

          // Navigate to booking page
          setTimeout(() => {
            this.router.navigate([redirectUrl]);
          }, 800);
        });
    }
  }
}
