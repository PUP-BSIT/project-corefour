import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportItemGrid } from
  '../../../share-ui-blocks/report-item-grid/report-item-grid';
import { SearchBarComponent } from
  '../../../share-ui-blocks/search-bar/search-bar';
import { Report, ReportFilters } from '../../../models/item-model';
import { ReportDetailModal } from
  '../../../modal/report-detail-modal/report-detail-modal';
import { ItemService } from '../../../core/services/item-service';
import { tap, catchError, of } from 'rxjs';

type SortOption = 'all' | 'az' | 'date';
type LostReportStatusFilter =
  | 'All Statuses'
  | 'pending'
  | 'approved'
  | 'matched'
  | 'rejected';

@Component({
  selector: 'app-lost-status-page',
  standalone: true,
  imports: [CommonModule,
            ReportItemGrid,
            SearchBarComponent,
            ReportDetailModal],
  templateUrl: './lost-status-page.html',
  styleUrls: ['./lost-status-page.scss'],
})
export class LostStatusPage implements OnInit {
  private itemService = inject(ItemService); 
  
  protected selectedReport = signal<Report | null>(null);
  protected reports = signal<Report[]>([]);
  protected isLoading = signal(true); 
  protected isError = signal(false);

  private currentSearchQuery = signal<string>(''); 
  protected currentSort = signal<SortOption>('date'); 
  protected currentStatusFilter = signal<LostReportStatusFilter>('All Statuses');
  
  protected readonly statusFilters: LostReportStatusFilter[] = [
    'All Statuses',
    'pending',
    'approved',
    'matched',
    'rejected',
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
    this.fetchReports();
  }

  private fetchReports(): void {
    this.isLoading.set(true);
    this.isError.set(false);
    this.reports.set([]); 

    const query = this.currentSearchQuery();
    const selectedStatus = this.currentStatusFilter();

    const filters: ReportFilters = {
        type: 'lost',
        status: selectedStatus === 'All Statuses' 
          ? undefined 
          : (selectedStatus as ReportFilters['status']),
        query: query || undefined,
    };

    this.itemService.getReports(filters).pipe(
      tap((data: Report[]) => {
        const finalReports = data.sort((reportA, reportB) =>
          (Date.parse(reportB.date_reported || '') || 0) -
          (Date.parse(reportA.date_reported || '') || 0)
        );

        this.reports.set(finalReports);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isError.set(true);
        this.isLoading.set(false);
        console.error('Error fetching admin reports:', err);
        return of([]);
      })
    ).subscribe();
  }

  protected setStatusFilter(status: string): void {
    this.currentStatusFilter.set(status as LostReportStatusFilter);
    this.fetchReports();
  }

  onSearchSubmit(query: string): void {
    const trimmedQuery = query.trim();

    if (this.currentSearchQuery() === trimmedQuery) return;
    
    this.currentSearchQuery.set(trimmedQuery);
    this.currentSort.set('date'); 

    this.fetchReports(); 
  }

  protected setSort(option: SortOption): void {
    if (option === 'all') {
        this.currentStatusFilter.set('All Statuses');
        this.currentSort.set('all');
        this.fetchReports();
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
    this.fetchReports(); 
    this.onCloseDetailView(); 
  }
}