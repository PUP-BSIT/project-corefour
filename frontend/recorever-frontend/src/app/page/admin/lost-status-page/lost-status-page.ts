import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemsTableComponent }
    from './items-table-component/items-table-component';
import { SearchBarComponent }
    from '../../../share-ui-blocks/search-bar/search-bar';
import { Report, ReportFilters } from '../../../models/item-model';
import { ReportDetailModal }
    from '../../../modal/report-detail-modal/report-detail-modal';
import { ItemService } from '../../../core/services/item-service';
import { tap, catchError, of } from 'rxjs'; 

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

  ngOnInit(): void {
    this.fetchReports();
  }

  private fetchReports(): void {
    this.isLoading.set(true);
    this.isError.set(false);
    this.reports.set([]); 

    const query = this.currentSearchQuery();

    const filters: ReportFilters = {
        type: 'lost',
        status: undefined,
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

  onSearchSubmit(query: string): void {
    const trimmedQuery = query.trim();

    if (this.currentSearchQuery() === trimmedQuery) return;
    
    this.currentSearchQuery.set(trimmedQuery);

    this.fetchReports(); 
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