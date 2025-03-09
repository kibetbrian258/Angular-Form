import { Component, OnInit } from '@angular/core';
import { BookingService } from '../Service/booking.service';
import { AuthService } from '../Service/auth.service';
import { SnackbarService } from '../Service/snackbar.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

interface Booking {
  id: number;
  location: string;
  date: string;
  time: string;
  serviceRequired: string;
}

@Component({
  selector: 'app-user-bookings',
  templateUrl: './user-bookings.component.html',
  styleUrls: ['./user-bookings.component.css'],
})
export class UserBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  isLoading = true;
  error = false;
  user: any = null;

  constructor(
    private bookingService: BookingService,
    private authService: AuthService,
    private snackbarService: SnackbarService,
    private router: Router
  ) {
    // Get current user
    this.authService.currentUser.subscribe((user) => {
      this.user = user;
    });

    // Redirect if not logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.error = false;

    this.bookingService
      .getUserBookings()
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.isLoading = false;
          this.error = true;
          this.snackbarService.showError(
            'Failed to load your bookings',
            'Close'
          );
          console.error('Error loading bookings:', error);
          return throwError(() => error);
        })
      )
      .subscribe((bookings) => {
        this.bookings = bookings;
        this.isLoading = false;
      });
  }

  createNewBooking(): void {
    this.router.navigate(['/booking']);
  }

  logout(): void {
    this.authService.logout();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
