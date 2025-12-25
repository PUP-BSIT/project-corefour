import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReportItemGrid } from '../../../share-ui-blocks/report-item-grid/report-item-grid';
import { SearchBarComponent } from '../../../share-ui-blocks/search-bar/search-bar';
import { Report, ReportFilters, PaginatedResponse } from '../../../models/item-model';
import { ReportDetailModal } from '../../../modal/report-detail-modal/report-detail-modal';
import { ItemService } from '../../../core/services/item-service';
import { tap, catchError, of, switchMap, takeUntil, Subject, BehaviorSubject } from 'rxjs';

type SortOption = 'all' | 'az' | 'date';
type LostReportStatusFilter = 'All Statuses' | 'pending' | 'approved' | 'matched' | 'rejected';

@Component({
  selector: 'app-lost-status-page',
  standalone: true,
  imports: [CommonModule, ReportItemGrid, SearchBarComponent, ReportDetailModal],
  templateUrl: './lost-status-page.html',
  styleUrls: ['./lost-status-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LostStatusPage implements OnInit, AfterViewInit, OnDestroy {
  private itemService = inject(ItemService);
  private destroy$ = new Subject<void>();
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  private observer!: IntersectionObserver;
  protected currentPage = signal(1);
  protected totalPages = signal(1);
  protected pageSize = signal(10);

  protected selectedReport = signal<Report | null>(null);
  protected reports = signal<Report[]>([]);
  protected isLoading = signal(true);
  protected isError = signal(false);

  private currentSearchQuery = signal<string>('');
  protected currentSort = signal<SortOption>('date');
  protected currentStatusFilter = signal<LostReportStatusFilter>('All Statuses');

  protected readonly statusFilters: LostReportStatusFilter[] = [
    'All Statuses', 'pending', 'approved', 'matched', 'rejected'
  ];

  protected sortedReports = computed(() => {
    let data = this.reports();
    const sortType = this.currentSort();

    return [...data].sort((a, b) => {
      if (sortType === 'az') {
        return (a.item_name || '').localeCompare(b.item_name || '');
      }
      if (sortType === 'date') {
        return (Date.parse(b.date_reported || '') || 0) -
               (Date.parse(a.date_reported || '') || 0);
      }
      return 0;
    });
  });

  ngOnInit(): void {
    this.refreshTrigger$.pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(() => {
        const filters: ReportFilters = {
          type: 'lost' as const,
          status: this.currentStatusFilter() === 'All Statuses' ? undefined : (this.currentStatusFilter() as any),
          query: this.currentSearchQuery() || undefined,
          page: this.currentPage(),
          size: this.pageSize()
        };

        return this.itemService.getReports(filters).pipe(
          catchError(err => {
            this.isError.set(true);
            return of({ items: [], totalPages: 1, totalItems: 0, currentPage: 1 });
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((response: PaginatedResponse<Report>) => {
      this.reports.update(existing => 
        this.currentPage() === 1 ? response.items : [...existing, ...response.items]
      );
      this.totalPages.set(response.totalPages);
      this.isLoading.set(false);
      this.isError.set(false);
    });
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !this.isLoading() && this.currentPage() < this.totalPages()) {
        this.currentPage.update(p => p + 1);
        this.refreshTrigger$.next();
      }
    }, { rootMargin: '150px' });
    this.observer.observe(this.scrollAnchor.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected setStatusFilter(status: string): void {
    this.currentStatusFilter.set(status as LostReportStatusFilter);
    this.resetAndReload();
  }

  onSearchSubmit(query: string): void {
    const trimmedQuery = query.trim();
    if (this.currentSearchQuery() === trimmedQuery) return;
    this.currentSearchQuery.set(trimmedQuery);
    this.resetAndReload();
  }

  private resetAndReload(): void {
    this.currentPage.set(1);
    this.reports.set([]);
    this.refreshTrigger$.next();
  }

  protected setSort(option: SortOption): void {
    if (option === 'all') {
      this.currentStatusFilter.set('All Statuses');
      this.resetAndReload();
      return;
    }
    this.currentSort.set(option);
  }

  onViewDetails(report: Report): void {
    this.selectedReport.set(report);
  }
  onCloseDetailView(): void {
    this.selectedReport.set(null);
  }
  onStatusUpdated(updatedReport: Report): void {
    this.resetAndReload();
    this.onCloseDetailView();
  }
}