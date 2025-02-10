import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
}

interface BookingDetails {
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

  constructor(private router: Router) {
    if (sessionStorage.getItem('sessionActive') === null) {
      const hasExistingBooking = localStorage.getItem('userDetails') !== null;
      if (!hasExistingBooking) {
        this.router.navigate(['create-acount']);
      }
    }

    sessionStorage.setItem('sessionActive', 'true');
  }

  ngOnInit() {
    this.userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
    this.bookingDetails = JSON.parse(
      localStorage.getItem('bookingDetails') || '{}'
    );
  }

  downloadAndClear() {
    // Create new PDF document
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text('Booking Confirmation', 20, 20);

    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);

    // Add Account Details section
    doc.setFontSize(16);
    doc.text('Account Details', 20, 45);
    doc.setFontSize(12);
    doc.text(
      `Name: ${this.userDetails.firstName} ${this.userDetails.lastName}`,
      20,
      55
    );
    doc.text(`Email: ${this.userDetails.email}`, 20, 65);

    // Add Booking Details section
    doc.setFontSize(16);
    doc.text('Booking Details', 20, 85);
    doc.setFontSize(12);
    doc.text(`Location: ${this.bookingDetails.location}`, 20, 95);
    doc.text(
      `Date: ${new Date(this.bookingDetails.date).toLocaleDateString()}`,
      20,
      105
    );
    doc.text(`Time: ${this.bookingDetails.time}`, 20, 115);
    doc.text(`Service: ${this.bookingDetails.serviceRequired}`, 20, 125);

    // Add footer
    doc.setFontSize(10);
    doc.text('Thank you for your booking!', 20, 150);

    // Save the PDF
    doc.save(`booking-confirmation-${new Date().getTime()}.pdf`);

    // Clear all stored data
    localStorage.removeItem('userDetails');
    localStorage.removeItem('bookingDetails');
    sessionStorage.removeItem('sessionActive');

    // Redirect to create account page
    setTimeout(() => {
      this.router.navigate(['/create-account']);
    }, 1000);
  }
}
