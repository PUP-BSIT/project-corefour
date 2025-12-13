// app/page/admin/lost-status-page/lost-status-page.ts

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemsTableComponent } from
  './items-table-component/items-table-component';
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
            ItemsTableComponent,
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
        // Sort by Item Name A-Z
        return (a.item_name || '').localeCompare(b.item_name || '');
      }
      if (sortType === 'date') {
        // Sort by Date Reported (Newest first)
        return (Date.parse(b.date_reported || '') || 0) -
               (Date.parse(a.date_reported || '') || 0);
      }
      // 'all' uses the natural order (already newest first from fetchReports)
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
        status: selectedStatus !== 'All Statuses' ? selectedStatus : undefined,
        item_name: query || undefined,
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

  // This method is now unused due to HTML restructure, but kept for future feature scope if needed.
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

  // Update setSort to handle 'all' as a way to reset the status filter
  protected setSort(option: SortOption): void {
    if (option === 'all') {
        // When 'All' tab is clicked, reset sort to default date and reset status filter
        this.currentStatusFilter.set('All Statuses');
        this.currentSort.set('all'); // Set sort to 'all' (no internal sorting, uses natural fetched order)
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