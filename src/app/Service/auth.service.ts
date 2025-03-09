import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface JwtAuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/users';
  private refreshTokenTimeout: any;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredAuth();
  }

  private loadStoredAuth() {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const auth = JSON.parse(authData);
      this.currentUserSubject.next(auth.user);

      // Start token refresh timer
      this.startRefreshTokenTimer(auth.refreshToken);
    }
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<JwtAuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          this.storeAuthData(response);
        }),
        map((response) => response.user),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Observable<User> {
    return this.http
      .post<JwtAuthResponse>(`${this.apiUrl}/register`, {
        firstName,
        lastName,
        email,
        password,
      })
      .pipe(
        tap((response) => {
          this.storeAuthData(response);
        }),
        map((response) => response.user),
        catchError((error) => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  refreshToken(): Observable<JwtAuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      // No refresh token, user must login again
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<JwtAuthResponse>(`${this.apiUrl}/refresh-token`, { refreshToken })
      .pipe(
        tap((response) => {
          this.storeAuthData(response);
        }),
        catchError((error) => {
          console.error('Token refresh failed:', error);
          this.logout();
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    // Stop the token refresh timer
    this.stopRefreshTokenTimer();

    // Clear local storage
    localStorage.removeItem('auth');
    localStorage.removeItem('userId');

    // Clear current user
    this.currentUserSubject.next(null);

    // Navigate to login page
    this.router.navigate(['/login']);
  }

  getUserId(): number | null {
    const user = this.currentUserSubject.value;
    return user ? user.id : null;
  }

  getUserRole(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.role : null;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const userRole = this.getUserRole();
    return userRole === 'ADMIN';
  }

  getAccessToken(): string | null {
    const authData = localStorage.getItem('auth');
    if (!authData) return null;

    return JSON.parse(authData).accessToken;
  }

  getRefreshToken(): string | null {
    const authData = localStorage.getItem('auth');
    if (!authData) return null;

    return JSON.parse(authData).refreshToken;
  }

  private storeAuthData(authResponse: JwtAuthResponse): void {
    // Store auth data in localStorage
    localStorage.setItem('auth', JSON.stringify(authResponse));
    localStorage.setItem('userId', authResponse.user.id.toString());

    // Update the BehaviorSubject with the user
    this.currentUserSubject.next(authResponse.user);

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
    const timeout = expiry - Date.now() - 60 * 1000; // Refresh 1 minute before expiry

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
