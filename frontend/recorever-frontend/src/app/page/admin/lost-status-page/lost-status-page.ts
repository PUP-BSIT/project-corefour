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
import { CommonModule } from '@angular/common';
import {
  ReportItemGrid 
} from '../../../share-ui-blocks/report-item-grid/report-item-grid';
import {
  SearchBarComponent
} from '../../../share-ui-blocks/search-bar/search-bar';
import {
  Report,
  ReportFilters,
  PaginatedResponse,
  StandardLocations
} from '../../../models/item-model';
import { ItemService } from '../../../core/services/item-service';
import {
  tap,
  catchError,
  of,
  switchMap,
  takeUntil,
  Subject,
  BehaviorSubject
} from 'rxjs';
import {
  ItemDetailModal
} from "../../../modal/item-detail-modal/item-detail-modal";
import { environment } from '../../../../environments/environment';
import { AdminService } from '../../../core/services/admin-service';
import { Filter, FilterState } from '../../../share-ui-blocks/filter/filter';

type LostReportStatusFilter = 'All Statuses' | 'pending' 
      | 'approved' | 'matched' | 'rejected';

@Component({
  selector: 'app-lost-status-page',
  standalone: true,
  imports: [
    CommonModule,
    ReportItemGrid,
    SearchBarComponent,
    ItemDetailModal,
    Filter],
  templateUrl: './lost-status-page.html',
  styleUrls: ['./lost-status-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LostStatusPage implements OnInit, AfterViewInit, OnDestroy {
  private itemService = inject(ItemService);
  private adminService = inject(AdminService);
  private destroy$ = new Subject<void>();
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  private observer!: IntersectionObserver;

  protected currentUserId = signal<number | null>(null);
  protected currentPage = signal(1);
  protected totalPages = signal(1);
  protected pageSize = signal(10);

  protected selectedReport = signal<Report | null>(null);
  protected reports = signal<Report[]>([]);
  protected isLoading = signal(true);
  protected isError = signal(false);

  private currentSearchQuery = signal<string>('');
  protected currentSort = signal<'newest' | 'oldest'>('newest');
  protected currentDateFilter = signal<Date | null>(null);
  protected currentLocationFilter = signal<string>('');
  protected currentStatusFilter = signal<LostReportStatusFilter>(
      'All Statuses');

  protected readonly statusFilters: LostReportStatusFilter[] = [
    'All Statuses', 'pending', 'approved', 'matched', 'rejected'
  ];

  public readonly locationFilters: string[] = [
    ...Object.values(StandardLocations) as string[],
  ];

  protected sortedReports = computed(() => {
    let data = [...this.reports()];
    const sortType = this.currentSort();
    const dateFilter = this.currentDateFilter();
    const locationFilter = this.currentLocationFilter();

    if (dateFilter) {
      const filterDateStr = dateFilter.toDateString();
      data = data.filter(r => new Date(r.date_reported || '')
          .toDateString() === filterDateStr);
    }

    if (locationFilter) {
      data = data.filter(r => 
        r.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    return data.sort((a, b) => {
      const dateA = Date.parse(a.date_reported || '') || 0;
      const dateB = Date.parse(b.date_reported || '') || 0;
      return sortType === 'newest' ? dateB - dateA : dateA - dateB;
    });
  });

  public onFilterChange(state: FilterState): void {
    this.currentSort.set(state.sort);
    this.currentDateFilter.set(state.date);
    this.currentLocationFilter.set(state.location);
  }

  ngOnInit(): void {
    this.refreshTrigger$.pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(() => {
        const filters: ReportFilters = {
          type: 'lost' as const,
          status: this.currentStatusFilter() === 'All Statuses'
              ? undefined : (this.currentStatusFilter() as any),
          query: this.currentSearchQuery() || undefined,
          page: this.currentPage(),
          size: this.pageSize()
        };

        return this.itemService.getReports(filters).pipe(
          catchError(() => {
            this.isError.set(true);
            return of({
                items: [],
                totalPages: 1,
                totalItems: 0,
                currentPage: 1 });
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((response: PaginatedResponse<Report>) => {
      this.reports.update(existing => 
        this.currentPage() === 1 ? response.items
            : [...existing, ...response.items]
      );
      this.totalPages.set(response.totalPages);
      this.isLoading.set(false);
      this.isError.set(false);
    });
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !this.isLoading()
            && this.currentPage() < this.totalPages()) {
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

  onViewDetails(report: Report): void {
    this.selectedReport.set(report);
  }
  public onCloseDetailView(): void {
    this.selectedReport.set(null);
  }
  onStatusUpdated(updatedReport: Report): void {
    this.resetAndReload();
    this.onCloseDetailView();
  }

  public onStatusUpdate(newStatus: string): void {
    const item = this.selectedReport();
    if (!item) return;
    this.adminService.updateReportStatus(item.report_id, newStatus).subscribe({
      next: () => this.onStatusUpdated(item),
      error: (err) => console.error('Failed to update status', err)
    });
  }
  public getUserProfilePicture(): string {
    const report = this.selectedReport();
    
    if (report?.reporter_profile_picture) {
      const baseUrl = environment.apiUrl.replace('http://', 'https://');
      const profilePic = report.reporter_profile_picture;
      
      return `${baseUrl}/image/download/${profilePic}`;
    }

    return 'assets/profile-avatar.png';
  }
}