import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import {
  NotificationService
} from '../../../core/services/notification-service';
import { ItemService } from '../../../core/services/item-service';
import { AuthService } from '../../../core/auth/auth-service';
import { ToastService } from '../../../core/services/toast-service';
import { ItemDetailModal } from '../../../modal/item-detail-modal/item-detail-modal';
import { ClaimFormModal } from '../../../modal/claim-form-modal/claim-form-modal';
import type { UserNotification } from '../../../models/notification-model';
import type { Report } from '../../../models/item-model';
import { Subscription, tap, catchError, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-notification-page',
  standalone: true,
  imports: [
    CommonModule,
    TimeAgoPipe,
    ItemDetailModal,
    ClaimFormModal,
    MatButtonModule
  ],
  templateUrl: './notification-page.html',
  styleUrl: './notification-page.scss',
})
export class NotificationPage implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private itemService = inject(ItemService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  private streamSub!: Subscription;
  private notificationSub!: Subscription;

  notifications: UserNotification[] = [];
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  unreadCount = 0;
  isLoading = false;

  currentFilter: 'all' | 'unread' = 'all';

  selectedReport = signal<Report | null>(null);
  currentUser = toSignal(this.authService.currentUser$);

  currentUserId = computed(() => this.currentUser()?.user_id ?? null);
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

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
          this.unreadCount++;
          this.totalItems++;
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
      .getNotifications(page, 10, this.currentFilter)
      .pipe(
        tap((response) => {
          this.notifications = page === 1
                             ? response.items
                             : [...this.notifications, ...response.items];
          this.currentPage = response.currentPage;
          this.totalPages = response.totalPages;
          this.totalItems = response.totalItems;
          this.unreadCount = response.unreadCount;

          this.isLoading = false;
          this.cdr.markForCheck();
        }),
        catchError(() => {
          this.isLoading = false;
          return of(null);
        })
      ).subscribe();
  }

  setFilter(filter: 'all' | 'unread'): void {
    this.currentFilter = filter;
    this.loadPage(1);
  }

  onMarkAllRead(): void {
    if (this.unreadCount === 0) return;

    this.notificationService.markAllAsRead().pipe(
      tap(() => {
        if (this.currentFilter === 'unread') {
           this.notifications = [];
        } else {
           this.notifications.forEach(n => n.status = 'read');
        }
        this.unreadCount = 0;
        this.cdr.markForCheck();
        this.toastService.showSuccess('All notifications marked as read');
      }),
      catchError((err) => {
        console.error('Failed to mark all as read', err);
        return of(null);
      })
    ).subscribe();
  }

  onNotificationClick(notification: UserNotification): void {
    let action$ = of(null);

    if (notification.status === 'unread') {
      action$ = this.notificationService.markAsRead(notification.notif_id).pipe(
        tap(() => {
          notification.status = 'read';
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          this.cdr.markForCheck();
        })
      );
    }

    action$.pipe(
      switchMap(() => this.itemService.getReportById(notification.report_id)),
      tap((report) => {
        this.selectedReport.set(report);
        this.cdr.markForCheck();
      }),
      catchError((err) => {
        console.error('Failed to load report details', err);
        this.toastService.showError('This item is no longer available.');
        return of(null);
      })
    ).subscribe();
  }

  onModalClose(): void {
    this.selectedReport.set(null);
  }

  getUserProfilePicture(): string | null {
    const report = this.selectedReport();
    if (report && report.reporter_profile_picture) {
      const baseUrl = environment.apiUrl.replace('http://', 'https://');
      return `${baseUrl}/image/download/${report.reporter_profile_picture}`;
    }
    return null;
  }

  onViewTicket(): void {}
  onEdit(): void {}
  onDelete(): void {}
  onViewCode(): void {}
  onStatusChange(event: any): void {}
}