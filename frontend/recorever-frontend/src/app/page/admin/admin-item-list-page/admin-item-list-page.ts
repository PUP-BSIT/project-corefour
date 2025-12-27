import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  HostBinding,
  OnDestroy
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
import { Filter, FilterState } from '../../../share-ui-blocks/filter/filter';

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

import type {
  Report,
  ReportFilters
} from '../../../models/item-model';
import {
  StandardLocations
} from '../../../models/item-model';

type ItemType = 'lost' | 'found';

@Component({
  selector: 'app-admin-item-list-page',
  standalone: true,
  imports: [
    CommonModule,
    ReportItemGrid,
    SearchBarComponent,
    Filter,
    ItemDetailModal,
    CodesModal,
    UnarchiveConfirmationModal
  ],
  providers: [DatePipe], // Needed for date comparison
  templateUrl: './admin-item-list-page.html',
  styleUrl: './admin-item-list-page.scss',
})
export class AdminItemListPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private itemService = inject(ItemService);
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  private datePipe = inject(DatePipe);

  private destroy$ = new Subject<void>();
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  // Pagination
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(10);
  public totalPages = signal<number>(1);
  public totalItems = signal<number>(0);

  // Auth
  public currentUser = toSignal(this.authService.currentUser$);
  public currentUserId = computed<number | null>(
      () => this.currentUser()?.user_id ?? null
  );

  // Page Config
  public itemType = signal<ItemType>('lost');
  public isArchiveView = signal<boolean>(false);
  public pageTitle = signal<string>('Admin Item List');

  @HostBinding('class.theme-lost') get isLost(): boolean {
    return this.itemType() === 'lost';
  }
  @HostBinding('class.theme-found') get isFound(): boolean {
    return this.itemType() === 'found';
  }

  // Data State
  public allReports = signal<Report[]>([]);
  public isLoading = signal<boolean>(true);
  public error = signal<string | null>(null);

  // Filter State (Controlled by App-Filter)
  public searchQuery = signal<string>('');
  public currentSort = signal<'newest' | 'oldest'>('newest');
  public currentDateFilter = signal<Date | null>(null);
  public currentLocationFilter = signal<string>('');

  // Modal State
  public selectedItem = signal<Report | null>(null);
  public editingItem = signal<Report | null>(null);
  public viewCodeItem = signal<Report | null>(null);
  public itemToUnarchive = signal<Report | null>(null);

  public readonly locationFilters: string[] = [
    ...Object.values(StandardLocations) as string[],
  ];

  public filteredReports = computed((): Report[] => {
    let reports = [...this.allReports()];

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      reports = reports.filter(r =>
        r.item_name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.location.toLowerCase().includes(query)
      );
    }

    const location = this.currentLocationFilter();
    if (location) {
      reports = reports.filter(r =>
        r.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    const dateFilter = this.currentDateFilter();
    if (dateFilter) {
      const filterDateStr = this.datePipe.transform(dateFilter, 'yyyy-MM-dd');
      reports = reports.filter(report => {
        const reportDateStr = this.datePipe.transform(report.date_reported, 'yyyy-MM-dd');
        return reportDateStr === filterDateStr;
      });
    }

    reports.sort((a, b) => {
      const dateA = new Date(a.date_reported).getTime();
      const dateB = new Date(b.date_reported).getTime();

      if (this.currentSort() === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    return reports;
  });

  public codeModalTitle = computed((): string => {
    const item = this.viewCodeItem();
    if (!item) return '';
    if (item.type === 'lost' || item.claim_code) return 'Ticket ID';
    return 'Reference Code';
  });

  public codeModalValue = computed((): string => {
    const item = this.viewCodeItem();
    if (!item) return '';
    if (item.claim_code) return item.claim_code;
    if (item.type === 'lost') return item.report_id ? `Report #${item.report_id}` : 'Pending';
    return item.surrender_code || 'N/A';
  });

  public ngOnInit(): void {
    combineLatest([
      this.route.data,
      this.refreshTrigger$
    ]).pipe(
      tap(([data]) => {
        const type = data['type'] || data['itemType'];
        this.itemType.set(type);
        this.isArchiveView.set(data['status'] ===
            'matched' || data['status'] === 'claimed');
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

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public onSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.refreshTrigger$.next();
  }

  public onFilterChange(state: FilterState): void {
    this.currentSort.set(state.sort);
    this.currentDateFilter.set(state.date);
    this.currentLocationFilter.set(state.location);
    this.currentPage.set(1);
  }

  public nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.refreshTrigger$.next();
    }
  }

  public prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.refreshTrigger$.next();
    }
  }

  private updatePageTitle(data: Data): void {
    if (data['status'] === 'matched')
        this.pageTitle.set('Archive: Resolved Items');
    else if (data['status'] === 'claimed')
        this.pageTitle.set('Archive: Claimed Items');
    else
        this.pageTitle.set('Admin Item List');
  }

  public onUnarchive(item: Report): void {
    this.itemToUnarchive.set(item);
  }

  public processUnarchive(): void {
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

  public cancelUnarchive(): void {
    this.itemToUnarchive.set(null);
  }

  public onCardClick(item: Report): void {
    this.selectedItem.set(item);
  }

  public onTicketClick(item: Report): void {
    console.log('Ticket clicked', item.report_id);
  }

  public onEditClick(item: Report): void {
    this.editingItem.set(item);
  }

  public onDeleteClick(item: Report): void {
    console.log('Delete clicked', item.report_id);
  }

  public onViewCodeClick(item: Report): void {
    this.viewCodeItem.set(item);
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

  public onModalUnarchive(): void {
    const item = this.selectedItem();
    if (item) {
      this.selectedItem.set(null);
      this.onUnarchive(item);
    }
  }

  public getUserProfilePicture(): string | null {
    return null;
  }
}