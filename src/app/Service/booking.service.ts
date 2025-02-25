import { HttpClient, HttpHeaders } from '@angular/common/http';
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
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private apiUrl = 'http://localhost:8080/api/bookings';

  constructor(private http: HttpClient) {}

  createBooking(bookingData: BookingRequestDTO): Observable<Booking> {
    const userId = localStorage.getItem('userId');

    // Set the User-id header for the request
    const headers = new HttpHeaders({
      'User-id': userId || '',
    });

    return this.http.post<Booking>(this.apiUrl, bookingData, { headers });
  }

  getUserBookings(): Observable<Booking[]> {
    const userId = localStorage.getItem('userId');
    return this.http.get<Booking[]>(`${this.apiUrl}/${userId}`);
  }
}
