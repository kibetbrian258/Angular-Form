import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { SnackbarService } from '../Service/snackbar.service';
import { AdminAuthService } from '../Service/admin-auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(
    private adminAuthService: AdminAuthService,
    private router: Router,
    private snackbarService: SnackbarService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // First check if the user is logged in as admin using AdminAuthService
    if (!this.adminAuthService.isLoggedIn()) {
      this.snackbarService.showInfo(
        'Please log in to access the admin portal',
        'Close'
      );
      this.router.navigate(['/admin-login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    // Then check if the user is an admin
    if (this.adminAuthService.isAdmin()) {
      return true;
    } else {
      this.snackbarService.showError(
        'Access denied. Admin privileges required.',
        'Close'
      );
      this.router.navigate(['/']);
      return false;
    }
  }
}
