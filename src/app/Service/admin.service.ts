import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) {}

  // Service management

  getServices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/services`);
  }

  getServiceById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/services/${id}`);
  }

  createService(serviceData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/services`, serviceData);
  }

  updateService(id: number, serviceData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/services/${id}`, serviceData);
  }

  deleteService(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/services/${id}`);
  }

  // Time slots management

  getTimeSlots(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/time-slots`);
  }

  getTimeSlotById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/time-slots/${id}`);
  }

  createTimeSlot(timeSlotData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/time-slots`, timeSlotData);
  }

  updateTimeSlot(id: number, timeSlotData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/time-slots/${id}`, timeSlotData);
  }

  deleteTimeSlot(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/time-slots/${id}`);
  }

  // User Management
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${id}`);
  }

  updateUserRole(id: number, role: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${id}/role`, { role });
  }

  // Booking management

  getBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bookings`);
  }

  getBookingById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/bookings/${id}`);
  }

  getBookingsByDate(date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bookings/date/${date}`);
  }

  cancelBooking(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/bookings/${id}`);
  }
}
