import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { PaginatedNotifications, UserNotification } from '../../models/notification-model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private API_BASE_URL = environment.apiUrl;
  private http = inject(HttpClient);
  private zone = inject(NgZone);

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

  getNotificationStream(): Observable<UserNotification> {
    return new Observable<UserNotification>(observer => {
      const eventSource = new EventSource(`${this.API_BASE_URL}/notifications/stream`, {
        withCredentials: true
      });

      eventSource.addEventListener('new-report', (event: any) => {
        this.zone.run(() => observer.next(JSON.parse(event.data)));
      });

      eventSource.addEventListener('status-update', (event: any) => {
        this.zone.run(() => observer.next(JSON.parse(event.data)));
      });

      eventSource.onerror = error => {
        this.zone.run(() => observer.error(error));
      };

      return () => eventSource.close();
    });
  }
}