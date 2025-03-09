import { Injectable } from '@angular/core';
import { AuthService } from '../Service/auth.service';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { SnackbarService } from '../Service/snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackbarService: SnackbarService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isLoggedIn()) {
      // Check if the route requires a specific role
      const requiredRole = route.data['requiredRole'];
      if (requiredRole && !this.hasRole(requiredRole)) {
        this.snackbarService.showError(
          `Access denied. You need ${requiredRole} permissions.`,
          'Close'
        );
        this.router.navigate(['/']);
        return false;
      }

      return true;
    } else {
      // Save the attempted URL for redirection after login
      localStorage.setItem('redirectUrl', state.url);

      this.snackbarService.showInfo(
        'Please log in to access this page',
        'Close'
      );
      this.router.navigate(['/login']);
      return false;
    }
  }

  private hasRole(requiredRole: string): boolean {
    const userRole = this.authService.getUserRole();
    return userRole === requiredRole;
  }
}
