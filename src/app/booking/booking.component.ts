import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingRequestDTO, BookingService } from '../Service/booking.service';
import { SnackbarService } from '../Service/snackbar.service';
import { AuthService } from '../Service/auth.service';
import { catchError, forkJoin, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { LocationService } from '../Service/location.service';
import { ServiceService } from '../Service/service.service';
import { ServiceAvailabilityService } from '../Service/service-availability.service';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css'],
})
export class BookingComponent implements OnInit {
  bookingForm: FormGroup;
  isLoading = false;
  user: any = null;
  locations: any[] = [];
  services: any[] = []; // All services
  availableServices: any[] = []; // All active services
  availableDates: any[] = []; // Dates available for selected service
  availableTimeSlots: { value: string; display: string }[] = []; // Available time slots for selected date
  minDate = new Date();
  maxDate = new Date();
  selectedServiceId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private bookingService: BookingService,
    private snackbarService: SnackbarService,
    private authService: AuthService,
    private locationService: LocationService,
    private serviceService: ServiceService,
    private serviceAvailabilityService: ServiceAvailabilityService
  ) {
    this.bookingForm = this.fb.group({
      location: ['', Validators.required],
      serviceRequired: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
    });

    this.authService.currentUser.subscribe((user) => {
      this.user = user;
    });

    // Set minimum date to tomorrow
    this.minDate.setDate(this.minDate.getDate() + 1);

    // Set maximum date to 3 months from now
    this.maxDate.setMonth(this.maxDate.getMonth() + 3);

    // Watch for service selection changes
    this.bookingForm
      .get('serviceRequired')
      ?.valueChanges.subscribe((serviceName) => {
        // Reset date when service changes
        this.bookingForm.get('date')?.setValue(null);
        this.bookingForm.get('time')?.setValue(null);
        this.availableTimeSlots = [];

        if (serviceName) {
          // Find the service ID based on the selected name
          const selectedService = this.services.find(
            (s) => s.name === serviceName
          );
          if (selectedService) {
            this.selectedServiceId = selectedService.id;
            this.loadAvailableDatesForService(selectedService.id);
          }
        } else {
          this.selectedServiceId = null;
          this.availableDates = [];
        }
      });

    // Watch for date selection changes
    this.bookingForm.get('date')?.valueChanges.subscribe((date) => {
      // Reset time when date changes
      this.bookingForm.get('time')?.setValue(null);
      this.availableTimeSlots = [];

      if (date && this.selectedServiceId) {
        this.loadTimeSlots(this.selectedServiceId, this.formatDate(date));
      }
    });
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.snackbarService.showInfo(
        'Please register or login before booking',
        'Close'
      );
      this.router.navigate(['/login']);
      return;
    }

    this.loadInitialData();
  }

  loadInitialData() {
    this.isLoading = true;

    forkJoin({
      locations: this.locationService.getActiveLocations(),
      services: this.serviceService.getActiveServices(),
    }).subscribe({
      next: (results) => {
        this.locations = results.locations;
        this.services = results.services;
        this.availableServices = results.services;
        this.isLoading = false;
      },
      error: (error) => {
        this.snackbarService.showError('Failed to load booking data', 'Close');
        this.isLoading = false;
        console.error('Error loading booking data:', error);
      },
    });
  }

  loadAvailableDatesForService(serviceId: number) {
    this.isLoading = true;

    this.serviceAvailabilityService
      .getAvailableDatesForService(serviceId)
      .subscribe({
        next: (availabilities) => {
          // Filter for available dates only and get unique dates
          this.availableDates = availabilities
            .filter((availability) => availability.available === true)
            // Extract just the date part for the filter
            .map((availability) => {
              return {
                date: new Date(availability.date),
                // Store any other useful info from availability
                maxBookings: availability.maxBookings,
                currentBookings: availability.currentBookings,
                id: availability.id,
              };
            });

          this.isLoading = false;

          if (this.availableDates.length === 0) {
            this.snackbarService.showInfo(
              'No available dates for the selected service',
              'Close'
            );
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.availableDates = [];
          this.snackbarService.showError(
            'Failed to load available dates',
            'Close'
          );
          console.error('Error loading available dates:', error);
        },
      });
  }

  // Load time slots for the selected date and service
  loadTimeSlots(serviceId: number, dateString: string) {
    this.isLoading = true;
    this.availableTimeSlots = [];

    this.serviceAvailabilityService
      .getAvailableServicesForDate(dateString)
      .subscribe({
        next: (availabilities) => {
          // Find the availability for the selected service
          const serviceAvailability = availabilities.find(
            (availability) => availability.service.id === serviceId
          );

          if (serviceAvailability && serviceAvailability.timeSlots) {
            // Map time slots to dropdown format
            this.availableTimeSlots = serviceAvailability.timeSlots
              .filter(
                (slot) =>
                  slot.available && slot.currentBookings < slot.maxBookings
              )
              .map((slot) => ({
                value: this.formatTimeForAPI(slot.startTime),
                display: `${this.formatTimeForDisplay(
                  slot.startTime
                )} - ${this.formatTimeForDisplay(slot.endTime)}`,
              }));

            // Sort time slots by start time
            this.availableTimeSlots.sort((a, b) =>
              a.value.localeCompare(b.value)
            );
          }

          this.isLoading = false;

          if (this.availableTimeSlots.length === 0 && serviceAvailability) {
            this.snackbarService.showInfo(
              'No available time slots for the selected date',
              'Close'
            );
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.snackbarService.showError(
            'Failed to load available time slots',
            'Close'
          );
          console.error('Error loading time slots:', error);
        },
      });
  }

  // Date filter for the datepicker - only allow dates available for the selected service
  dateFilter = (date: Date | null): boolean => {
    if (!date || !this.selectedServiceId) {
      return false;
    }

    // Check if date has available services
    return this.availableDates.some(
      (availableDate) =>
        availableDate.date.toDateString() === date.toDateString()
    );
  };

  onSubmit() {
    if (this.bookingForm.valid) {
      this.isLoading = true;

      const formattedDate = this.formatDate(this.bookingForm.value.date);

      const bookingData: BookingRequestDTO = {
        location: this.bookingForm.value.location,
        time: this.bookingForm.value.time,
        date: formattedDate,
        serviceRequired: this.bookingForm.value.serviceRequired,
      };

      this.bookingService
        .createBooking(bookingData)
        .pipe(
          catchError((error: HttpErrorResponse) => {
            this.isLoading = false;

            if (error.status === 401 || error.status === 403) {
              this.snackbarService.showError(
                'You are not authorized to make this booking. Please log in again.',
                'Close'
              );
            } else {
              this.snackbarService.showError(
                'Booking failed. Please try again.',
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
          this.router.navigate(['/confirmation']);
        });
    } else {
      // Mark all fields as touched to trigger validation
      Object.keys(this.bookingForm.controls).forEach((field) => {
        const control = this.bookingForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });

      this.snackbarService.showError(
        'Please fill in all required fields',
        'Close'
      );
    }
  }

  // Helper method to format date for API
  private formatDate(date: Date): string {
    if (!date) return '';

    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
  }

  // Helper method to format time for display
  formatTimeForDisplay(timeString: string): string {
    if (!timeString) return '';

    try {
      // If it's already in HH:MM format
      if (
        typeof timeString === 'string' &&
        timeString.match(/^\d{2}:\d{2}(:\d{2})?$/)
      ) {
        const [hours, minutes] = timeString.split(':');
        return new Date(
          2000,
          0,
          1,
          parseInt(hours),
          parseInt(minutes)
        ).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }

      // Otherwise handle as date string with time component
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return timeString;
    }
  }

  // Helper method to format time for API
  formatTimeForAPI(timeString: string): string {
    if (!timeString) return '';

    try {
      // If it's already in HH:MM format
      if (
        typeof timeString === 'string' &&
        timeString.match(/^\d{2}:\d{2}(:\d{2})?$/)
      ) {
        return timeString.substr(0, 5); // Just return the HH:MM part
      }

      // Otherwise parse and format
      const date = new Date(`2000-01-01T${timeString}`);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (e) {
      return timeString;
    }
  }
}
