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
  ReportItemGrid
} from '../../../share-ui-blocks/report-item-grid/report-item-grid';
import { ItemService } from '../../../core/services/item-service';
import { AuthService } from '../../../core/auth/auth-service';
import type { Report, ReportFilters } from '../../../models/item-model';
import { StandardLocations, StandardRelativeDateFilters }
    from '../../../models/item-model';
import { CustomLocation } from '../../../modal/custom-location/custom-location';

type FilterType = 'all' | 'az' | 'date' | 'location';
type ActiveDropdown = 'date' | 'location' | null;
type ItemType = 'lost' | 'found';

@Component({
  selector: 'app-user-item-list-page',
  standalone: true,
  imports: [
    CommonModule,
    SearchBarComponent,
    ReportItemGrid,
    CustomLocation,
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

  @HostBinding('class.theme-lost') get isLost(): boolean {
    return this.itemType() === 'lost';
  }
  @HostBinding('class.theme-found') get isFound(): boolean {
    return this.itemType() === 'found';
  }

  activeFilter = signal<FilterType>('all');
  activeDropdown = signal<ActiveDropdown>(null);
  showCustomDateModal = signal(false);
  showCustomLocationModal = signal(false);
  showResolved = signal(false);

  selectedDateFilter = signal<string>('Any time');
  selectedLocationFilter = signal<string>('Any Location');

  readonly locationFilters: string[] = [
    'Any Location',
    ...Object.values(StandardLocations) as string[],
  ];

  allReports = signal<Report[]>([]);
  
  isLoading = signal(true);
  error = signal<string | null>(null);

  filters = signal<ReportFilters>({ 
      type: 'found',
      location: undefined, 
      status: 'approved',
  });

  constructor() {
    this.route.data
      .pipe(map((data) => data['itemType'] as ItemType))
      .subscribe((type: ItemType) => {
        this.itemType.set(type);

        this.filters.set({
          type: type,
          status: 'approved',
          location: undefined,
        });
        
        this.selectedDateFilter.set('Any time');
        this.selectedLocationFilter.set('Any Location');
        this.showResolved.set(false);
        
        this.fetchReports();
      });
  }

  visibleReports = computed(() => {
    const reports = this.allReports();
    const dateFilter = this.selectedDateFilter();

    if (dateFilter === 'Any time') {
        return reports;
    }

    const cutoffTime = this.getCutoffTime(dateFilter);
    return reports.filter(report => {
        const reportTime = new Date(report.date_reported).getTime();
        return reportTime >= cutoffTime;
    });
  });

  private getCutoffTime(filter: string): number {
    const now = new Date().getTime();
    const MS_IN_HOUR = 60 * 60 * 1000;
    const MS_IN_DAY = 24 * MS_IN_HOUR;

    switch (filter) {
        case 'Past hour':
            return now - (1 * MS_IN_HOUR);
        case 'Past 24 hours':
            return now - (24 * MS_IN_HOUR);
        case 'Past week':
            return now - (7 * MS_IN_DAY);
        case 'Past month':
            return now - (30 * MS_IN_DAY);
        case 'Past year':
            return now - (365 * MS_IN_DAY);
        default:
            return 0;
    }
  }

  readonly availableDateFilters = computed<string[]>(() => {
    const reports = this.allReports();
    const dynamicFilters: string[] = [];

    for (const filter of StandardRelativeDateFilters) {
        const cutoffTime = this.getCutoffTime(filter);
        const hasItems = reports.some((report: Report) => {
            const reportTime = new Date(report.date_reported).getTime();
            return reportTime >= cutoffTime;
        });

        if (hasItems) {
            dynamicFilters.push(filter);
        }
    }
    return ['Any time', ...dynamicFilters];
  });

  readonly dateFilters = this.availableDateFilters;


  toggleStatus(showResolved: boolean): void {
    this.showResolved.set(showResolved);
    const type = this.itemType();

    let statusFilter: ReportFilters['status'];

    if (type === 'found') {
      statusFilter = showResolved ? 'claimed' : 'approved';
    } else {
      statusFilter = showResolved ? 'matched' : 'approved'; 
    }

    this.filters.update(currentFilters => ({
        ...currentFilters, status: statusFilter
    }));

    this.fetchReports();
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
    } else {
      this.selectedDateFilter.set(filter);
    }
    this.activeDropdown.set(null);
  }

  selectLocationFilter(filter: string): void {
    this.activeFilter.set('location');
    this.activeDropdown.set(null);

    if (filter === StandardLocations.OTHERS) {
      this.showCustomLocationModal.set(true);
      return;
    }

    this.selectedLocationFilter.set(filter);

    const locationValue: string | undefined =
        filter === 'Any Location' ? undefined : filter;

    this.filters.update(current => ({ ...current, location: locationValue }));
    this.fetchReports();
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