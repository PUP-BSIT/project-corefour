import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ItemService } from '../../../core/services/item-service';
import { Report } from '../../../models/item-model';

import { 
  SearchBarComponent 
} from '../../../share-ui-blocks/search-bar/search-bar';
import { 
  ClaimFormModal 
} from '../../../modal/claim-form-modal/claim-form-modal';

type SortOption = 'all' | 'az' | 'date';
type StatusFilter = 'All Statuses' | 'pending' | 'approved' | 'claimed' | 'rejected';

@Component({
  selector: 'app-claim-status-page',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    SearchBarComponent, 
    DatePipe, 
    ClaimFormModal
  ],
  templateUrl: './claim-status-page.html',
  styleUrl: './claim-status-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimStatusPage implements OnInit {
  private itemService = inject(ItemService);

  protected reports = signal<Report[]>([]);
  protected searchQuery = signal(''); 
  protected currentSort = signal<SortOption>('all');
  protected currentStatusFilter = signal<StatusFilter>('All Statuses');
  protected isLoading = signal(true);
  
  protected selectedReport = signal<Report | null>(null);

  protected readonly statusFilters: StatusFilter[] = ['All Statuses', 'pending', 'approved', 'claimed', 'rejected'];

  protected filteredReports = computed(() => {
    let data = this.reports();
    const query = this.searchQuery().toLowerCase();
    const status = this.currentStatusFilter();
    const sortType = this.currentSort();

    if (status !== 'All Statuses') {
      data = data.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }

    if (query) {
      data = data.filter((r) =>
        (r.item_name || '').toLowerCase().includes(query) ||
        (r.surrender_code || '').toLowerCase().includes(query)
      );
    }

    return [...data].sort((a, b) => {
      if (sortType === 'az') {
        return (a.item_name || '').localeCompare(b.item_name || '');
      }
      if (sortType === 'date') {
        return new Date(b.date_reported).getTime() - 
               new Date(a.date_reported).getTime();
      }
      return 0;
    });
  });

  ngOnInit(): void {
    this.loadReports();
  }

  protected loadReports(): void {
    this.isLoading.set(true);
    this.itemService.getReports({ type: 'found' }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (data) => {
        this.reports.set(data);
      },
      error: (err) => {
        console.error('Failed to load reports', err);
      }
    });
  }

  protected setStatusFilter(status: string): void {
    this.currentStatusFilter.set(status as StatusFilter);
  }

  protected onSearch(query: string): void {
    this.searchQuery.set(query.trim());
  }

  protected setSort(option: SortOption): void {
    if (option === 'all') {
      this.currentStatusFilter.set('All Statuses');
    }
    this.currentSort.set(option);
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

  protected onStatusChanged(): void {
    this.loadReports();
  }
}