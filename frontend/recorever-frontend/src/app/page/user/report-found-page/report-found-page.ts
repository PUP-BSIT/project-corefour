import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  EffectRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { SearchBarComponent } from '../../../share-ui-blocks/search-bar/search-bar';
import { ReportButton } from '../user-item-list-page/report-button/report-button';
import { ReportItemCard } from '../../../share-ui-blocks/report-item-grid/report-item-card/report-item-card';
import { ItemService } from '../../../core/services/item-service';
import type { Report, ReportFilters } from '../../../models/item-model';

type FilterType = 'all' | 'az' | 'date' | 'location';

@Component({
  selector: 'app-report-found-page',
  standalone: true,
  imports: [
    CommonModule,
    SearchBarComponent,
    ReportButton,
    ReportItemCard,
  ],
  templateUrl: './report-found-page.html',
  styleUrl: './report-found-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportFoundPage {
  private itemService = inject(ItemService);

  activeFilter = signal<FilterType>('all');
  reports = signal<Report[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  filters = signal<ReportFilters>({ type: 'found', status: 'approved' });

  private fetchEffect: EffectRef = effect(() => {
    this.fetchReports(this.filters());
  });

  fetchReports(filters: ReportFilters): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.itemService.getReports(filters).subscribe({
      next: (data: Report[]) => {
        this.reports.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to fetch reports:', err);
        this.error.set('Failed to load items. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  selectFilter(filter: FilterType): void {
    this.activeFilter.set(filter);
    // TODO: Implement sorting/filtering logic
  }

  onSearchSubmit(query: string): void {
    this.filters.update((current) => ({
      ...current,
      item_name: query || undefined,
    }));
  }
}