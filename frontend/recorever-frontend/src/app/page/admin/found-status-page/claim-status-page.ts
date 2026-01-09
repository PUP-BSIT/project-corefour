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
import { RouterModule, Params, ActivatedRoute } from '@angular/router';
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

import {
  Report,
  ReportFilters,
  ReportStatus,
  PaginatedResponse
} from '../../../models/item-model';

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
  private route = inject(ActivatedRoute);

  private destroy$ = new Subject<void>();
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);
  private reportCache = new Map<string, PaginatedResponse<Report>>();

  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  private observer!: IntersectionObserver;

  protected currentPage = signal(1);
  protected totalPages = signal(1);
  protected pageSize = signal(10);
  protected searchQuery = signal('');
  protected isLoading = signal(true);

  protected reports = signal<Report[]>([]);
  protected selectedReport = signal<Report | null>(null);

  protected currentStatusFilter = signal<StatusFilter>('All Statuses');
  protected highlightId = signal<number | null>(null);

  protected currentFilter = signal<FilterState>({
    sort: 'newest',
    date: null,
    location: ''
  });

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
    let data = this.reports().filter(r => r.status !== 'claimed');
    
    const filter = this.currentFilter();

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
      const hId = this.highlightId();
      if (hId) {
        if (a.report_id === hId) return -1;
        if (b.report_id === hId) return 1;
      }

      const dateA = new Date(a.date_reported).getTime();
      const dateB = new Date(b.date_reported).getTime();

      return filter.sort === 'newest' ? dateB - dateA : dateA - dateB;
    });
  });

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params: Params) => {
        const hId = params['highlightId'];
        this.highlightId.set(hId ? Number(hId) : null);
      });

    this.refreshTrigger$.pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(() => {
        const currentStatus = this.currentStatusFilter();
        const statusParam: ReportStatus | undefined =
            currentStatus === 'All Statuses' ? undefined :
                (currentStatus as unknown as ReportStatus);

        const filters: ReportFilters = {
          type: 'found' as const,
          status: statusParam,
          query: this.searchQuery(),
          page: this.currentPage(),
          size: this.pageSize()
        };

        const cacheKey = JSON.stringify(filters);

        if (this.reportCache.has(cacheKey)) {
          return of(this.reportCache.get(cacheKey)!);
        }

        return this.itemService.getReports(filters).pipe(
          tap((response) => this.reportCache.set(cacheKey, response)),
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
    const report = this.selectedReport();

    this.reportCache.clear();
    this.resetPagination();
    this.onCloseModal();

    let message = '';
    let actionLabel = '';
    let actionRoute = '';
    let queryParams: Params | undefined = undefined;

    switch (newStatus.toLowerCase()) {
      case 'claimed':
        message = 'Item successfully marked as Claimed';
        actionLabel = 'View Archive';
        actionRoute = '/admin/archive/claimed';
        if (report) {
          queryParams = { highlightId: report.report_id };
        }
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

    this.toast.showSuccess(message, actionLabel, actionRoute, queryParams);
  }
}