import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BookingService } from '../Service/booking.service';
import { SnackbarService } from '../Service/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ServiceService } from '../Service/service.service';
import { LocationService } from '../Service/location.service';
import { ServiceAvailabilityService } from '../Service/service-availability.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-booking-details',
  templateUrl: './booking-details.component.html',
  styleUrls: ['./booking-details.component.css'],
})
export class BookingDetailsComponent implements OnInit {
  bookingId: number;
  booking: any;
  editForm: FormGroup;
  isLoading = false;
  isEditing = false;

  locations: any[] = [];
  services: any[] = [];
  availableTimeSlots: { value: string; display: string }[] = [];
  availableDates: any[] = [];

  minDate = new Date();
  maxDate = new Date();
  selectedServiceId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private bookingService: BookingService,
    private snackbarService: SnackbarService,
    private dialog: MatDialog,
    private serviceService: ServiceService,
    private locationService: LocationService,
    private serviceAvailabilityService: ServiceAvailabilityService
  ) {
    this.bookingId = +this.route.snapshot.params['id'];

    this.editForm = this.fb.group({
      location: ['', Validators.required],
      serviceRequired: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
    });

    // Set minimum date to tomorrow
    this.minDate.setDate(this.minDate.getDate() + 1);

    // Set maximum date to 3 months from now
    this.maxDate.setMonth(this.maxDate.getMonth() + 3);

    // Set up form value change listeners
    this.editForm
      .get('serviceRequired')
      ?.valueChanges.subscribe((serviceName) => {
        // Reset date when service changes
        this.editForm.get('date')?.setValue(null);
        this.editForm.get('time')?.setValue(null);
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
    this.editForm.get('date')?.valueChanges.subscribe((date) => {
      // Reset time when date changes
      this.editForm.get('time')?.setValue(null);
      this.availableTimeSlots = [];

      if (date && this.selectedServiceId) {
        this.loadTimeSlots(this.selectedServiceId, this.formatDate(date));
      }
    });
  }

  ngOnInit(): void {
    this.loadBookingDetails();
    this.loadInitialData();
  }

  loadBookingDetails(): void {
    this.isLoading = true;
    this.bookingService.getUserBookings().subscribe({
      next: (bookings) => {
        this.booking = bookings.find((b) => b.id === this.bookingId);

        if (this.booking) {
          // Convert string date to Date object for the form
          const bookingDate = new Date(this.booking.date);

          this.editForm.patchValue({
            location: this.booking.location,
            serviceRequired: this.booking.serviceRequired,
            date: bookingDate,
            time: this.booking.time,
          });
        } else {
          this.snackbarService.showError('Booking not found', 'Close');
          this.router.navigate(['/user-bookings']);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.snackbarService.showError(
          'Failed to load booking details',
          'Close'
        );
        this.isLoading = false;
        console.error('Error loading booking details:', error);
        this.router.navigate(['/user-bookings']);
      },
    });
  }

  loadInitialData(): void {
    this.isLoading = true;

    forkJoin({
      locations: this.locationService.getActiveLocations(),
      services: this.serviceService.getActiveServices(),
    }).subscribe({
      next: (results) => {
        this.locations = results.locations;
        this.services = results.services;

        // If we have the booking data, load dates and times
        if (this.booking && this.booking.serviceRequired) {
          const service = this.services.find(
            (s) => s.name === this.booking.serviceRequired
          );
          if (service) {
            this.selectedServiceId = service.id;
            this.loadAvailableDatesForService(service.id);
          }
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.snackbarService.showError('Failed to load booking data', 'Close');
        this.isLoading = false;
        console.error('Error loading booking data:', error);
      },
    });
  }

  loadAvailableDatesForService(serviceId: number): void {
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

          // If we have the booking date, load time slots
          if (this.booking && this.booking.date) {
            this.loadTimeSlots(serviceId, this.booking.date);
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

  loadTimeSlots(serviceId: number, dateString: string): void {
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
            // For editing, we need to include the current time slot even if it's full
            const currentTimeStr = this.booking.time;

            // Map time slots to dropdown format
            this.availableTimeSlots = serviceAvailability.timeSlots
              .filter((slot) => {
                // Include slots that are available or match the current booking time
                return (
                  (slot.available && slot.currentBookings < slot.maxBookings) ||
                  this.formatTimeForAPI(slot.startTime) === currentTimeStr
                );
              })
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

  toggleEdit(): void {
    this.isEditing = !this.isEditing;

    if (!this.isEditing) {
      // Reset form to original values when canceling edit
      const bookingDate = new Date(this.booking.date);

      this.editForm.patchValue({
        location: this.booking.location,
        serviceRequired: this.booking.serviceRequired,
        date: bookingDate,
        time: this.booking.time,
      });
    }
  }

  saveChanges(): void {
    if (this.editForm.valid) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '350px',
        data: {
          title: 'Confirm Update',
          message:
            'Are you sure you want to update this booking? This may affect your scheduled appointment time.',
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.isLoading = true;

          // Get form values
          const formattedDate = this.formatDate(this.editForm.value.date);

          // Create updated booking request
          const updatedBooking = {
            location: this.editForm.value.location,
            time: this.editForm.value.time,
            date: formattedDate,
            serviceRequired: this.editForm.value.serviceRequired,
          };

          // First cancel the existing booking
          this.bookingService.cancelBooking(this.bookingId).subscribe({
            next: () => {
              // Then create a new booking with the updated details
              this.bookingService.createBooking(updatedBooking).subscribe({
                next: (newBooking) => {
                  this.isLoading = false;
                  this.isEditing = false;
                  this.snackbarService.showSuccess(
                    'Booking updated successfully',
                    'Close'
                  );

                  // Navigate to the new booking details
                  this.router.navigate(['/booking-details', newBooking.id]);
                },
                error: (error) => {
                  this.isLoading = false;
                  this.snackbarService.showError(
                    'Failed to create updated booking',
                    'Close'
                  );
                  console.error('Error creating updated booking:', error);

                  // Reload original booking details
                  this.loadBookingDetails();
                },
              });
            },
            error: (error) => {
              this.isLoading = false;
              this.snackbarService.showError(
                'Failed to update booking',
                'Close'
              );
              console.error('Error canceling original booking:', error);
            },
          });
        }
      });
    } else {
      // Mark all fields as touched to trigger validation
      Object.keys(this.editForm.controls).forEach((field) => {
        const control = this.editForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });

      this.snackbarService.showError(
        'Please fill in all required fields',
        'Close'
      );
    }
  }

  cancelBooking(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirm Cancellation',
        message:
          'Are you sure you want to cancel this booking? This action cannot be undone.',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;

        this.bookingService.cancelBooking(this.bookingId).subscribe({
          next: () => {
            this.isLoading = false;
            this.snackbarService.showSuccess(
              'Booking cancelled successfully',
              'Close'
            );
            this.router.navigate(['/user-bookings']);
          },
          error: (error) => {
            this.isLoading = false;
            this.snackbarService.showError('Failed to cancel booking', 'Close');
            console.error('Error cancelling booking:', error);
          },
        });
      }
    });
  }

  // Date filter for the datepicker - only allow dates available for the selected service
  dateFilter = (date: Date | null): boolean => {
    if (!date || !this.selectedServiceId) {
      return false;
    }

    // Include the current booking date to ensure it can be selected
    if (this.booking && this.booking.date) {
      const bookingDate = new Date(this.booking.date);
      if (date.toDateString() === bookingDate.toDateString()) {
        return true;
      }
    }

    // Check if date has available services
    return this.availableDates.some(
      (availableDate) =>
        availableDate.date.toDateString() === date.toDateString()
    );
  };

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
