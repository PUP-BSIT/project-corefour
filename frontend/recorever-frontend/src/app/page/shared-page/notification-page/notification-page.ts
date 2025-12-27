import { 
  Component, 
  inject, 
  OnInit, 
  OnDestroy, 
  ChangeDetectorRef 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import {
  NotificationService
} from '../../../core/services/notification-service';
import type { UserNotification } from '../../../models/notification-model';
import { Subscription, tap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-notification-page',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  templateUrl: './notification-page.html',
  styleUrl: './notification-page.scss',
})
export class NotificationPage implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  
  private streamSub!: Subscription;
  private notificationSub!: Subscription;

  notifications: UserNotification[] = [];
  currentPage = 1;
  totalPages = 1;
  isLoading = false;

  ngOnInit(): void {
    this.loadPage(1);
    this.initSseStream();
  }

  initSseStream(): void {
    this.streamSub = this.notificationService
      .getNotificationStream()
      .subscribe({
        next: (newNotif) => {
          this.notifications = [newNotif, ...this.notifications];
          this.cdr.markForCheck();
        },
        error: (err) => console.error('SSE connection failed', err)
      });
  }

  ngOnDestroy(): void {
    if (this.streamSub) this.streamSub.unsubscribe();
    if (this.notificationSub) this.notificationSub.unsubscribe();
  }

  loadPage(page: number): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.notificationSub = this.notificationService
      .getNotifications(page, 10)
      .pipe(
        tap((response) => {
          this.notifications = page === 1 
                             ? response.items 
                             : [...this.notifications, ...response.items];
          this.currentPage = response.currentPage;
          this.totalPages = response.totalPages;
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
        catchError(() => {
          this.isLoading = false;
          return of(null);
        })
      ).subscribe();
  }

  onNotificationClick(notification: UserNotification): void {
    if (notification.status === 'unread') {
      this.notificationService.markAsRead(notification.notif_id)
      .subscribe(() => {
        notification.status = 'read';
        this.cdr.markForCheck();
      });
    }
    // Add navigation logic here
  }
}