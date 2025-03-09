import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../Service/auth.service';
import { Router } from '@angular/router';
import { SnackbarService } from '../Service/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword: boolean = false;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackbarService: SnackbarService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/user-bookings']);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (user) => {
          this.isLoading = false;
          this.snackbarService.showSuccess(
            'Login successful! Redirecting to your bookings...',
            'Close'
          );

          const redirectUrl =
            localStorage.getItem('redirectUrl') || '/user-bookings';

          localStorage.removeItem('redirectUrl');

          setTimeout(() => {
            this.router.navigate([redirectUrl]);
          }, 800);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;

          if (error.status === 401) {
            this.snackbarService.showError(
              'Invalid email or password',
              'Close'
            );
          } else if (error.status === 404) {
            this.snackbarService.showError(
              'User not found. Please check your email address',
              'Close'
            );
          } else {
            this.snackbarService.showError(
              'Login failed. Please try again later',
              'Close'
            );
          }

          console.error('Login error:', error);
        },
      });
    }
  }
}