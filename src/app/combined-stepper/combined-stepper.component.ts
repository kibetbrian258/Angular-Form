import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { UserRegistrationDTO, UserService } from '../Service/user.service';
import { BookingRequestDTO, BookingService } from '../Service/booking.service';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { MatStepper } from '@angular/material/stepper';
import { SnackbarService } from '../Service/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

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
  @ViewChild('stepper') stepper!: MatStepper;

  accountForm: FormGroup;
  bookingForm: FormGroup;
  isEditable = true;
  isLoading = false;
  registrationComplete = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private bookingService: BookingService,
    private snackbarService: SnackbarService,
    private dialog: MatDialog
  ) {
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
      this.isLoading = true;

      // Create user registration data
      const userData: UserRegistrationDTO = {
        firstName: this.accountForm.value.firstName,
        lastName: this.accountForm.value.lastName,
        email: this.accountForm.value.email,
        password: this.accountForm.value.password,
      };

      // Register user via the service
      this.userService
        .registerUser(userData)
        .pipe(
          catchError((error: HttpErrorResponse) => {
            this.isLoading = false;

            // Check for specific HTTP status codes
            if (error.status === 409) {
              // 409 Conflict - Email already exists (if your backend uses this status)
              this.snackbarService.showError(
                'This email is already registered. Please use a different email or try logging in.',
                'Close'
              );
            } else if (error.status === 400) {
              // Check error response for specific error message patterns
              if (
                error.error &&
                (error.error.message?.includes(
                  'Email address already in use'
                ) ||
                  error.error.error?.includes('Email address already in use') ||
                  JSON.stringify(error.error).includes(
                    'Email address already in use'
                  ))
              ) {
                // Email already in use error
                this.snackbarService.showError(
                  'Email address is already in use. Please use a different email.',
                  'Close'
                );
              } else {
                // Generic validation error
                this.snackbarService.showError(
                  'Please check your information and try again.',
                  'Close'
                );
              }
            } else {
              // Generic server error
              this.snackbarService.showError(
                'Registration failed. Please try again later.',
                'Close'
              );
            }

            // For debugging
            console.error('Registration error:', error);

            return throwError(() => error);
          })
        )
        .subscribe((user) => {
          this.isLoading = false;
          this.registrationComplete = true;
          this.snackbarService.showSuccess(
            'Account created successfully!',
            'Close'
          );

          // Automatically move to the next step after successful registration
          setTimeout(() => {
            this.stepper.next();
          }, 800);
        });
    }
  }

  onBookingSubmit() {
    if (this.bookingForm.valid) {
      this.isLoading = true;

      const formattedDate = this.formatDate(this.bookingForm.value.date);

      // Create booking data
      const bookingData: BookingRequestDTO = {
        location: this.bookingForm.value.location,
        time: this.bookingForm.value.time,
        date: formattedDate,
        serviceRequired: this.bookingForm.value.serviceRequired,
      };

      // Create booking via the service
      this.bookingService
        .createBooking(bookingData)
        .pipe(
          catchError((error: HttpErrorResponse) => {
            this.isLoading = false;

            // More detailed error handling
            if (error.status === 400) {
              this.snackbarService.showError(
                'Please check your booking information and try again.',
                'Close'
              );
            } else if (error.status === 401 || error.status === 403) {
              this.snackbarService.showError(
                'You are not authorized to make this booking. Please log in again.',
                'Close'
              );
            } else {
              this.snackbarService.showError(
                'Booking failed. Please try again later.',
                'Close'
              );
            }

            console.error('Booking error:', error);
            return throwError(() => error);
          })
        )
        .subscribe((booking) => {
          this.isLoading = false;
          this.snackbarService.showSuccess(
            'Booking created successfully!',
            'Close'
          );
          this.router.navigate(['confirmation']);
        });
    }
  }

  // New method for handling back button click with confirmation
  onBackButtonClick(event: Event): void {
    event.preventDefault();

    // Open a confirmation dialog
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Warning',
        message:
          'If you go back, you will lose your registration data. Are you sure?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // User confirmed, delete the user data
        const userId = localStorage.getItem('userId');
        if (userId) {
          this.isLoading = true;
          this.userService
            .deleteUser(Number(userId))
            .pipe(
              catchError((error: HttpErrorResponse) => {
                this.isLoading = false;
                this.snackbarService.showError(
                  'Failed to remove your data. Please contact support.',
                  'Close'
                );
                console.error('Error deleting user:', error);
                return throwError(() => error);
              })
            )
            .subscribe(() => {
              // Clear local storage
              localStorage.removeItem('userId');

              // Reset forms
              this.accountForm.reset();
              this.registrationComplete = false;

              // Move back to first step
              this.stepper.previous();

              this.isLoading = false;
              this.snackbarService.showInfo(
                'Your registration data has been removed.',
                'OK'
              );
            });
        } else {
          // No user ID found, just go back
          this.stepper.previous();
        }
      }
      // If result is false, do nothing (stay on current step)
    });
  }

  // Helper method to format date for backend (YYYY-MM-DD)
  private formatDate(date: Date): string {
    if (!date) return '';

    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
  }
}
