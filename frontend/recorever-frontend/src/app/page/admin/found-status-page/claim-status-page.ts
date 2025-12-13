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
  protected isLoading = signal(true);
  
  protected selectedReport = signal<Report | null>(null);

  protected filteredReports = computed(() => {
    let data = this.reports();
    const query = this.searchQuery().toLowerCase();
    const sortType = this.currentSort();

    if (query) {
      data = data.filter((report) =>
        (report.item_name || '').toLowerCase().includes(query) ||
        (report.surrender_code || '').toLowerCase().includes(query) ||
        (report.description || '').toLowerCase().includes(query)
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

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  protected setSort(option: SortOption): void {
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