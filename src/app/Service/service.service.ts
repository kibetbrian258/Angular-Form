import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Service {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: number;
  active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ServiceService {
  private apiUrl = 'http://localhost:8080/api/services';

  constructor(private http: HttpClient) {}

  getActiveServices(): Observable<Service[]> {
    return this.http.get<Service[]>(this.apiUrl);
  }
}
