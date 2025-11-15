import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  computed,
  HostBinding,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { SearchBarComponent } from '../../../share-ui-blocks/search-bar/search-bar';
import {
  ReportButton,
  ReportButtonTheme,
} from './report-button/report-button';
import { ReportItemCard } from '../../../share-ui-blocks/report-item-grid/report-item-card/report-item-card';
import { ItemService } from '../../../core/services/item-service';
import type { Report, ReportFilters } from '../../../models/item-model';

type FilterType = 'all' | 'az' | 'date' | 'location';
type ActiveDropdown = 'date' | 'location' | null;
type ItemType = 'lost' | 'found';

@Component({
  selector: 'app-user-item-list-page',
  standalone: true,
  imports: [
    CommonModule,
    SearchBarComponent,
    ReportButton,
    ReportItemCard,
  ],
  templateUrl: './user-item-list-page.html',
  styleUrl: './user-item-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserItemListPage {
  private itemService = inject(ItemService);
  private route = inject(ActivatedRoute);

  itemType = signal<ItemType>('lost');
  pageTitle = computed(() =>
    this.itemType() === 'lost' ? 'Lost Items' : 'Found Items'
  );
  reportButtonTheme = computed<ReportButtonTheme>(() => this.itemType());

  @HostBinding('class.theme-lost') get isLost() {
    return this.itemType() === 'lost';
  }
  @HostBinding('class.theme-found') get isFound() {
    return this.itemType() === 'found';
  }

  activeFilter = signal<FilterType>('all');
  activeDropdown = signal<ActiveDropdown>(null);
  showCustomDateModal = signal(false);
  showResolved = signal(false);
  readonly dateFilters = [
    'Any time', 'Past hour', 'Past 24 hours',
    'Past week', 'Past month', 'Past year',
  ];

  allReports = signal<Report[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  filters = signal<ReportFilters>({ type: 'found' });

  unresolvedReports = computed(() =>
    this.allReports().filter((r) => !['claimed', 'rejected'].includes(r.status))
  );
  resolvedReports = computed(() =>
    this.allReports().filter((r) => ['claimed', 'rejected'].includes(r.status))
  );

  constructor() {
    this.route.data.pipe(map((data) => data['itemType'])).subscribe((type) => {
      this.itemType.set(type);
      this.filters.set({
        type: type,
        status: type === 'found' ? 'approved' : undefined,
      });
      this.fetchReports();
    });
  }

  fetchReports(query?: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    const currentFilters = this.filters();
    
    this.itemService.getReports({
      ...currentFilters,
      item_name: query || undefined,
    }).subscribe({
      next: (data: Report[]) => {
        this.allReports.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set('Failed to load items. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  toggleDropdown(dropdown: ActiveDropdown): void {
    this.activeDropdown.set(this.activeDropdown() === dropdown ? null : dropdown);
  }

  selectDateFilter(filter: string): void {
    if (filter === 'Custom range...') {
      this.showCustomDateModal.set(true);
    } else {
      // TODO(Durante): Implement date filter logic
    }
    this.activeDropdown.set(null);
  }

  onSearchSubmit(query: string): void {
    this.fetchReports(query);
  }
}