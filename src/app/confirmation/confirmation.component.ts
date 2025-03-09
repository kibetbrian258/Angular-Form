import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../Service/user.service';
import { BookingService } from '../Service/booking.service';
import { catchError, forkJoin, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SnackbarService } from '../Service/snackbar.service';
import { AuthService } from '../Service/auth.service';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface UserDetails {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface BookingDetails {
  id?: number;
  location: string;
  date: string;
  time: string;
  serviceRequired: string;
}

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.css'],
})
export class ConfirmationComponent implements OnInit {
  userDetails: UserDetails = {} as UserDetails;
  bookingDetails: BookingDetails = {} as BookingDetails;
  isLoading = true;
  error = false;

  // Define colors
  private readonly primaryColor = '#673ab7';
  private readonly secondaryColor = '#444444';

  constructor(
    public router: Router,
    private userService: UserService,
    private bookingService: BookingService,
    private authService: AuthService,
    private snackbarService: SnackbarService
  ) {
    // Check if the user is logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // No need to get userId from localStorage as we're using JWT
    this.isLoading = true;
    this.error = false;

    // Get user and booking details using JWT authentication
    forkJoin({
      user: this.userService.getCurrentUser(),
      bookings: this.bookingService.getUserBookings(),
    })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.isLoading = false;
          this.error = true;
          this.snackbarService.showError(
            'Failed to load booking details. Please try again.',
            'OK'
          );
          console.error('Error loading confirmation data:', error);
          return throwError(() => error);
        })
      )
      .subscribe(({ user, bookings }) => {
        this.isLoading = false;

        // Set user details
        this.userDetails = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        };

        // Set booking details (assuming the latest booking is what we want to show)
        if (bookings && bookings.length > 0) {
          const latestBooking = bookings[bookings.length - 1];
          this.bookingDetails = {
            id: latestBooking.id,
            location: latestBooking.location,
            date: latestBooking.date,
            time: latestBooking.time,
            serviceRequired: latestBooking.serviceRequired,
          };
        } else {
          this.snackbarService.showError(
            'No booking found. Please try again.',
            'OK'
          );
          this.error = true;
        }
      });
  }

  private addHeader(doc: jsPDF) {
    // Add logo or company name
    doc.setFillColor(this.primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Booking Confirmation', 105, 25, { align: 'center' });

    // Reset text color
    doc.setTextColor(this.secondaryColor);
  }

  private addFooter(doc: jsPDF) {
    const pageHeight = doc.internal.pageSize.height;

    // Add footer line
    doc.setDrawColor(this.primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 30, 190, pageHeight - 30);

    // Add footer text
    doc.setFontSize(10);
    doc.setTextColor(this.secondaryColor);
    doc.text('Thank you for your booking!', 105, pageHeight - 20, {
      align: 'center',
    });

    // Add page number
    doc.text(`Page 1 of 1`, 105, pageHeight - 10, { align: 'center' });
  }

  private addSection(doc: jsPDF, title: string, yPosition: number): number {
    // Add section title with background
    doc.setFillColor(this.primaryColor);
    doc.rect(20, yPosition - 6, 170, 10, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 25, yPosition);

    // Reset text color
    doc.setTextColor(this.secondaryColor);
    doc.setFont('helvetica', 'normal');

    return yPosition + 15; // Return next Y position
  }

  downloadAndClear() {
    // Create new PDF document with specified font
    const doc = new jsPDF();
    doc.setFont('helvetica');

    // Add styled header
    this.addHeader(doc);

    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 50);

    // Add Account Details section
    let yPos = this.addSection(doc, 'Account Details', 65);
    doc.setFontSize(12);
    doc.text(
      `Name: ${this.userDetails.firstName} ${this.userDetails.lastName}`,
      25,
      yPos
    );
    doc.text(`Email: ${this.userDetails.email}`, 25, yPos + 10);

    // Add Booking Details section
    yPos = this.addSection(doc, 'Booking Details', 100);
    doc.setFontSize(12);
    doc.text(`Location: ${this.bookingDetails.location}`, 25, yPos);
    doc.text(
      `Date: ${new Date(this.bookingDetails.date).toLocaleDateString()}`,
      25,
      yPos + 10
    );
    doc.text(`Time: ${this.bookingDetails.time}`, 25, yPos + 20);
    doc.text(`Service: ${this.bookingDetails.serviceRequired}`, 25, yPos + 30);

    // Add styled footer
    this.addFooter(doc);

    // Save the PDF
    doc.save(`booking-confirmation-${new Date().getTime()}.pdf`);

    // Redirect to login page after a short delay
    setTimeout(() => {
      this.router.navigate(['/user-bookings']);
    }, 1000);
  }
}
