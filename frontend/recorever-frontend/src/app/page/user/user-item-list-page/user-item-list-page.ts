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
import { CommonModule, DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, catchError, map, of, Subject, switchMap,
  takeUntil, tap, finalize } from 'rxjs';
import {
  SearchBarComponent
} from '../../../share-ui-blocks/search-bar/search-bar';
import {
  ReportItemGrid
} from '../../../share-ui-blocks/report-item-grid/report-item-grid';
import {
  Filter, FilterState
} from '../../../share-ui-blocks/filter/filter';

import { ItemService } from '../../../core/services/item-service';
import { AuthService } from '../../../core/auth/auth-service';
import { ClaimService } from '../../../core/services/claim-service';

import type {
  PaginatedResponse, Report, ReportFilters
} from '../../../models/item-model';

// Modals
import { CodesModal } from '../../../modal/codes-modal/codes-modal';
import {
  ItemDetailModal
} from '../../../modal/item-detail-modal/item-detail-modal';
import {
  DeleteReportModal
} from "../../../modal/delete-report-modal/delete-report-modal";

type ItemType = 'lost' | 'found';

@Component({
  selector: 'app-user-item-list-page',
  standalone: true,
  imports: [
    CommonModule,
    SearchBarComponent,
    ReportItemGrid,
    Filter,
    CodesModal,
    ItemDetailModal,
    DeleteReportModal
  ],
  providers: [DatePipe],
  templateUrl: './user-item-list-page.html',
  styleUrl: './user-item-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserItemListPage implements OnInit, AfterViewInit, OnDestroy {
  private itemService = inject(ItemService);
  private authService = inject(AuthService);
  private claimService = inject(ClaimService);
  private route = inject(ActivatedRoute);
  private datePipe = inject(DatePipe);

  private destroy$ = new Subject<void>();
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  private observer!: IntersectionObserver;

  public currentPage = signal<number>(1);
  public totalPages = signal<number>(1);
  public pageSize = signal<number>(10);

  public currentUser = toSignal(this.authService.currentUser$);
  public currentUserId = computed((): number |
      null => this.currentUser()?.user_id ?? null);

  public itemType = signal<ItemType>('lost');
  public pageTitle = computed((): string =>
    this.itemType() === 'lost' ? 'Lost Items' : 'Found Items'
  );

  @HostBinding('class.theme-lost') get isLost(): boolean {
    return this.itemType() === 'lost';
  }
  @HostBinding('class.theme-found') get isFound(): boolean {
    return this.itemType() === 'found';
  }

  public showResolved = signal<boolean>(false);
  public searchSuggestions = signal<string[]>([]);

  public showDeleteModal = signal<boolean>(false);
  public itemToDelete = signal<Report | null>(null);
  public viewCodeItem = signal<Report | null>(null);
  public selectedItem = signal<Report | null>(null);


  public currentSort = signal<'newest' | 'oldest'>('newest');
  public currentDateFilter = signal<Date | null>(null);
  public currentLocationFilter = signal<string>('');

  protected locations = computed(() => {
    const locs = this.allReports()
      .map(r => r.location)
      .filter(l => !!l);
    return [...new Set(locs)] as string[];
  });

  public allReports = signal<Report[]>([]);
  public isLoading = signal<boolean>(true);
  public error = signal<string | null>(null);

  public filters = signal<ReportFilters>({
      type: 'found',
      status: 'approved',
  });

  public visibleReports = computed((): Report[] => {
    let reports = [...this.allReports()];
    const dateFilter = this.currentDateFilter();
    const locationFilter = this.currentLocationFilter();
    const sort = this.currentSort();

    if (dateFilter) {
        const filterDateStr = this.datePipe.transform(dateFilter, 'yyyy-MM-dd');
        reports = reports.filter(report => {
            const reportDateStr =
                this.datePipe.transform(report.date_lost_found, 'yyyy-MM-dd');
            return reportDateStr === filterDateStr;
        });
    }

    if (locationFilter) {
      reports = reports.filter(r =>
        r.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    reports.sort((a, b) => {
        const dateA = new Date(a.date_reported).getTime();
        const dateB = new Date(b.date_reported).getTime();
        return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return reports;
  });

  public codeModalTitle = computed((): string => {
    const item = this.viewCodeItem();
    if (!item) return '';
    return (item.type === 'lost' || item.claim_code) ?
        'Ticket ID' : 'Reference Code';
  });

  public codeModalValue = computed((): string => {
    const item = this.viewCodeItem();
    if (!item) return '';
    if (item.claim_code) return item.claim_code;
    if (item.type === 'lost') return item.report_id ?
        `Report #${item.report_id}` : 'Pending';
    return item.surrender_code || 'N/A';
  });

  public ngOnInit(): void {
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

        return this.itemService.getReports({
          ...currentFilters,
          page: pageToFetch,
          size: sizeToFetch
        }).pipe(
          catchError(() => of({ items: [],
              totalPages: 1, totalItems: 0, currentPage: 1 })),
              finalize(() => this.isLoading.set(false))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((res: PaginatedResponse<Report>) => {
      this.allReports.update(existing =>
        this.currentPage() === 1 ? res.items : [...existing, ...res.items]
      );
      this.totalPages.set(res.totalPages);
    });
  }

  public ngAfterViewInit(): void {
    if (this.scrollAnchor) {
      this.observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !this.isLoading() &&
            this.currentPage() < this.totalPages()) {
              this.currentPage.update(p => p + 1);
              this.refreshTrigger$.next();
        }
      }, { rootMargin: '150px' });
      this.observer.observe(this.scrollAnchor.nativeElement);
    }
  }

  public ngOnDestroy(): void {
    this.observer?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetPagination(): void {
    this.currentPage.set(1);
    this.allReports.set([]);
    this.refreshTrigger$.next();
  }

  public onFilterChange(state: FilterState): void {
    this.currentSort.set(state.sort);
    this.currentDateFilter.set(state.date);
    this.currentLocationFilter.set(state.location);

    this.resetPagination();
  }

  public toggleStatus(showResolved: boolean): void {
    this.showResolved.set(showResolved);
    const type = this.itemType();
    const statusFilter = type === 'found'
      ? (showResolved ? 'claimed' : 'approved')
      : (showResolved ? 'resolved' : 'approved');

    this.filters.update(curr => ({ ...curr, status: statusFilter as any }));
    this.resetPagination();
  }

  public onQueryChange(query: string): void {
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

  public onSearchSubmit(query: string): void {
    this.filters.update(curr => ({ ...curr, query: query || undefined }));
    this.resetPagination();
    this.searchSuggestions.set([]);
  }

  public onCardClick(item: Report): void {
    this.selectedItem.set(item);
  }

  public onTicketClick(item: Report): void {
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

  public onEditClick(item: Report): void {
    console.log('Edit clicked for', item.report_id);
  }

  public onDeleteClick(item: Report): void {
      this.itemToDelete.set(item);
      this.showDeleteModal.set(true);
  }

  public cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.itemToDelete.set(null);
  }

  public confirmDelete(): void {
    const item = this.itemToDelete();
    if (!item) return;

    const idToDelete = item.report_id;

    this.itemService.deleteReport(idToDelete).subscribe({
      next: () => {
        this.allReports.update((items: Report[]) =>
          items.filter((item: Report) => item.report_id !== idToDelete)
        );
        this.showDeleteModal.set(false);
        this.itemToDelete.set(null);
      },
      error: (err: unknown) => {
        console.error('Failed to delete report', err);
        this.showDeleteModal.set(false);
      }
    });
  }

  public onViewCodeClick(item: Report): void {
    this.viewCodeItem.set(item);
  }

  public onModalViewTicket(): void {
    const item = this.selectedItem();
    if (item) {
      this.selectedItem.set(null);
      this.onTicketClick(item);
    }
  }

  public onModalEdit(): void {
    const item = this.selectedItem();
    if (item) {
      this.selectedItem.set(null);
      this.onEditClick(item);
    }
  }

  public onModalDelete(): void {
    const item = this.selectedItem();
    if (item) {
      this.selectedItem.set(null);
      this.onDeleteClick(item);
    }
  }

  public onModalViewCode(): void {
    const item = this.selectedItem();
    if (item) {
      this.selectedItem.set(null);
      this.onViewCodeClick(item);
    }
  }

  public getUserProfilePicture(): string | null {
    const item = this.selectedItem();
    if (!item) return null;
    return null;
  }
}