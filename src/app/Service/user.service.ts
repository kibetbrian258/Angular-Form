import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface UserRegistrationDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  // This method is now handled by the AuthService

  // registerUser(userData: UserRegistrationDTO): Observable<User> {
  //   return this.http.post<User>(`${this.apiUrl}/register`, userData);
  // }

  getCurrentUser(): Observable<User> {
    // Get the profile of the currently authenticated user
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  deleteCurrentUser(): Observable<void> {
    // Delete the currently authenticated user
    return this.http.delete<void>(`${this.apiUrl}/profile`);
  }
}
