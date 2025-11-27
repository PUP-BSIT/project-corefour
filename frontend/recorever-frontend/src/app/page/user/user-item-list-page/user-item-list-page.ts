import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  computed,
  HostBinding,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import {
  SearchBarComponent
} from '../../../share-ui-blocks/search-bar/search-bar';
import {
  ReportButton,
  ReportButtonTheme,
} from './report-button/report-button';
import {
  ReportItemGrid
} from '../../../share-ui-blocks/report-item-grid/report-item-grid';
import { ItemService } from '../../../core/services/item-service';
import { AuthService } from '../../../core/auth/auth-service';
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
    ReportItemGrid,
  ],
  templateUrl: './user-item-list-page.html',
  styleUrl: './user-item-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserItemListPage {
  private itemService = inject(ItemService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  currentUser = toSignal(this.authService.currentUser$);
  currentUserId = computed(() => this.currentUser()?.user_id ?? null);

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
    'Any time',
    'Past hour',
    'Past 24 hours',
    'Past week',
    'Past month',
    'Past year',
  ];

  allReports = signal<Report[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  filters = signal<ReportFilters>({ type: 'found' });

  unresolvedReports = computed(() => {
    const type = this.itemType();
    return this.allReports().filter(
      (r) =>
        r.type === type && !['claimed', 'rejected'].includes(r.status)
    );
  });

  resolvedReports = computed(() => {
    const type = this.itemType();
    return this.allReports().filter(
      (r) =>
        r.type === type && ['claimed', 'rejected'].includes(r.status)
    );
  });

  constructor() {
    this.route.data
      .pipe(map((data) => data['itemType']))
      .subscribe((type) => {
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

    this.itemService
      .getReports({
        ...currentFilters,
        item_name: query || undefined,
      })
      .subscribe({
        next: (data: Report[]) => {
          this.allReports.set(data);
          this.isLoading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error fetching reports', err);
          this.error.set('Failed to load items. Please try again.');
          this.isLoading.set(false);
        },
      });
  }

  toggleDropdown(dropdown: ActiveDropdown): void {
    this.activeDropdown.set(
      this.activeDropdown() === dropdown ? null : dropdown
    );
  }

  selectDateFilter(filter: string): void {
    if (filter === 'Custom range...') {
      this.showCustomDateModal.set(true);
    }
    this.activeDropdown.set(null);
  }

  onSearchSubmit(query: string): void {
    this.fetchReports(query);
  }

  onTicketClick(item: Report): void {
    console.log('Ticket clicked for', item.report_id);
  }

  onEditClick(item: Report): void {
    console.log('Edit clicked for', item.report_id);
  }

  onDeleteClick(item: Report): void {
    console.log('Delete clicked for', item.report_id);
  }
}