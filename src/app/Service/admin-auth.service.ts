import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';

interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AdminJwtAuthResponse {
  user: AdminUser;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {
  private apiUrl = `${environment.apiUrl}/users`;
  private refreshTokenTimeout: any;

  private currentAdminSubject = new BehaviorSubject<AdminUser | null>(null);
  public currentAdmin = this.currentAdminSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredAuth();
  }

  private loadStoredAuth() {
    const authData = localStorage.getItem('admin_auth');
    if (authData) {
      const auth = JSON.parse(authData);
      this.currentAdminSubject.next(auth.user);
      
      // Start token refresh timer
      this.startRefreshTokenTimer(auth.refreshToken);
    }
  }

  login(email: string, password: string): Observable<AdminUser> {
    return this.http
      .post<AdminJwtAuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          // Only store if the user is an admin
          if (response.user.role === 'ADMIN') {
            this.storeAuthData(response);
          } else {
            throw new Error('Insufficient permissions. Admin access required.');
          }
        }),
        map(response => response.user),
        catchError((error) => {
          console.error('Admin login error:', error);
          return throwError(() => error);
        })
      );
  }

  refreshToken(): Observable<AdminJwtAuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      // No refresh token, user must login again
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AdminJwtAuthResponse>(`${this.apiUrl}/refresh-token`, { refreshToken })
      .pipe(
        tap(response => {
          this.storeAuthData(response);
        }),
        catchError(error => {
          console.error('Token refresh failed:', error);
          this.logout();
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    // Stop the token refresh timer
    this.stopRefreshTokenTimer();
    
    // Clear admin auth data
    localStorage.removeItem('admin_auth');
    
    // Clear current admin
    this.currentAdminSubject.next(null);
    
    // Navigate to admin login page
    this.router.navigate(['/admin-login']);
  }

  isLoggedIn(): boolean {
    return !!this.currentAdminSubject.value;
  }

  isAdmin(): boolean {
    const admin = this.currentAdminSubject.value;
    return admin?.role === 'ADMIN';
  }

  getAccessToken(): string | null {
    const authData = localStorage.getItem('admin_auth');
    if (!authData) return null;
    
    return JSON.parse(authData).accessToken;
  }

  getRefreshToken(): string | null {
    const authData = localStorage.getItem('admin_auth');
    if (!authData) return null;
    
    return JSON.parse(authData).refreshToken;
  }

  private storeAuthData(authResponse: AdminJwtAuthResponse): void {
    // Store auth data in localStorage with admin prefix
    localStorage.setItem('admin_auth', JSON.stringify(authResponse));
    
    // Update the BehaviorSubject with the user
    this.currentAdminSubject.next(authResponse.user);
    
    // Start the token refresh timer
    this.startRefreshTokenTimer(authResponse.refreshToken);
  }

  private startRefreshTokenTimer(refreshToken: string): void {
    // First stop any existing timer
    this.stopRefreshTokenTimer();
    
    // Parse the JWT to get the expiration time
    const jwtToken = this.getAccessToken();
    if (!jwtToken) return;
    
    const expiry = this.getTokenExpirationTime(jwtToken);
    const timeout = expiry - Date.now() - (60 * 1000); // Refresh 1 minute before expiry
    
    if (timeout <= 0) {
      // Token is already expired or about to expire, refresh immediately
      this.refreshToken().subscribe();
      return;
    }
    
    this.refreshTokenTimeout = setTimeout(() => {
      this.refreshToken().subscribe();
    }, timeout);
  }

  private stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  private getTokenExpirationTime(token: string): number {
    // Split the JWT and decode the payload
    const payload = token.split('.')[1];
    const payloadData = JSON.parse(atob(payload));
    
    // Get the exp claim and convert to milliseconds
    return payloadData.exp * 1000;
  }
}