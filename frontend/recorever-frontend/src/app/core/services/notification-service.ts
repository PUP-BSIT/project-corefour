import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { PaginatedNotifications } from '../../models/notification-model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private API_BASE_URL = environment.apiUrl;
  private http = inject(HttpClient);

  getNotifications(
    page: number, size: number
  ): Observable<PaginatedNotifications> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginatedNotifications>(
      `${this.API_BASE_URL}/notifications`, { params }
    );
  }

  markAsRead(id: number): Observable<any> {
    return this.http.put(`${this.API_BASE_URL}/notifications/${id}/read`, {});
  }
}