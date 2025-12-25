import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  computed,
  HostBinding,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, catchError, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import {
  SearchBarComponent
} from '../../../share-ui-blocks/search-bar/search-bar';
import {
  ReportItemGrid
} from '../../../share-ui-blocks/report-item-grid/report-item-grid';
import { ItemService } from '../../../core/services/item-service';
import { AuthService } from '../../../core/auth/auth-service';
import { ClaimService } from '../../../core/services/claim-service';

import type { PaginatedResponse, Report, ReportFilters } from '../../../models/item-model';
import { StandardLocations, StandardRelativeDateFilters }
    from '../../../models/item-model';
import { CustomLocation } from '../../../modal/custom-location/custom-location';
import { CodesModal } from '../../../modal/codes-modal/codes-modal';
import {
  ItemDetailModal
} from '../../../modal/item-detail-modal/item-detail-modal';

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
    CodesModal,
    ItemDetailModal,
  ],
  templateUrl: './user-item-list-page.html',
  styleUrl: './user-item-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserItemListPage implements OnInit, AfterViewInit, OnDestroy {
  private itemService = inject(ItemService);
  private authService = inject(AuthService);
  private claimService = inject(ClaimService);
  private route = inject(ActivatedRoute);

  private destroy$ = new Subject<void>();
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  private observer!: IntersectionObserver;
  currentPage = signal(1);
  totalPages = signal(1);
  pageSize = signal(10);

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

  viewCodeItem = signal<Report | null>(null);
  selectedItem = signal<Report | null>(null);
  
  searchSuggestions = signal<string[]>([]);

  codeModalTitle = computed(() => {
    const item = this.viewCodeItem();
    if (!item) return '';

    if (item.type === 'lost' || item.claim_code) {
        return 'Ticket ID';
    }

    return 'Reference Code';
  });

  codeModalValue = computed(() => {
    const item = this.viewCodeItem();
    if (!item) return '';

    if (item.claim_code) {
      return item.claim_code;
    }

    if (item.type === 'lost') {
      return item.report_id ? `Report #${item.report_id}` : 'Pending';
    }

    return item.surrender_code || 'N/A';
  });

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
      status: 'approved',
  });

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
    const statusFilter = type === 'found' 
      ? (showResolved ? 'claimed' : 'approved') 
      : (showResolved ? 'matched' : 'approved');

    this.filters.update(curr => ({ ...curr, status: statusFilter as any }));
    this.resetPagination();
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
    const locationValue = filter === 'Any Location' ? undefined : filter;
    this.filters.update(current => ({ ...current, location: locationValue }));
    this.resetPagination();
  }

  ngOnInit(): void {
    this.route.data
      .pipe(
        map((data) => data['itemType'] as ItemType),
        takeUntil(this.destroy$)
      )
      .subscribe((type: ItemType) => {
        this.itemType.set(type);
        this.filters.set({ type, status: 'approved' });
        this.resetPagination(); 
      });

    this.refreshTrigger$.pipe(
      tap(() => this.isLoading.set(true)),
      switchMap(() => {
        const currentFilters = this.filters();
        const pageToFetch = this.currentPage(); 
        const sizeToFetch = this.pageSize();

        console.log(`Fetching page ${pageToFetch} for ${currentFilters.type}`);

        return this.itemService.getReports({
          ...currentFilters,
          page: pageToFetch, 
          size: sizeToFetch
        }).pipe(
          catchError(() => of({ items: [], totalPages: 1, totalItems: 0, currentPage: 1 }))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((res: PaginatedResponse<Report>) => {
      this.allReports.update(existing => 
        this.currentPage() === 1 ? res.items : [...existing, ...res.items]
      );
      this.totalPages.set(res.totalPages);
      this.isLoading.set(false);
    });
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !this.isLoading() && this.currentPage() < this.totalPages()) {
        this.currentPage.update(p => p + 1);
        this.refreshTrigger$.next();
      }
    }, { rootMargin: '150px' });
    this.observer.observe(this.scrollAnchor.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetPagination(): void {
    this.currentPage.set(1);
    this.allReports.set([]);
    this.refreshTrigger$.next();
  }

  onQueryChange(query: string): void {
    if (!query || query.trim().length === 0) {
        this.searchSuggestions.set([]);
        return;
    }

    const lowerQuery = query.toLowerCase();
    const reports = this.allReports();

    const suggestions = new Set<string>();

    reports.forEach(report => {
        if (report.item_name.toLowerCase().includes(lowerQuery)) {
            suggestions.add(report.item_name);
        }
        if (report.location.toLowerCase().includes(lowerQuery)) {
            suggestions.add(report.location);
        }
    });

    this.searchSuggestions.set(Array.from(suggestions).slice(0, 5));
  }

  onSearchSubmit(query: string): void {
    this.filters.update(curr => ({ ...curr, query: query || undefined }));
    this.resetPagination();
    this.searchSuggestions.set([]);
  }

  onCardClick(item: Report): void {
    this.selectedItem.set(item);
  }

  onTicketClick(item: Report): void {
    if (!this.currentUserId()) {
        console.warn('User must be logged in to claim item');
        return;
    }

    this.claimService.submitClaim(item.report_id).subscribe({
        next: (response) => {
            const itemWithCode = {
                ...item,
                claim_code: response.claim_code
            };

            this.viewCodeItem.set(itemWithCode);
        },
        error: (err) => {
            console.error('Failed to generate ticket', err);
        }
    });
  }

  onEditClick(item: Report): void {
    console.log('Edit clicked for', item.report_id);
  }

  onDeleteClick(item: Report): void {
    console.log('Delete clicked for', item.report_id);
  }

  onViewCodeClick(item: Report): void {
    this.viewCodeItem.set(item);
  }

  onModalViewTicket(): void {
    const item = this.selectedItem();
    if (item) {
      this.selectedItem.set(null);
      this.onTicketClick(item);
    }
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

  getUserProfilePicture(): string | null {
    const item = this.selectedItem();
    if (!item) return null;
    return null;
  }
}