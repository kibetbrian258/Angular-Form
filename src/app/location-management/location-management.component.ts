// location-management.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocationService } from '../Service/location.service';
import { SnackbarService } from '../Service/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-location-management',
  templateUrl: './location-management.component.html',
  styleUrls: ['./location-management.component.css'],
})
export class LocationManagementComponent implements OnInit {
  locations: any[] = [];
  locationForm: FormGroup;
  isEditing = false;
  currentLocationId: number | null = null;
  isLoading = false;
  displayedColumns: string[] = ['name', 'address', 'status', 'actions'];

  constructor(
    private locationService: LocationService,
    private fb: FormBuilder,
    private snackbarService: SnackbarService,
    private dialog: MatDialog
  ) {
    this.locationForm = this.fb.group({
      name: ['', Validators.required],
      address: [''],
      description: [''],
      active: [true],
    });
  }

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.isLoading = true;
    this.locationService.getAllLocations().subscribe({
      next: (data) => {
        this.locations = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.snackbarService.showError('Failed to load locations', 'Close');
        this.isLoading = false;
        console.error('Error loading locations:', error);
      },
    });
  }

  onSubmit(): void {
    if (this.locationForm.valid) {
      this.isLoading = true;

      if (this.isEditing && this.currentLocationId) {
        this.locationService
          .updateLocation(this.currentLocationId, this.locationForm.value)
          .subscribe({
            next: () => {
              this.snackbarService.showSuccess(
                'Location updated successfully',
                'Close'
              );
              this.resetForm();
              this.loadLocations();
            },
            error: (error) => {
              this.snackbarService.showError(
                'Failed to update location',
                'Close'
              );
              this.isLoading = false;
              console.error('Error updating location:', error);
            },
          });
      } else {
        this.locationService.createLocation(this.locationForm.value).subscribe({
          next: () => {
            this.snackbarService.showSuccess(
              'Location created successfully',
              'Close'
            );
            this.resetForm();
            this.loadLocations();
          },
          error: (error) => {
            this.snackbarService.showError(
              'Failed to create location',
              'Close'
            );
            this.isLoading = false;
            console.error('Error creating location:', error);
          },
        });
      }
    }
  }

  editLocation(location: any): void {
    this.isEditing = true;
    this.currentLocationId = location.id;
    this.locationForm.patchValue({
      name: location.name,
      address: location.address,
      description: location.description,
      active: location.active,
    });
  }

  deleteLocation(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirm Delete',
        message:
          'Are you sure you want to delete this location? This action cannot be undone.',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;
        this.locationService.deleteLocation(id).subscribe({
          next: () => {
            this.snackbarService.showSuccess(
              'Location deleted successfully',
              'Close'
            );
            this.loadLocations();
          },
          error: (error) => {
            this.snackbarService.showError(
              'Failed to delete location',
              'Close'
            );
            this.isLoading = false;
            console.error('Error deleting location:', error);
          },
        });
      }
    });
  }

  resetForm(): void {
    this.locationForm.reset({
      name: '',
      address: '',
      description: '',
      active: true,
    });
    this.isEditing = false;
    this.currentLocationId = null;
    this.isLoading = false;
  }
}
