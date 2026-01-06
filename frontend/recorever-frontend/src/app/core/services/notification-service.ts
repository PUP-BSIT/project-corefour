import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, retry, timer, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  PaginatedNotifications,
  UserNotification
} from '../../models/notification-model';
import { AuthService } from '../auth/auth-service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private API_BASE_URL = environment.apiUrl;
  private http = inject(HttpClient);
  private zone = inject(NgZone);
  private authService = inject(AuthService);

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
      if (!this.authService.isLoggedIn()) {
        observer.complete();
        return;
      }

      const url = `${this.API_BASE_URL}/notifications/stream`;
      const eventSource = new EventSource(url, { withCredentials: true });


      eventSource.addEventListener('new-report', (event: any) => {
        this.zone.run(() => observer.next(JSON.parse(event.data)));
      });

      eventSource.addEventListener('status-update', (event: any) => {
        this.zone.run(() => observer.next(JSON.parse(event.data)));
      });

      eventSource.onerror = (error) => {
        this.zone.run(() => {
          if (eventSource.readyState === EventSource.CLOSED
              || !this.authService.isLoggedIn()) {
            observer.complete();
          } else {
            observer.error(error);
          }
        });
      };


      return () => {
        eventSource.close();
      };
    }).pipe(
      retry({
        delay: (error) => {
          if (this.authService.isLoggedIn()) {
            console.warn('SSE lost, retrying in 5s...');
            return timer(5000);
          }
          return throwError(() => error);
        }
      })
    );
  }
}