import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../Service/admin.service';
import { SnackbarService } from '../Service/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  active: boolean;
}

@Component({
  selector: 'app-service-management',
  templateUrl: './service-management.component.html',
  styleUrls: ['./service-management.component.css'],
})
export class ServiceManagementComponent implements OnInit {
  service: Service[] = [];
  serviceForm: FormGroup;
  isEditing = false;
  currentServiceId: number | null = null;
  isLoading = false;
  displayedColumns: string[] = [
    'name',
    'description',
    'price',
    'status',
    'actions',
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private snackbarService: SnackbarService,
    private dialog: MatDialog
  ) {
    this.serviceForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      active: [true],
    });
  }

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.isLoading = true;
    this.adminService.getServices().subscribe({
      next: (data) => {
        this.service = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.snackbarService.showError('Failed to load services', 'Close');
        this.isLoading = false;
        console.error('Error loading services:', error);
      },
    });
  }

  onSubmit(): void {
    if (this.serviceForm.valid) {
      this.isLoading = true;

      if (this.isEditing && this.currentServiceId) {
        this.adminService
          .updateService(this.currentServiceId, this.serviceForm.value)
          .subscribe({
            next: () => {
              this.snackbarService.showSuccess(
                'Service updated successfully',
                'Close'
              );
              this.resetForm();
              this.loadServices();
            },
            error: (error) => {
              this.snackbarService.showError(
                'Failed to update service',
                'Close'
              );
              this.isLoading = false;
              console.error('Error updating service:', error);
            },
          });
      } else {
        this.adminService.createService(this.serviceForm.value).subscribe({
          next: () => {
            this.snackbarService.showSuccess(
              'Service created successfully',
              'Close'
            );
            this.resetForm();
            this.loadServices();
          },
          error: (error) => {
            this.snackbarService.showError('Failed to create service', 'Close');
            this.isLoading = false;
            console.error('Error creating service:', error);
          },
        });
      }
    }
  }

  editService(service: Service): void {
    this.isEditing = true;
    this.currentServiceId = service.id;
    this.serviceForm.patchValue({
      name: service.name,
      description: service.description,
      price: service.price,
      active: service.active,
    });
  }

  deleteService(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirm Delete',
        message:
          'Are you sure you want to delete this service? This action cannot be undone.',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;
        this.adminService.deleteService(id).subscribe({
          next: () => {
            this.snackbarService.showSuccess(
              'Service deleted successfully',
              'Close'
            );
            this.loadServices();
          },
          error: (error) => {
            this.snackbarService.showError('Failed to delete service', 'Close');
            this.isLoading = false;
            console.error('Error deleting service:', error);
          },
        });
      }
    });
  }

  resetForm(): void {
    this.serviceForm.reset({
      name: '',
      description: '',
      price: 0,
      active: true,
    });
    this.isEditing = false;
    this.currentServiceId = null;
    this.isLoading = false;
  }
}
