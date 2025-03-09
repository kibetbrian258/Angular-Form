import { Component, OnInit } from '@angular/core';
import { AdminService } from '../Service/admin.service';
import { SnackbarService } from '../Service/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  isLoading = false;
  displayedColumns: string[] = ['id', 'name', 'email', 'role', 'actions'];

  roles = [
    { value: 'USER', viewValue: 'User' },
    { value: 'ADMIN', viewValue: 'Admin' },
  ];

  constructor(
    private adminService: AdminService,
    private snackbarService: SnackbarService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.snackbarService.showError('Failed to load users', 'Close');
        this.isLoading = false;
        console.error('Error loading users:', error);
      },
    });
  }

  changeUserRole(userId: number, role: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Confirm Role Change',
        message: `Are you sure you want to change this user's role to ${role}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;
        this.adminService.updateUserRole(userId, role).subscribe({
          next: () => {
            this.snackbarService.showSuccess(
              'User role updated successfully',
              'Close'
            );
            this.loadUsers();
          },
          error: (error) => {
            this.snackbarService.showError(
              'Failed to update user role',
              'Close'
            );
            this.isLoading = false;
            console.error('Error updating user role:', error);
          },
        });
      }
    });
  }

  getRoleLabel(role: string): string {
    const foundRole = this.roles.find((r) => r.value === role);
    return foundRole ? foundRole.viewValue : role;
  }
}
