import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface BookingRequestDTO {
  location: string;
  time: string;
  date: string;
  serviceRequired: string;
}

export interface Booking {
  id: number;
  location: string;
  time: string;
  date: string;
  serviceRequired: string;
  createdAt?: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private apiUrl = 'http://localhost:8080/api/bookings';

  constructor(private http: HttpClient) {}

  createBooking(bookingData: BookingRequestDTO): Observable<Booking> {
    // No need to manually set headers - JWT interceptor will handle this
    return this.http.post<Booking>(this.apiUrl, bookingData);
  }

  updateBooking(
    bookingId: number,
    bookingData: BookingRequestDTO
  ): Observable<Booking> {
    return this.http.put<Booking>(`${this.apiUrl}/${bookingId}`, bookingData);
  }

  getBookingById(bookingId: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${bookingId}`);
  }

  getUserBookings(): Observable<Booking[]> {
    // JWT will identify the user from the token - no need to pass userId
    return this.http.get<Booking[]>(this.apiUrl);
  }

  cancelBooking(bookingId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${bookingId}`);
  }
}
