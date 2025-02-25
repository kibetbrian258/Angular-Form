import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

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

  registerUser(userData: UserRegistrationDTO): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, userData).pipe(
      tap((user) => {
        // Save user ID to localStorage for later use
        localStorage.setItem('userId', user.id.toString());
      })
    );
  }

  getUser(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}`);
  }
}
