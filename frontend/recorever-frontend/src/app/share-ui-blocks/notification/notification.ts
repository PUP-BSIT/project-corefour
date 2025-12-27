import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  HostListener
} from '@angular/core';
import { Router } from '@angular/router';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { NotificationService } from '../../core/services/notification-service';
import type { UserNotification } from '../../models/notification-model';
import { Subscription, tap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [TimeAgoPipe],
  templateUrl: './notification.html',
  styleUrl: './notification.scss',
})
export class Notification implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private eRef = inject(ElementRef);
  
  private streamSub!: Subscription;
  private notificationSub!: Subscription;

  notifications: UserNotification[] = [];
  currentPage = 1;
  totalPages = 1;
  isLoading = false;
  isDropdownOpen = false;
  hasUnreadNotifications = false;

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
      this.cdr.markForCheck();
    }
  }

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

          this.hasUnreadNotifications = true;

          this.cdr.markForCheck();
        },
        error: (err) => console.error('SSE connection failed', err)
      });
  }

  ngOnDestroy(): void {
    if (this.streamSub) this.streamSub.unsubscribe();
    if (this.notificationSub) this.notificationSub.unsubscribe();
  }

  loadPage(page: number, silentLoad = false): void {
    if (this.isLoading && !silentLoad) return;

    if (!silentLoad) {
      this.isLoading = true;
    }

    if (this.notificationSub) {
      this.notificationSub.unsubscribe();
    }

    this.notificationSub = this.notificationService
      .getNotifications(page, 5)
      .pipe(
        tap((response) => {
          if (page === 1) {
            this.notifications = response.items;
          } else {
            this.notifications = [...this.notifications, ...response.items];
          }

          this.currentPage = response.currentPage;
          this.totalPages = response.totalPages;
          this.hasUnreadNotifications = this.notifications.some(
            (notif) => notif.status === 'unread'
          );

          this.isLoading = false;
          this.cdr.markForCheck();
        }),
        catchError((err) => {
          console.error('Failed to load notifications', err);
          this.isLoading = false;
          this.cdr.markForCheck();
          return of(null);
        })
      )
      .subscribe();
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      this.currentPage = 1;
      this.loadPage(1);
    }
  }

  onViewMore(): void {
    this.loadPage(this.currentPage + 1);
  }

  onNotificationClick(notification: UserNotification): void {
    if (notification.status === 'unread') {
      this.notificationService.markAsRead(notification.notif_id).subscribe(() => {
        notification.status = 'read';
        this.hasUnreadNotifications = this.notifications.some(n => n.status === 'unread');
      });
    }
    // TODO(Florido, Maydelyn): Add navigation logic when the viewing
    //                          notification feature is implemented.
    this.isDropdownOpen = false;
  }
}