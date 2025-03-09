import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../Service/admin-auth.service';
import { SnackbarService } from '../Service/snackbar.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css'],
})
export class AdminLoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private adminAuthService: AdminAuthService,
    private router: Router,
    private snackbarService: SnackbarService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Redirect to admin dashboard if already logged in as admin
    if (this.adminAuthService.isLoggedIn() && this.adminAuthService.isAdmin()) {
      this.router.navigate(['/admin']);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password } = this.loginForm.value;

      this.adminAuthService.login(email, password).subscribe({
        next: (user) => {
          this.isLoading = false;

          // Check if the user is an admin
          if (user.role === 'ADMIN') {
            this.snackbarService.showSuccess(
              'Admin login successful!',
              'Close'
            );
            this.router.navigate(['/admin']);
          } else {
            // Not an admin, show error
            this.snackbarService.showError(
              'Access denied. Admin privileges required.',
              'Close'
            );
            this.adminAuthService.logout(); // Log them out
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;

          if (error.status === 401) {
            this.snackbarService.showError(
              'Invalid email or password',
              'Close'
            );
          } else if (
            error.status === 403 ||
            error.message?.includes('Admin access required')
          ) {
            this.snackbarService.showError(
              'Access denied. Admin privileges required.',
              'Close'
            );
          } else {
            this.snackbarService.showError(
              'Login failed. Please try again later',
              'Close'
            );
          }

          console.error('Admin login error:', error);
        },
      });
    }
  }
}
