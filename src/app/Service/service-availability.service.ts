// service-availability.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

export interface TimeSlot {
  id?: number;
  startTime: string;
  endTime: string;
  maxBookings: number;
  currentBookings: number;
  available: boolean;
  active: boolean;
}

export interface ServiceAvailability {
  id: number;
  service: {
    id: number;
    name: string;
  };
  date: string;
  available: boolean;
  maxBookings: number;
  currentBookings: number;
  timeSlots?: TimeSlot[];
}

@Injectable({
  providedIn: 'root',
})
export class ServiceAvailabilityService {
  private apiUrl = 'http://localhost:8080/api/service-availability';
  private adminApiUrl = 'http://localhost:8080/api/admin/service-availability';

  constructor(private http: HttpClient) {}

  // Public endpoints
  getAvailableServicesForDate(date: string): Observable<ServiceAvailability[]> {
    return this.http
      .get<ServiceAvailability[]>(`${this.apiUrl}/date/${date}`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching available services for date:', error);
          return throwError(() => error);
        })
      );
  }

  // In service-availability.service.ts
  getAvailableDatesForService(serviceId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/service/${serviceId}`).pipe(
      catchError((error) => {
        console.error(
          `Error fetching available dates for service ${serviceId}:`,
          error
        );
        return throwError(() => error);
      })
    );
  }

  // Admin endpoints
  getAllServiceAvailabilities(): Observable<ServiceAvailability[]> {
    return this.http.get<ServiceAvailability[]>(this.adminApiUrl).pipe(
      catchError((error) => {
        console.error('Error fetching all service availabilities:', error);
        return throwError(() => error);
      })
    );
  }

  getServiceAvailabilityById(id: number): Observable<ServiceAvailability> {
    return this.http.get<ServiceAvailability>(`${this.adminApiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(
          `Error fetching service availability with id ${id}:`,
          error
        );
        return throwError(() => error);
      })
    );
  }

  createServiceAvailability(data: any): Observable<ServiceAvailability> {
    // Log the data being sent for debugging
    console.log(
      'Creating service availability with data:',
      JSON.stringify(data)
    );
    return this.http.post<ServiceAvailability>(this.adminApiUrl, data).pipe(
      catchError((error) => {
        console.error('Error creating service availability:', error);
        console.error('Request payload:', data);
        return throwError(() => error);
      })
    );
  }

  updateServiceAvailability(
    id: number,
    data: any
  ): Observable<ServiceAvailability> {
    // Log the data being sent for debugging
    console.log(
      `Updating service availability ${id} with data:`,
      JSON.stringify(data)
    );
    return this.http
      .put<ServiceAvailability>(`${this.adminApiUrl}/${id}`, data)
      .pipe(
        catchError((error) => {
          console.error(
            `Error updating service availability with id ${id}:`,
            error
          );
          console.error('Request payload:', data);
          return throwError(() => error);
        })
      );
  }

  toggleAvailability(id: number): Observable<ServiceAvailability> {
    return this.http
      .put<ServiceAvailability>(`${this.adminApiUrl}/${id}/toggle`, {})
      .pipe(
        catchError((error) => {
          console.error(`Error toggling availability for id ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  deleteServiceAvailability(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(
          `Error deleting service availability with id ${id}:`,
          error
        );
        return throwError(() => error);
      })
    );
  }
}
