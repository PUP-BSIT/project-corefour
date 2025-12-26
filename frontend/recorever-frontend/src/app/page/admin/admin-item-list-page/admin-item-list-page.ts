import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  HostBinding
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Data } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, tap, BehaviorSubject, takeUntil, Subject, combineLatest, finalize } from 'rxjs';

import {
  ReportItemGrid
} from '../../../share-ui-blocks/report-item-grid/report-item-grid';
import {
  SearchBarComponent
} from '../../../share-ui-blocks/search-bar/search-bar';
import { ItemService } from '../../../core/services/item-service';
import { AuthService } from '../../../core/auth/auth-service';
import { AdminService } from '../../../core/services/admin-service';
import {
  ItemDetailModal
} from '../../../modal/item-detail-modal/item-detail-modal';
import { CodesModal } from '../../../modal/codes-modal/codes-modal';
import {
  UnarchiveConfirmationModal
} from '../../../modal/unarchive-confirmation-modal/unarchive-confirmation-modal';
import {
  CustomLocation
} from '../../../modal/custom-location/custom-location';
import {
  DateRangeModal
} from '../../../modal/date-range-modal/date-range-modal';

import type {
  Report,
  ReportFilters
} from '../../../models/item-model';
import {
  StandardRelativeDateFilters
} from '../../../models/item-model';

type FilterType = 'all' | 'az' | 'za' | 'date' | 'location';
type ActiveDropdown = 'date' | 'location' | null;
type ItemType = 'lost' | 'found';

@Component({
  selector: 'app-admin-item-list-page',
  standalone: true,
  imports: [
    CommonModule,
    ReportItemGrid,
    SearchBarComponent,
    ItemDetailModal,
    CodesModal,
    UnarchiveConfirmationModal,
    CustomLocation,
    DateRangeModal
  ],
  templateUrl: './admin-item-list-page.html',
  styleUrl: './admin-item-list-page.scss',
})
export class AdminItemListPage implements OnInit {
  private route = inject(ActivatedRoute);
  private itemService = inject(ItemService);
  private authService = inject(AuthService);
  private adminService = inject(AdminService);

  private destroy$ = new Subject<void>();

  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalPages = signal<number>(1);
  totalItems = signal<number>(0);

  currentUser = toSignal(this.authService.currentUser$);
  currentUserId = computed<number | null>(
      () => this.currentUser()?.user_id ?? null
  );

  itemType = signal<ItemType>('lost');

  @HostBinding('class.theme-lost') get isLost(): boolean {
    return this.itemType() === 'lost';
  }
  @HostBinding('class.theme-found') get isFound(): boolean {
    return this.itemType() === 'found';
  }

