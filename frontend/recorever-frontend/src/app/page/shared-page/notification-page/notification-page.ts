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
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import {
  NotificationService
} from '../../../core/services/notification-service';
import { ItemService } from '../../../core/services/item-service';
import { AuthService } from '../../../core/auth/auth-service';
import { ItemDetailModal } from '../../../modal/item-detail-modal/item-detail-modal';
import { ClaimFormModal } from '../../../modal/claim-form-modal/claim-form-modal';
import type { UserNotification } from '../../../models/notification-model';
import type { Report } from '../../../models/item-model';
import { Subscription, tap, catchError, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-notification-page',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe, ItemDetailModal, ClaimFormModal],
  templateUrl: './notification-page.html',
  styleUrl: './notification-page.scss',
})
export class NotificationPage implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private itemService = inject(ItemService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  private streamSub!: Subscription;
  private notificationSub!: Subscription;

  notifications: UserNotification[] = [];
  currentPage = 1;
  totalPages = 1;
  isLoading = false;

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
    let action$ = of(null);

    if (notification.status === 'unread') {
      action$ = this.notificationService.markAsRead(notification.notif_id).pipe(
        tap(() => {
          notification.status = 'read';
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

  // Placeholder handlers for modal outputs
  onViewTicket(): void {}
  onEdit(): void {}
  onDelete(): void {}
  onViewCode(): void {}
  onStatusChange(event: any): void {}
}