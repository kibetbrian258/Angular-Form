import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface TimeSlotRequest {
  startTime: string;
  endTime: string;
  maxBookings: number;
  available: boolean;
}

export interface TimeSlotResponse {
  id: number;
  startTime: string;
  endTime: string;
  maxBookings: number;
  currentBookings: number;
  available: boolean;
  active: boolean;
  serviceAvailability: {
    id: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class TimeSlotService {
  // Use the direct URL instead of environment to ensure it's correct
  private baseUrl = 'http://localhost:8080/api/admin/time-slots';

  constructor(private http: HttpClient) {}

  addTimeSlot(
    availabilityId: number,
    timeSlot: TimeSlotRequest
  ): Observable<TimeSlotResponse> {
    // Log the data being sent for debugging
    console.log(
      `Adding time slot to availability ${availabilityId} with data:`,
      JSON.stringify(timeSlot)
    );
    return this.http
      .post<TimeSlotResponse>(`${this.baseUrl}/${availabilityId}`, timeSlot)
      .pipe(
        catchError((error) => {
          console.error(
            `Error adding time slot for availability ${availabilityId}:`,
            error
          );
          console.error('Request payload:', timeSlot);
          return throwError(() => error);
        })
      );
  }

  updateTimeSlot(
    timeSlotId: number,
    timeSlot: TimeSlotRequest
  ): Observable<TimeSlotResponse> {
    // Log the data being sent for debugging
    console.log(
      `Updating time slot ${timeSlotId} with data:`,
      JSON.stringify(timeSlot)
    );
    return this.http
      .put<TimeSlotResponse>(`${this.baseUrl}/${timeSlotId}`, timeSlot)
      .pipe(
        catchError((error) => {
          console.error(`Error updating time slot ${timeSlotId}:`, error);
          console.error('Request payload:', timeSlot);
          return throwError(() => error);
        })
      );
  }

  deleteTimeSlot(timeSlotId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${timeSlotId}`).pipe(
      catchError((error) => {
        console.error(`Error deleting time slot ${timeSlotId}:`, error);
        return throwError(() => error);
      })
    );
  }

  toggleTimeSlotAvailability(timeSlotId: number): Observable<TimeSlotResponse> {
    return this.http
      .put<TimeSlotResponse>(`${this.baseUrl}/${timeSlotId}/toggle`, {})
      .pipe(
        catchError((error) => {
          console.error(
            `Error toggling time slot ${timeSlotId} availability:`,
            error
          );
          return throwError(() => error);
        })
      );
  }
}
