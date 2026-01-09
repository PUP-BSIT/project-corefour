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
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { NotificationService } from '../../core/services/notification-service';
import { ItemService } from '../../core/services/item-service';
import { AuthService } from '../../core/auth/auth-service';
import { ToastService } from '../../core/services/toast-service';
import { ItemDetailModal } from '../../modal/item-detail-modal/item-detail-modal';
import { ClaimFormModal } from '../../modal/claim-form-modal/claim-form-modal';
import { CodesModal } from '../../modal/codes-modal/codes-modal'; // Import CodesModal
import type { UserNotification } from '../../models/notification-model';
import type { Report } from '../../models/item-model';
import { Subscription, tap, catchError, of, switchMap, filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MatchDetailModal } from '../../modal/match-detail-modal/match-detail-modal';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    TimeAgoPipe,
    ItemDetailModal,
    ClaimFormModal,
    MatButtonModule,
    MatchDetailModal,
    CodesModal
  ],
  templateUrl: './notification.html',
  styleUrl: './notification.scss',
})
export class Notification implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private itemService = inject(ItemService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private eRef = inject(ElementRef);

  private streamSub!: Subscription;
  private notificationSub!: Subscription;
  private routerSub!: Subscription;

  notifications: UserNotification[] = [];
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  isLoading = false;
  isDropdownOpen = false;
  unreadCount = 0;

  isOnNotificationPage = false;
  currentFilter: 'all' | 'unread' = 'all';
  isViewingDetails = false;
  showCodeModal = false;

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
    this.checkCurrentRoute();

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkCurrentRoute();
    });

    this.loadPage(1);
    this.initSseStream();
  }

  checkCurrentRoute(): void {
    this.isOnNotificationPage = this.router.url.includes('/notifications');
    if (this.isOnNotificationPage) {
      this.isDropdownOpen = false;
    }
    this.cdr.markForCheck();
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
    if (this.routerSub) this.routerSub.unsubscribe();
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
      .getNotifications(page, 5, this.currentFilter)
      .pipe(
        tap((response) => {
          if (page === 1) {
            this.notifications = response.items;
          } else {
            this.notifications = [...this.notifications, ...response.items];
          }

          this.currentPage = response.currentPage;
          this.totalPages = response.totalPages;
          this.totalItems = response.totalItems;
          this.unreadCount = response.unreadCount;

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

  setFilter(filter: 'all' | 'unread'): void {
    this.currentFilter = filter;
    this.loadPage(1);
  }

  toggleDropdown(): void {
    if (this.isOnNotificationPage) {
      return;
    }

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      this.navigateToNotificationsPage();
    } else {
      this.isDropdownOpen = !this.isDropdownOpen;
      if (this.isDropdownOpen) {
        this.loadPage(1);
      }
    }
  }

  onSeeAll(): void {
    this.navigateToNotificationsPage();
    this.isDropdownOpen = false;
  }

  private navigateToNotificationsPage(): void {
    const prefix = this.isAdmin() ? 'admin' : 'app';
    this.router.navigate([`/${prefix}/notifications`]);
  }

  onViewMore(): void {
    this.loadPage(this.currentPage + 1);
  }

  onMarkAllRead(event: Event): void {
    event.stopPropagation();
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
    this.isDropdownOpen = false;
    let action$ = of(null);

    if (notification.status === 'unread') {
      action$ = this.notificationService.markAsRead(notification.notif_id).pipe(
        tap(() => {
          notification.status = 'read';
          this.unreadCount = Math.max(0, this.unreadCount - 1);
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

  onViewMatchDetails(): void {
    this.isViewingDetails = true;
  }

  onModalClose(): void {
    if (this.isViewingDetails) {
      this.isViewingDetails = false;
    } else {
      this.selectedReport.set(null);
    }
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

  onViewCode(): void {
    this.showCodeModal = true;
  }

  onStatusChange(event: any): void {}

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent) {
    const width = (event.target as Window).innerWidth;

    if (width < 768 && this.isDropdownOpen) {
      this.isDropdownOpen = false;
      this.navigateToNotificationsPage();
      this.cdr.markForCheck();
    }
  }
}