  allReports = signal<Report[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  pageTitle = signal<string>('Admin Item List');
  isArchiveView = signal<boolean>(false);

  activeFilter = signal<FilterType>('all');
  activeDropdown = signal<ActiveDropdown>(null);
  selectedDateFilter = signal<string>('Any time');
  selectedLocationFilter = signal<string>('Any Location');
  customDateRange = signal<{start: Date, end: Date} | null>(null);
  searchQuery = signal<string>('');

  selectedItem = signal<Report | null>(null);
  editingItem = signal<Report | null>(null);
  viewCodeItem = signal<Report | null>(null);
  itemToUnarchive = signal<Report | null>(null);

  showLocationModal = signal<boolean>(false);
  showDateRangeModal = signal<boolean>(false);

  readonly locationFilters = computed<string[]>(() => {
    const reports = this.allReports();
    const usedLocations =
        new Set(reports.map(r => r.location).filter(l => !!l));
    const sortedLocations = Array.from(usedLocations).sort();
    return ['Any Location', ...sortedLocations, 'Custom Location...'];
  });

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
    return ['Any time', ...dynamicFilters, 'Custom Range...'];
  });

  readonly dateFilters = this.availableDateFilters;

  filteredReports = computed(() => {
    let reports = this.allReports();

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      reports = reports.filter(r =>
        r.item_name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.location.toLowerCase().includes(query)
      );
    }

    const locationFilter = this.selectedLocationFilter();
    if (locationFilter !== 'Any Location') {
      reports = reports.filter(r => r.location === locationFilter);
    }

    const dateFilter = this.selectedDateFilter();
    if (dateFilter === 'Custom Range...') {
       const range = this.customDateRange();
       if (range) {
         reports = reports.filter(report => {
           const rDate = new Date(report.date_reported);
           return rDate >= range.start && rDate <= range.end;
         });
       }
    } else if (dateFilter !== 'Any time') {
      const cutoffTime = this.getCutoffTime(dateFilter);
      reports = reports.filter(report => {
        const reportTime = new Date(report.date_reported).getTime();
        return reportTime >= cutoffTime;
      });
    }

    if (this.activeFilter() === 'az') {
      reports = [...reports].sort((a, b) =>
        a.item_name.localeCompare(b.item_name)
      );
    } else if (this.activeFilter() === 'za') {
      reports = [...reports].sort((a, b) =>
        b.item_name.localeCompare(a.item_name)
      );
    }

    return reports;
  });

  codeModalTitle = computed(() => {
    const item = this.viewCodeItem();
    if (!item) return '';
    if (item.type === 'lost' || item.claim_code) return 'Ticket ID';
    return 'Reference Code';
  });

  codeModalValue = computed(() => {
    const item = this.viewCodeItem();
    if (!item) return '';
    if (item.claim_code) return item.claim_code;
    if (item.type === 'lost') return item.report_id ? `Report #${item.report_id}` : 'Pending';
    return item.surrender_code || 'N/A';
  });

  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  ngOnInit(): void {
    combineLatest([
      this.route.data,
      this.refreshTrigger$
    ]).pipe(
      tap(([data]) => {
        const type = data['type'] || data['itemType'];
        this.itemType.set(type);
        this.isArchiveView.set(data['status'] === 'matched' || data['status'] === 'claimed');
        this.updatePageTitle(data);
        this.isLoading.set(true);
      }),
      switchMap(([data]) => {
        const filters: ReportFilters = {
          type: this.itemType(),
          status: data['status'] || 'approved',
          query: this.searchQuery(),
          page: this.currentPage(),
          size: this.pageSize()
        };

        return this.itemService.getReports(filters).pipe(
          catchError(() => of({ items: [], totalItems: 0, totalPages: 1 })),
          finalize(() => this.isLoading.set(false))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(response => {
      this.allReports.set(response.items);
      this.totalItems.set(response.totalItems);
      this.totalPages.set(response.totalPages);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.triggerReload();
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.triggerReload();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.triggerReload();
    }
  }

  private triggerReload(): void {
    this.refreshTrigger$.next();
  }

  toggleDropdown(dropdown: ActiveDropdown): void {
    this.activeDropdown.set(
      this.activeDropdown() === dropdown ? null : dropdown);
  }

  toggleSort(): void {
    if (this.activeFilter() === 'az') {
        this.activeFilter.set('za');
    } else {
        this.activeFilter.set('az');
    }
    this.activeDropdown.set(null);
  }

  selectDateFilter(filter: string): void {
    if (filter === 'Custom Range...') {
      this.showDateRangeModal.set(true);
    } else {
      this.selectedDateFilter.set(filter);
      this.customDateRange.set(null);
    }
    this.activeDropdown.set(null);
  }

  selectLocationFilter(filter: string): void {
    if (filter === 'Other... (Custom Location)') {
      this.showLocationModal.set(true);
    } else {
      this.activeFilter.set('location');
      this.selectedLocationFilter.set(filter);
    }
    this.activeDropdown.set(null);
  }

  onCustomLocationSelected(location: string): void {
    this.showLocationModal.set(false);
    this.activeFilter.set('location');
    this.selectedLocationFilter.set(location);
  }

  onDateRangeConfirm(range: {start: Date, end: Date}): void {
    this.showDateRangeModal.set(false);
    range.end.setHours(23, 59, 59, 999);
    this.customDateRange.set(range);
    this.selectedDateFilter.set('Custom Range...');
  }

  clearFilters(): void {
    this.activeFilter.set('all');
    this.selectedDateFilter.set('Any time');
    this.selectedLocationFilter.set('Any Location');
    this.searchQuery.set('');
    this.customDateRange.set(null);
    this.activeDropdown.set(null);
    this.currentPage.set(1);

    this.triggerReload();
  }

  private updatePageTitle(data: Data): void {
    if (data['status'] === 'matched')
        this.pageTitle.set('Archive: Resolved Items');
    else if (data['status'] === 'claimed')
        this.pageTitle.set('Archive: Claimed Items');
    else
        this.pageTitle.set('Admin Item List');
  }

  onUnarchive(item: Report): void {
    this.itemToUnarchive.set(item);
  }

  processUnarchive(): void {
    const item = this.itemToUnarchive();
    if (!item) return;

    const targetStatus: string = 'approved';

    this.adminService.updateReportStatus(item.report_id, targetStatus)
      .pipe(
        tap(() => {
          this.allReports.update((reports: Report[]) =>
            reports.filter((r: Report) => r.report_id !== item.report_id)
          );
          this.itemToUnarchive.set(null);
        }),
        catchError((err: HttpErrorResponse) => {
          console.error('Failed to unarchive item', err);
          alert('Failed to unarchive item.');
          return of(null);
        })
      )
      .subscribe();
  }

  cancelUnarchive(): void {
    this.itemToUnarchive.set(null);
  }

  onCardClick(item: Report): void {
    this.selectedItem.set(item);
  }

  onTicketClick(item: Report): void {
    console.log('Ticket clicked', item.report_id);
  }

  onEditClick(item: Report): void {
    this.editingItem.set(item);
  }

  onDeleteClick(item: Report): void {
    console.log('Delete clicked', item.report_id);
  }

  onViewCodeClick(item: Report): void {
    this.viewCodeItem.set(item);
  }

  onModalEdit(): void {
    const item = this.selectedItem();
    if (item) {
      this.selectedItem.set(null);
      this.onEditClick(item);
    }
  }

  onModalDelete(): void {
    const item = this.selectedItem();
    if (item) {
      this.selectedItem.set(null);
      this.onDeleteClick(item);
    }
  }

  onModalViewCode(): void {
    const item = this.selectedItem();
    if (item) {
      this.selectedItem.set(null);
      this.onViewCodeClick(item);
    }
  }

  onModalUnarchive(): void {
    const item = this.selectedItem();
    if (item) {
      this.selectedItem.set(null);
      this.onUnarchive(item);
    }
  }

  getUserProfilePicture(): string | null {
    return null;
  }
}