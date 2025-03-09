import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
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

  // Password validation flags
  hasMinLength = false;
  hasUppercase = false;
  hasSpecialChar = false;
  hasNumber = false;
  notContainsName = true;

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
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            this.strongPasswordValidator(),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: [
          this.passwordMatchValidator,
          this.passwordNotContainsNameValidator,
        ],
      }
    );

    // Listen to password changes to update validation flags
    this.registrationForm
      .get('password')
      ?.valueChanges.subscribe((password) => {
        this.updatePasswordValidationFlags(password);
      });

    // Listen to name changes to update name validation for password
    this.registrationForm.get('firstName')?.valueChanges.subscribe(() => {
      this.checkPasswordContainsName();
    });

    this.registrationForm.get('lastName')?.valueChanges.subscribe(() => {
      this.checkPasswordContainsName();
    });
  }

  strongPasswordValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const hasUpperCase = /[A-Z]/.test(value);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
        value
      );
      const hasMinLength = value.length >= 6;
      const hasNumber = /\d/.test(value);

      const passwordValid =
        hasUpperCase && hasSpecialChar && hasMinLength && hasNumber;

      return !passwordValid ? { strongPassword: true } : null;
    };
  }

  passwordMatchValidator(group: FormGroup): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (!password || !confirmPassword) return null;
    return password === confirmPassword ? null : { mismatch: true };
  }

  passwordNotContainsNameValidator(group: FormGroup): ValidationErrors | null {
    const password = group.get('password')?.value?.toLowerCase();
    const firstName = group.get('firstName')?.value?.toLowerCase();
    const lastName = group.get('lastName')?.value?.toLowerCase();

    if (!password || !firstName || !lastName) return null;

    if (firstName && password.includes(firstName) && firstName.length > 2) {
      return { containsName: true };
    }

    if (lastName && password.includes(lastName) && lastName.length > 2) {
      return { containsName: true };
    }

    return null;
  }

  updatePasswordValidationFlags(password: string): void {
    if (!password) {
      this.hasMinLength = false;
      this.hasUppercase = false;
      this.hasSpecialChar = false;
      this.hasNumber = false;
      return;
    }

    this.hasMinLength = password.length >= 6;
    this.hasUppercase = /[A-Z]/.test(password);
    this.hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password
    );
    this.hasNumber = /\d/.test(password);

    // Also check if password contains name
    this.checkPasswordContainsName();
  }

  checkPasswordContainsName(): void {
    const password = this.registrationForm
      .get('password')
      ?.value?.toLowerCase();
    const firstName = this.registrationForm
      .get('firstName')
      ?.value?.toLowerCase();
    const lastName = this.registrationForm
      .get('lastName')
      ?.value?.toLowerCase();

    if (!password || (!firstName && !lastName)) {
      this.notContainsName = true;
      return;
    }

    this.notContainsName = true;

    if (firstName && password?.includes(firstName) && firstName.length > 2) {
      this.notContainsName = false;
    }

    if (lastName && password?.includes(lastName) && lastName.length > 2) {
      this.notContainsName = false;
    }
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
