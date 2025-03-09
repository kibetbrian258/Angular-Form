// location.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Location {
  id: number;
  name: string;
  address: string;
  description: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private apiUrl = 'http://localhost:8080/api/locations';
  private adminApiUrl = 'http://localhost:8080/api/admin/locations';

  constructor(private http: HttpClient) {}

  // Public endpoints
  getActiveLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(this.apiUrl);
  }

  // Admin endpoints
  getAllLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(this.adminApiUrl);
  }

  getLocationById(id: number): Observable<Location> {
    return this.http.get<Location>(`${this.adminApiUrl}/${id}`);
  }

  createLocation(locationData: any): Observable<Location> {
    return this.http.post<Location>(this.adminApiUrl, locationData);
  }

  updateLocation(id: number, locationData: any): Observable<Location> {
    return this.http.put<Location>(`${this.adminApiUrl}/${id}`, locationData);
  }

  deleteLocation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminApiUrl}/${id}`);
  }
}