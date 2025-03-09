import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ServiceAvailabilityService } from '../Service/service-availability.service';
import { ServiceService } from '../Service/service.service';
import { SnackbarService } from '../Service/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { forkJoin, catchError, of, Observable } from 'rxjs';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { TimeSlotService } from '../Service/time-slot.service';
import { HttpErrorResponse } from '@angular/common/http';

// Define interfaces for type safety
interface TimeSlot {
  id: number;
  startTime: string;
  endTime: string;
  maxBookings: number;
  currentBookings?: number;
  available: boolean;
}

interface Service {
  id: number;
  name: string;
  // Add other service properties as needed
}

interface ServiceAvailability {
  id: number;
  service: Service;
  date: string;
  available: boolean;
  timeSlots: TimeSlot[];
  currentBookings?: number;
}

interface TimeSlotFormValue {
  startTime: string;
  endTime: string;
  maxBookings: number;
  available: boolean;
}

@Component({
  selector: 'app-service-availability-management',
  templateUrl: './service-availability-management.component.html',
  styleUrls: ['./service-availability-management.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class ServiceAvailabilityManagementComponent implements OnInit {
  @ViewChild('timeSlotDialog') timeSlotDialog!: TemplateRef<any>;

  serviceAvailabilities: ServiceAvailability[] = [];
  services: Service[] = [];
  availabilityForm: FormGroup;
  timeSlotForm: FormGroup;
  isEditing = false;
  currentAvailabilityId: number | null = null;
  currentServiceAvailability: ServiceAvailability | null = null;
  isLoading = false;
  isCapacityWarningDismissed: boolean = false;

  displayedColumns: string[] = [
    'service',
    'date',
    'status',
    'bookings',
    'timeSlots',
    'actions',
  ];

  // Time slot columns for the standard detail view
  timeSlotColumns: string[] = [
    'startTime',
    'endTime',
    'status',
    'bookings',
    'actions',
  ];

  // Enhanced columns for the expanded time slot view
  expandedTimeSlotColumns: string[] = [
    'startTime',
    'endTime',
    'duration',
    'status',
    'bookings',
    'actions',
  ];

  minDate = new Date();
  serviceAtCapacity: number[] = [];
  expandedElement: ServiceAvailability | null = null;
  editingTimeSlot: boolean = false;
  currentTimeSlotId: number | null = null;

  constructor(
    private serviceAvailabilityService: ServiceAvailabilityService,
    private timeSlotService: TimeSlotService,
    private serviceService: ServiceService,
    private fb: FormBuilder,
    private snackbarService: SnackbarService,
    private dialog: MatDialog
  ) {
    this.availabilityForm = this.fb.group({
      serviceId: ['', Validators.required],
      date: ['', Validators.required],
      available: [true],
      timeSlots: this.fb.array([]),
    });

    this.timeSlotForm = this.fb.group(
      {
        startTime: ['', Validators.required],
        endTime: ['', Validators.required],
        maxBookings: [2, [Validators.required, Validators.min(1)]],
        available: [true],
      },
      { validators: [this.timeRangeValidator, this.timeOverlapValidator] }
    );

    // Set min date to tomorrow
    this.minDate.setDate(this.minDate.getDate() + 1);
  }

  ngOnInit(): void {
    this.loadData();
  }

  // Time slot form array getter
  get timeSlots(): FormArray {
    return this.availabilityForm.get('timeSlots') as FormArray;
  }

  // Validator to ensure end time is after start time
  timeRangeValidator(control: AbstractControl): ValidationErrors | null {
    const startTime = control.get('startTime')?.value;
    const endTime = control.get('endTime')?.value;

    if (startTime && endTime) {
      if (endTime <= startTime) {
        return { timeRangeInvalid: true };
      }
    }
    return null;
  }

  // Validator to check for overlapping time slots
  timeOverlapValidator(control: AbstractControl): ValidationErrors | null {
    const formArray = control.parent?.get('timeSlots') as FormArray;
    if (!formArray) return null;

    const currentIndex = formArray.controls.indexOf(control);
    if (currentIndex === -1) return null;

    const startTime = control.get('startTime')?.value;
    const endTime = control.get('endTime')?.value;

    if (!startTime || !endTime) return null;

    for (let i = 0; i < formArray.controls.length; i++) {
      if (i !== currentIndex) {
        const otherControl = formArray.controls[i];
        const otherStartTime = otherControl.get('startTime')?.value;
        const otherEndTime = otherControl.get('endTime')?.value;

        if (startTime < otherEndTime && endTime > otherStartTime) {
          return { timeOverlap: true };
        }
      }
    }

    return null;
  }

  // Method to check if the row is an expansion detail row
  isExpansionDetailRow = (index: number, row: any): boolean =>
    row.hasOwnProperty('detailRow');

  // Method to toggle time slot details expansion
  toggleTimeSlotDetails(element: ServiceAvailability): void {
    this.expandedElement = this.expandedElement === element ? null : element;
  }

  // Check if a time slot is expanded
  isTimeSlotExpanded(element: ServiceAvailability): boolean {
    return this.expandedElement === element;
  }

  // Method to calculate total capacity across all time slots
  getTotalCapacity(availability: ServiceAvailability): number {
    if (!availability.timeSlots || availability.timeSlots.length === 0) {
      return 0;
    }

    return availability.timeSlots.reduce((total: number, slot: TimeSlot) => {
      return total + (slot.maxBookings || 0);
    }, 0);
  }

  // Method to calculate the duration between start and end time
  calculateDuration(startTime: string, endTime: string): string {
    if (!startTime || !endTime) {
      return 'N/A';
    }

    try {
      // Convert times to minutes since midnight
      const startMinutes = this.timeToMinutes(startTime);
      const endMinutes = this.timeToMinutes(endTime);

      // Calculate difference in minutes
      let diffMinutes = endMinutes - startMinutes;

      // Handle case where end time is on the next day
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60; // Add a full day of minutes
      }

      // Format the duration
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      if (hours === 0) {
        return `${minutes} min`;
      } else if (minutes === 0) {
        return `${hours} hr`;
      } else {
        return `${hours} hr ${minutes} min`;
      }
    } catch (e) {
      console.error('Error calculating duration:', e);
      return 'N/A';
    }
  }

  dismissCapacityWarning(): void {
    this.isCapacityWarningDismissed = true;
    // Optional: Display a small confirmation toast
    this.snackbarService.showInfo(
      'Capacity warning dismissed. Refresh page to view again.',
      'Close'
    );
  }

  // Helper method to convert time string to minutes since midnight
  private timeToMinutes(timeString: string): number {
    // Handle HH:MM or HH:MM:SS format
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    return hours * 60 + minutes;
  }

  loadData(): void {
    this.isLoading = true;

    forkJoin({
      availabilities: this.serviceAvailabilityService
        .getAllServiceAvailabilities()
        .pipe(
          catchError((error: HttpErrorResponse) => {
            console.error('Error fetching availabilities:', error);
            this.snackbarService.showError(
              `Failed to load availabilities: ${
                error.statusText || 'Unknown error'
              }`,
              'Close'
            );
            return of([]);
          })
        ),
      services: this.serviceService.getActiveServices().pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching services:', error);
          this.snackbarService.showError(
            `Failed to load services: ${error.statusText || 'Unknown error'}`,
            'Close'
          );
          return of([]);
        })
      ),
    }).subscribe({
      next: (result) => {
        // Process the availabilities to ensure timeSlots is always an array
        this.serviceAvailabilities = result.availabilities.map(
          (availability) => {
            return {
              ...availability,
              timeSlots: Array.isArray(availability.timeSlots)
                ? availability.timeSlots
                : [],
            } as ServiceAvailability;
          }
        );

        console.log('Loaded availabilities:', this.serviceAvailabilities);
        this.services = result.services;

        // Calculate the total bookings across all time slots
        this.calculateServiceCapacity();

        this.isLoading = false;
      },
      error: (error) => {
        this.snackbarService.showError('Failed to load data', 'Close');
        this.isLoading = false;
        console.error('Error loading data:', error);

        // Initialize empty arrays to prevent UI errors
        this.serviceAvailabilities = [];
        this.serviceAtCapacity = [];
      },
    });
  }

  // Calculate service capacity based on time slots
  calculateServiceCapacity(): void {
    // Reset dismissal status when recalculating
    this.isCapacityWarningDismissed = false;
    this.serviceAtCapacity = [];

    this.serviceAvailabilities.forEach((availability: ServiceAvailability) => {
      // Check if any time slots are at capacity
      const timeSlotAtCapacity = availability.timeSlots?.some(
        (slot: TimeSlot) =>
          slot.currentBookings !== undefined &&
          slot.maxBookings !== undefined &&
          slot.currentBookings >= slot.maxBookings &&
          slot.available
      );

      if (timeSlotAtCapacity && availability.available) {
        this.serviceAtCapacity.push(availability.id);
      }
    });

    // Show warnings for services at capacity
    if (this.serviceAtCapacity.length > 0) {
      const atCapacityServices = this.serviceAvailabilities
        .filter((avail: ServiceAvailability) =>
          this.serviceAtCapacity.includes(avail.id)
        )
        .map(
          (avail: ServiceAvailability) =>
            `${
              avail.service?.name || 'Unknown Service'
            } on ${this.formatDateDisplay(avail.date)}`
        );

      this.snackbarService.showInfo(
        `Time slots have reached maximum capacity for: ${atCapacityServices.join(
          ', '
        )}. Consider adding more time slots or increasing capacity.`,
        'Close'
      );
    }
  }

  // Submit time slot form
  submitTimeSlot(): void {
    if (this.timeSlotForm.valid) {
      this.isLoading = true;

      // Prepare the form value
      const formValue: TimeSlotFormValue = {
        startTime: this.formatTimeToLocalTime(
          this.timeSlotForm.value.startTime
        ),
        endTime: this.formatTimeToLocalTime(this.timeSlotForm.value.endTime),
        maxBookings: this.timeSlotForm.value.maxBookings,
        available: this.timeSlotForm.value.available === true,
      };

      // Log the form value for debugging
      console.log('Time slot form value:', formValue);

      if (this.editingTimeSlot && this.currentTimeSlotId) {
        // Update existing time slot
        this.timeSlotService
          .updateTimeSlot(this.currentTimeSlotId, formValue)
          .subscribe({
            next: (response) => {
              console.log('Time slot updated successfully:', response);
              this.dialog.closeAll();
              this.snackbarService.showSuccess(
                'Time slot updated successfully',
                'Close'
              );
              this.isLoading = false;
              this.loadData();
            },
            error: (error) => {
              this.isLoading = false;
              console.error('Error updating time slot:', error);
              // More specific error message
              this.snackbarService.showError(
                error.error?.message ||
                  'Failed to update time slot: ' +
                    (error.status
                      ? `Server returned ${error.status}`
                      : 'Unknown error'),
                'Close'
              );
            },
          });
      } else if (this.currentServiceAvailability) {
        // Add new time slot to existing service availability
        this.timeSlotService
          .addTimeSlot(this.currentServiceAvailability.id, formValue)
          .subscribe({
            next: (response) => {
              console.log('Time slot added successfully:', response);
              this.dialog.closeAll();
              this.snackbarService.showSuccess(
                'Time slot added successfully',
                'Close'
              );
              this.isLoading = false;
              this.loadData();
            },
            error: (error) => {
              this.isLoading = false;
              console.error('Error adding time slot:', error);
              // More specific error message
              this.snackbarService.showError(
                error.error?.message ||
                  'Failed to add time slot: ' +
                    (error.status
                      ? `Server returned ${error.status}`
                      : 'Unknown error'),
                'Close'
              );
            },
          });
      }
    } else {
      // Log form validation errors
      console.error('Time slot form is invalid:', this.timeSlotForm.errors);
      Object.keys(this.timeSlotForm.controls).forEach((key) => {
        const control = this.timeSlotForm.get(key);
        if (control?.invalid) {
          console.error(`Control ${key} is invalid:`, control.errors);
        }
      });
    }
  }

  isAtCapacity(availability: ServiceAvailability): boolean {
    // Check if any time slots are at capacity
    return (
      availability.timeSlots?.some(
        (slot: TimeSlot) =>
          slot.currentBookings !== undefined &&
          slot.maxBookings !== undefined &&
          slot.currentBookings >= slot.maxBookings &&
          slot.available
      ) || false
    );
  }

  handleCapacityServices(): void {
    // Ask the admin if they want to automatically increase capacity for these services
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Services At Maximum Capacity',
        message: `${this.serviceAtCapacity.length} service(s) have reached maximum booking capacity. Would you like to automatically increase the capacity for all affected time slots by 2?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;

        // Get all time slots that are at capacity
        const affectedTimeSlotsOperations: Observable<any>[] = [];

        this.serviceAvailabilities
          .filter((avail: ServiceAvailability) =>
            this.serviceAtCapacity.includes(avail.id)
          )
          .forEach((availability: ServiceAvailability) => {
            // For each availability, find the time slots that are at capacity
            if (availability.timeSlots && availability.timeSlots.length > 0) {
              availability.timeSlots.forEach((slot: TimeSlot) => {
                // Check if the slot is at capacity
                if (
                  slot.currentBookings !== undefined &&
                  slot.maxBookings !== undefined &&
                  slot.currentBookings >= slot.maxBookings &&
                  slot.available
                ) {
                  // Create an update operation for this time slot
                  const updatedSlot: TimeSlotFormValue = {
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    maxBookings: slot.maxBookings + 2, // Increase capacity by 2
                    available: slot.available,
                  };

                  affectedTimeSlotsOperations.push(
                    this.timeSlotService.updateTimeSlot(slot.id, updatedSlot)
                  );
                }
              });
            }
          });

        // If there are no operations, show a message and return
        if (affectedTimeSlotsOperations.length === 0) {
          this.isLoading = false;
          this.snackbarService.showInfo(
            'No time slots found that need capacity increase',
            'Close'
          );
          return;
        }

        // Execute all updates and wait for all to complete
        forkJoin(affectedTimeSlotsOperations).subscribe({
          next: () => {
            this.snackbarService.showSuccess(
              `Capacity increased for ${affectedTimeSlotsOperations.length} time slots`,
              'Close'
            );
            this.loadData(); // Reload data
          },
          error: (error) => {
            this.snackbarService.showError(
              'Failed to update some time slots',
              'Close'
            );
            this.isLoading = false;
            console.error('Error updating time slots:', error);
            this.loadData(); // Reload data anyway
          },
        });
      }
    });
  }

  // Add a new time slot to the form array
  addTimeSlot(): void {
    const timeSlotGroup = this.fb.group(
      {
        startTime: ['', Validators.required],
        endTime: ['', Validators.required],
        maxBookings: [2, [Validators.required, Validators.min(1)]],
        available: [true],
      },
      { validators: [this.timeRangeValidator, this.timeOverlapValidator] }
    );

    this.timeSlots.push(timeSlotGroup);
  }

  // Remove a time slot from the form array
  removeTimeSlot(index: number): void {
    this.timeSlots.removeAt(index);
  }

  // Add a time slot to an existing service availability
  addTimeSlotToExisting(availability: ServiceAvailability): void {
    this.currentServiceAvailability = availability;
    this.editingTimeSlot = false;
    this.currentTimeSlotId = null;

    // Reset the form
    this.timeSlotForm.reset({
      startTime: '',
      endTime: '',
      maxBookings: 2,
      available: true,
    });

    // Open dialog
    const dialogRef = this.dialog.open(this.timeSlotDialog, {
      width: '500px',
    });
  }

  // Edit a time slot
  editTimeSlot(timeSlot: TimeSlot, availability: ServiceAvailability): void {
    this.currentServiceAvailability = availability;
    this.editingTimeSlot = true;
    this.currentTimeSlotId = timeSlot.id;

    // Set form values
    this.timeSlotForm.patchValue({
      startTime: this.formatTimeForInput(timeSlot.startTime),
      endTime: this.formatTimeForInput(timeSlot.endTime),
      maxBookings: timeSlot.maxBookings,
      available: timeSlot.available,
    });

    // Open dialog
    const dialogRef = this.dialog.open(this.timeSlotDialog, {
      width: '500px',
    });
  }

  // Toggle time slot availability
  toggleTimeSlotAvailability(timeSlotId: number): void {
    this.isLoading = true;
    this.timeSlotService.toggleTimeSlotAvailability(timeSlotId).subscribe({
      next: () => {
        this.snackbarService.showSuccess(
          'Time slot availability toggled successfully',
          'Close'
        );
        this.loadData();
      },
      error: (error) => {
        this.isLoading = false;
        this.snackbarService.showError(
          'Failed to toggle time slot availability',
          'Close'
        );
        console.error('Error toggling time slot availability:', error);
      },
    });
  }

  // Delete a time slot
  deleteTimeSlot(timeSlotId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirm Delete',
        message:
          'Are you sure you want to delete this time slot? This action cannot be undone.',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;
        this.timeSlotService.deleteTimeSlot(timeSlotId).subscribe({
          next: () => {
            this.snackbarService.showSuccess(
              'Time slot deleted successfully',
              'Close'
            );
            this.loadData();
          },
          error: (error) => {
            this.isLoading = false;
            this.snackbarService.showError(
              error.error?.message || 'Failed to delete time slot',
              'Close'
            );
            console.error('Error deleting time slot:', error);
          },
        });
      }
    });
  }

  // Increase the maximum bookings for a time slot
  increaseMaxBookings(timeSlot: TimeSlot): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Increase Maximum Bookings',
        message: `The current maximum for this time slot is ${timeSlot.maxBookings}. Would you like to increase it by 2?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;

        const updatedTimeSlot: TimeSlotFormValue = {
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          maxBookings: timeSlot.maxBookings + 2,
          available: timeSlot.available,
        };

        this.timeSlotService
          .updateTimeSlot(timeSlot.id, updatedTimeSlot)
          .subscribe({
            next: () => {
              this.snackbarService.showSuccess(
                'Maximum bookings increased successfully',
                'Close'
              );
              this.loadData();
            },
            error: (error) => {
              this.isLoading = false;
              this.snackbarService.showError(
                'Failed to increase maximum bookings',
                'Close'
              );
              console.error('Error increasing maximum bookings:', error);
            },
          });
      }
    });
  }

  onSubmit(): void {
    if (this.availabilityForm.valid) {
      this.isLoading = true;

      // Ensure at least one time slot is present (show warning but don't block)
      if (this.timeSlots.length === 0) {
        this.snackbarService.showInfo(
          'No time slots defined. Users will not be able to book this service.',
          'Close'
        );
      }

      const formValue = {
        serviceId: this.availabilityForm.value.serviceId,
        date: this.formatDate(this.availabilityForm.value.date),
        available: this.availabilityForm.value.available,
        timeSlots: this.formatTimeSlots(
          this.availabilityForm.value.timeSlots || []
        ),
      };

      if (this.isEditing && this.currentAvailabilityId) {
        this.serviceAvailabilityService
          .updateServiceAvailability(this.currentAvailabilityId, formValue)
          .subscribe({
            next: () => {
              this.snackbarService.showSuccess(
                'Service availability updated successfully',
                'Close'
              );
              this.resetForm();
              this.loadData();
            },
            error: (error) => {
              this.isLoading = false;
              console.error('Error updating service availability:', error);
              let errorMessage = 'Failed to update service availability';

              if (error.error?.message) {
                errorMessage = error.error.message;
              } else if (error.status) {
                errorMessage += `: Server returned ${error.status} ${
                  error.statusText || ''
                }`;
              }

              this.snackbarService.showError(errorMessage, 'Close');
            },
          });
      } else {
        this.serviceAvailabilityService
          .createServiceAvailability(formValue)
          .subscribe({
            next: () => {
              this.snackbarService.showSuccess(
                'Service availability created successfully',
                'Close'
              );
              this.resetForm();
              this.loadData();
            },
            error: (error) => {
              this.isLoading = false;
              console.error('Error creating service availability:', error);
              let errorMessage = 'Failed to create service availability';

              if (error.error?.message) {
                errorMessage = error.error.message;
              } else if (error.status) {
                errorMessage += `: Server returned ${error.status} ${
                  error.statusText || ''
                }`;
              }

              this.snackbarService.showError(errorMessage, 'Close');
            },
          });
      }
    } else {
      // Highlight invalid fields
      this.validateFormFields(this.availabilityForm);
      this.snackbarService.showError(
        'Please fill in all required fields correctly',
        'Close'
      );
    }
  }

  // Helper method to validate all form fields
  validateFormFields(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormGroup) {
        this.validateFormFields(control);
      } else if (control instanceof FormArray) {
        for (let i = 0; i < control.length; i++) {
          if (control.at(i) instanceof FormGroup) {
            this.validateFormFields(control.at(i) as FormGroup);
          }
        }
      }
      control?.markAsTouched({ onlySelf: true });
    });
  }

  // Format time slots for API submission
  private formatTimeSlots(timeSlots: any[]): any[] {
    if (!timeSlots) return [];

    return timeSlots.map((slot) => ({
      ...(slot.id ? { id: slot.id } : {}),
      startTime: this.formatTimeToLocalTime(slot.startTime),
      endTime: this.formatTimeToLocalTime(slot.endTime),
      maxBookings: slot.maxBookings,
      available: slot.available === true,
    }));
  }

  // Format time string to LocalTime format
  private formatTimeToLocalTime(timeString: string): string {
    if (!timeString) return '';

    // If it's already in HH:MM format, return as is
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }

    // Otherwise parse and format
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    } catch (e) {
      return timeString;
    }
  }

  // Format time for display
  formatTime(timeString: string): string {
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

      // Otherwise handle as Date object or date string with time component
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return timeString;
    }
  }

  // Format time for input fields (HTML time input expects HH:MM format)
  formatTimeForInput(timeString: string): string {
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

  editAvailability(availability: ServiceAvailability): void {
    this.isEditing = true;
    this.currentAvailabilityId = availability.id;

    // Convert date string to Date object for form control
    const dateObj = new Date(availability.date);

    // Clear existing time slots
    while (this.timeSlots.length) {
      this.timeSlots.removeAt(0);
    }

    // Add time slots from the availability
    if (availability.timeSlots && availability.timeSlots.length > 0) {
      availability.timeSlots.forEach((slot: TimeSlot) => {
        const timeSlotGroup = this.fb.group(
          {
            id: [slot.id],
            startTime: [
              this.formatTimeForInput(slot.startTime),
              Validators.required,
            ],
            endTime: [
              this.formatTimeForInput(slot.endTime),
              Validators.required,
            ],
            maxBookings: [
              slot.maxBookings,
              [Validators.required, Validators.min(1)],
            ],
            available: [slot.available],
          },
          { validators: [this.timeRangeValidator, this.timeOverlapValidator] }
        );

        this.timeSlots.push(timeSlotGroup);
      });
    }

    this.availabilityForm.patchValue({
      serviceId: availability.service.id,
      date: dateObj,
      available: availability.available,
    });
  }

  toggleAvailability(id: number): void {
    this.isLoading = true;
    this.serviceAvailabilityService.toggleAvailability(id).subscribe({
      next: () => {
        this.snackbarService.showSuccess(
          'Availability toggled successfully',
          'Close'
        );
        this.loadData();
      },
      error: (error) => {
        this.snackbarService.showError(
          'Failed to toggle availability',
          'Close'
        );
        this.isLoading = false;
        console.error('Error toggling availability:', error);
      },
    });
  }

  deleteAvailability(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirm Delete',
        message:
          'Are you sure you want to delete this service availability? This action cannot be undone.',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;
        this.serviceAvailabilityService
          .deleteServiceAvailability(id)
          .subscribe({
            next: () => {
              this.snackbarService.showSuccess(
                'Service availability deleted successfully',
                'Close'
              );
              this.loadData();
            },
            error: (error) => {
              this.snackbarService.showError(
                'Failed to delete service availability',
                'Close'
              );
              this.isLoading = false;
              console.error('Error deleting service availability:', error);
            },
          });
      }
    });
  }

  resetForm(): void {
    // Clear time slots form array
    while (this.timeSlots.length) {
      this.timeSlots.removeAt(0);
    }

    this.availabilityForm.reset({
      serviceId: '',
      date: '',
      available: true,
    });

    this.isEditing = false;
    this.currentAvailabilityId = null;
    this.isLoading = false;
  }

  // Update the formatDate method to preserve the exact date
  formatDate(date: Date): string {
    if (!date) return '';

    // Use UTC methods to avoid timezone issues
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2); // Months are 0-based
    const day = ('0' + d.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
  }

  // Update the formatDateDisplay method
  formatDateDisplay(dateString: string): string {
    try {
      // Create the date without timezone conversion
      const parts = dateString.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Months are 0-based in JS
      const day = parseInt(parts[2]);

      // Create a date in local timezone
      const date = new Date(year, month, day);

      // Format it consistently
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  }

  getServiceName(serviceId: number): string {
    const service = this.services.find((s) => s.id === serviceId);
    return service ? service.name : 'Unknown Service';
  }

  // Helper method to check if an object is a TimeSlot[]
  isTimeSlotArray(obj: any): obj is TimeSlot[] {
    return Array.isArray(obj) && (obj.length === 0 || 'startTime' in obj[0]);
  }
}
