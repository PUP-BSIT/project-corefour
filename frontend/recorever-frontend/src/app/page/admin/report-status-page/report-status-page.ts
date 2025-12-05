import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemsTableComponent } from './items-table-component/items-table-component';
import { SearchBarComponent } from '../../../share-ui-blocks/search-bar/search-bar';
import { Report, ReportFilters } from '../../../models/item-model';
import { ReportDetailModal } from '../../../modal/report-detail-modal/report-detail-modal';
import { ItemService } from '../../../core/services/item-service';
import { tap, catchError, of, forkJoin, map } from 'rxjs'; 

@Component({
  selector: 'app-report-status-page',
  standalone: true,
  imports: [CommonModule, ItemsTableComponent, SearchBarComponent, ReportDetailModal],
  templateUrl: './report-status-page.html',
  styleUrls: ['./report-status-page.scss'],
})
export class ReportStatusPage implements OnInit {
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

    const combos: ReportFilters[] = [
      { type: 'lost', status: 'pending' },
      { type: 'found', status: 'pending' },
      { type: 'lost', status: 'approved' },
      { type: 'found', status: 'approved' },
      { type: 'lost', status: 'matched' },
      { type: 'found', status: 'matched' },
    ];

    const filtersWithQuery = combos.map(c => ({
        ...c,
        item_name: query 
    } as ReportFilters));

    const observables = filtersWithQuery.map(c =>
      this.itemService.getReports(c).pipe(catchError(() => of([] as Report[])))
    );

    forkJoin(observables).pipe(
      map(results => {
        const combined = results.flat();
        const unique = new Map<number, Report>();

        for (const report of combined) {
          if (!report || report.report_id == null) continue;
          unique.set(Number(report.report_id), report);
        }

        const finalReports = Array.from(unique.values()).filter(report =>
          report.status === 'pending' ||
          report.status === 'approved' ||
          report.status === 'matched'
        );

        return finalReports.sort((reportA, reportB) =>
          (Date.parse(reportB.date_reported || '') || 0) -
          (Date.parse(reportA.date_reported || '') || 0)
        );
      }),
      tap((data: Report[]) => {
        this.reports.set(data);
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
      console.log(`Report ${updatedReport.report_id} updated to ${updatedReport.status}. Re-fetching table data.`);

      this.fetchReports(); 
      this.onCloseDetailView(); 
  }
}