import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomSnackbarComponent } from '../custom-snackbar/custom-snackbar.component';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  showSuccess(message: string, action?: string) {
    this.showNotification(message, 'success', 'check_circle', action);
  }

  showError(message: string, action?: string) {
    this.showNotification(message, 'error', 'error_outline', action);
  }

  showInfo(message: string, action?: string) {
    this.showNotification(message, 'info', 'info', action);
  }

  private showNotification(
    message: string,
    type: 'success' | 'error' | 'info',
    icon: string,
    action?: string
  ) {
    this.snackBar.openFromComponent(CustomSnackbarComponent, {
      data: {
        message,
        action: action || 'Close',
        icon,
      },
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: [`${type}-snackbar`, 'modern-snackbar'],
    });
  }
}
