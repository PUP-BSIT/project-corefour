import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  catchError,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';
import { Subject, BehaviorSubject, of } from 'rxjs';

import { ItemService } from '../../../core/services/item-service';
import { AuthService } from '../../../core/auth/auth-service';
import { ToastService } from '../../../core/services/toast-service';

import { Report, ReportFilters } from '../../../models/item-model';

import {
  SearchBarComponent
} from '../../../share-ui-blocks/search-bar/search-bar';
import {
  ReportItemGrid
} from '../../../share-ui-blocks/report-item-grid/report-item-grid';
import {
  ClaimFormModal
} from '../../../modal/claim-form-modal/claim-form-modal';
import {
  Filter,
  FilterState
} from '../../../share-ui-blocks/filter/filter';

type StatusFilter = 'All Statuses' | 'pending' | 'approved' | 'rejected';

@Component({
  selector: 'app-claim-status-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SearchBarComponent,
    ClaimFormModal,
    ReportItemGrid,
    Filter
  ],
  templateUrl: './claim-status-page.html',
  styleUrl: './claim-status-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimStatusPage implements OnInit, AfterViewInit, OnDestroy {
  private itemService = inject(ItemService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  private destroy$ = new Subject<void>();
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  private observer!: IntersectionObserver;
  protected currentPage = signal(1);
  protected totalPages = signal(1);
  protected pageSize = signal(10);

  protected reports = signal<Report[]>([]);
  protected searchQuery = signal('');
  protected currentStatusFilter = signal<StatusFilter>('All Statuses');
  protected isLoading = signal(true);

  protected currentFilter = signal<FilterState>({
    sort: 'newest',
    date: null,
    location: ''
  });

  protected selectedReport = signal<Report | null>(null);

  protected readonly statusFilters: StatusFilter[] = [
      'All Statuses', 'pending', 'approved', 'rejected'];

  protected isAdmin = computed(() => {
    const user = this.authService.currentUserValue;
    return user?.role === 'admin';
  });

  protected locations = computed(() => {
    const locs = this.reports()
      .map(r => r.location)
      .filter(l => !!l);
    return [...new Set(locs)] as string[];
  });

  protected filteredReports = computed(() => {
    let data = this.reports();
    const query = this.searchQuery().toLowerCase();
    const status = this.currentStatusFilter();
    const filter = this.currentFilter();

    data = data.filter(r => r.status.toLowerCase() !== 'claimed');

    if (status !== 'All Statuses') {
      data = data.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }

    if (query) {
      data = data.filter((r) =>
        (r.item_name || '').toLowerCase().includes(query) ||
        (r.surrender_code || '').toLowerCase().includes(query)
      );
    }

    if (filter.location) {
      const locTerm = filter.location.toLowerCase();
      data = data.filter(r =>
        (r.location || '').toLowerCase().includes(locTerm)
      );
    }

    if (filter.date) {
      const filterDate = new Date(filter.date).setHours(0, 0, 0, 0);
      data = data.filter(r => {
        const reportDate = new Date(r.date_reported).setHours(0, 0, 0, 0);
        return reportDate === filterDate;
      });
    }

    return [...data].sort((a, b) => {
      const dateA = new Date(a.date_reported).getTime();
      const dateB = new Date(b.date_reported).getTime();

      if (filter.sort === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });
  });

  ngOnInit(): void {
    this.refreshTrigger$.pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(() => {
        const filters: ReportFilters = {
          type: 'found' as const,
          status: this.currentStatusFilter() ===
              'All Statuses' ? undefined : this.currentStatusFilter() as any,
          query: this.searchQuery(),
          page: this.currentPage(),
          size: this.pageSize()
        };

        return this.itemService.getReports(filters).pipe(
          catchError(() => of({ items: [], totalPages: 1, totalItems: 0 }))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(response => {
      this.reports.update(existing =>
        this.currentPage() === 1 ? response.items :
            [...existing, ...response.items]
      );
      this.totalPages.set(response.totalPages);
      this.isLoading.set(false);
    });
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !this.isLoading() &&
          this.currentPage() < this.totalPages()) {
        this.currentPage.update(p => p + 1);
        this.refreshTrigger$.next();
      }
    }, { rootMargin: '100px' });
    this.observer.observe(this.scrollAnchor.nativeElement);
  }

  protected setStatusFilter(status: string): void {
    this.currentStatusFilter.set(status as StatusFilter);
    this.resetPagination();
  }

  protected onSearch(query: string): void {
    this.searchQuery.set(query.trim());
    this.resetPagination();
  }

  protected onFilterChange(state: FilterState): void {
    this.currentFilter.set(state);
  }

  private resetPagination(): void {
    this.currentPage.set(1);
    this.reports.set([]);
    this.refreshTrigger$.next();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onViewDetails(reportId: number): void {
    const report = this.reports().find(r => r.report_id === reportId);
    if (report) {
      this.selectedReport.set(report);
    }
  }

  protected onCloseModal(): void {
    this.selectedReport.set(null);
  }

  protected onStatusChanged(newStatus: string): void {
    this.resetPagination();
    this.onCloseModal();

    let message = '';
    let actionLabel = '';
    let actionRoute = '';

    switch (newStatus.toLowerCase()) {
      case 'claimed':
        message = 'Item successfully marked as Claimed';
        actionLabel = 'View Archive';
        actionRoute = '/admin/archive/claimed';
        break;
      case 'approved':
        message = 'Item status updated to Verified';
        break;
      case 'rejected':
        message = 'Item status updated to Denied';
        break;
      default:
        message = 'Status updated successfully';
    }

    this.toast.showSuccess(message, actionLabel, actionRoute);
  }
}