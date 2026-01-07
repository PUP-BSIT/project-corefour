import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
  ElementRef,
  HostListener,
  signal,
  computed
} from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { NotificationService } from '../../core/services/notification-service';
import { ItemService } from '../../core/services/item-service';
import { AuthService } from '../../core/auth/auth-service';
import { ItemDetailModal } from '../../modal/item-detail-modal/item-detail-modal';
import { ClaimFormModal } from '../../modal/claim-form-modal/claim-form-modal';
import type { UserNotification } from '../../models/notification-model';
import type { Report } from '../../models/item-model';
import { Subscription, tap, catchError, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [TimeAgoPipe, ItemDetailModal, ClaimFormModal],
  templateUrl: './notification.html',
  styleUrl: './notification.scss',
})
export class Notification implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private itemService = inject(ItemService);
  private authService = inject(AuthService);
  private router = inject(Router);
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

  selectedReport = signal<Report | null>(null);
  currentUser = toSignal(this.authService.currentUser$);

  currentUserId = computed(() => this.currentUser()?.user_id ?? null);
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

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
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      const role = this.isAdmin() ? 'admin' : 'user';
      this.router.navigate([`/${role}/notifications`]);
    } else {
      this.isDropdownOpen = !this.isDropdownOpen;
      if (this.isDropdownOpen) {
        this.loadPage(1);
      }
    }
  }

  onViewMore(): void {
    this.loadPage(this.currentPage + 1);
  }

  onNotificationClick(notification: UserNotification): void {
    let action$ = of(null);

    if (notification.status === 'unread') {
      action$ = this.notificationService.markAsRead(notification.notif_id).pipe(
        tap(() => {
          notification.status = 'read';
          this.hasUnreadNotifications = this.notifications
            .some(n => n.status === 'unread');
        })
      );
    }

    action$.pipe(
      switchMap(() => this.itemService.getReportById(notification.report_id)),
      tap((report) => {
        this.selectedReport.set(report);
        this.isDropdownOpen = false;
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

  onViewTicket(): void {}
  onEdit(): void {}
  onDelete(): void {}
  onViewCode(): void {}
  onStatusChange(event: any): void {}

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent) {
    const width = (event.target as Window).innerWidth;

    if (width < 768 && this.isDropdownOpen) {
      this.isDropdownOpen = false;
      const role = this.isAdmin() ? 'admin' : 'user';
      this.router.navigate([`/${role}/notifications`]);
      this.cdr.markForCheck();
    }
  }
}