import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  HostBinding
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, tap } from 'rxjs';

import {
  ReportItemGrid
} from '../../../share-ui-blocks/report-item-grid/report-item-grid';
import {
  SearchBarComponent
} from '../../../share-ui-blocks/search-bar/search-bar';
import { ItemService } from '../../../core/services/item-service';
import { AuthService } from '../../../core/auth/auth-service';
import {
  ItemDetailModal
} from '../../../modal/item-detail-modal/item-detail-modal';
//import { EditItemModal } from '../../../modal/edit-item-modal/edit-item-modal';
import { CodesModal } from '../../../modal/codes-modal/codes-modal';

import type {
  Report,
  ReportFilters,
  ReportSubmissionWithFiles
} from '../../../models/item-model';
import {
  StandardLocations,
  StandardRelativeDateFilters
} from '../../../models/item-model';

type FilterType = 'all' | 'az' | 'date' | 'location';
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
    //EditItemModal,
    CodesModal
  ],
  templateUrl: './admin-item-list-page.html',
  styleUrl: './admin-item-list-page.scss',
})
export class AdminItemListPage implements OnInit {
  private route = inject(ActivatedRoute);
  private itemService = inject(ItemService);
  private authService = inject(AuthService);

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
  searchQuery = signal<string>('');

  selectedItem = signal<Report | null>(null);
  editingItem = signal<Report | null>(null);
  viewCodeItem = signal<Report | null>(null);

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

  readonly locationFilters: string[] = [
    'Any Location',
    ...Object.values(StandardLocations) as string[],
  ];

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
    if (dateFilter !== 'Any time') {
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
    }

    return reports;
  });

  ngOnInit(): void {
    this.route.data.pipe(
      tap((data) => {
        this.isLoading.set(true);
        const status = data['status'];
        const type = data['type'] || data['itemType'];

        this.itemType.set(type);
        this.isArchiveView.set(status === 'matched' || status === 'claimed');
      }),
      switchMap((data) => {
        const filters: ReportFilters = {
          type: data['type'] || data['itemType'],
          status: data['status'] || 'approved'
        };
        this.updatePageTitle(data);
        return this.itemService.getReports(filters).pipe(
          catchError((err: HttpErrorResponse) => {
            console.error('Error fetching reports', err);
            this.error.set('Failed to load items. Please try again.');
            return of([] as Report[]);
          })
        );
      }),
      tap(() => this.isLoading.set(false))
    ).subscribe(reports => {
      this.allReports.set(reports);
    });
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
  }

  toggleDropdown(dropdown: ActiveDropdown): void {
    this.activeDropdown.set(
      this.activeDropdown() === dropdown ? null : dropdown
    );
  }

  selectDateFilter(filter: string): void {
    this.selectedDateFilter.set(filter);
    this.activeDropdown.set(null);
  }

  selectLocationFilter(filter: string): void {
    this.activeFilter.set('location');
    this.selectedLocationFilter.set(filter);
    this.activeDropdown.set(null);
  }

  clearFilters(): void {
    this.activeFilter.set('all');
    this.selectedDateFilter.set('Any time');
    this.selectedLocationFilter.set('Any Location');
    this.searchQuery.set('');
  }

  private updatePageTitle(data: any): void {
    if (data['status'] === 'matched') {
      this.pageTitle.set('Archive: Resolved Items');
    } else if (data['status'] === 'claimed') {
      this.pageTitle.set('Archive: Claimed Items');
    } else {
      this.pageTitle.set('Admin Item List');
    }
  }

  onUnarchive(item: Report): void {
    console.log('Unarchive triggered for:', item.report_id);
    // TODO: Implement unarchive API call
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

  // onSaveEdit(formData: ReportSubmissionWithFiles): void {
  //   const item = this.editingItem();
  //   if (!item) return;

  //   this.itemService.updateReport(item.report_id, formData).subscribe({
  //     next: (updatedReport: Report) => {
  //       this.allReports.update((items: Report[]) =>
  //         items.map((i: Report) =>
  //           i.report_id === updatedReport.report_id ? updatedReport : i
  //         )
  //       );

  //       this.editingItem.set(null);
  //       alert('Report updated successfully!');
  //     },
  //     error: (err: HttpErrorResponse) => {
  //       console.error('Failed to update report', err);
  //       alert('Failed to update report. Please try again.');
  //     }
  //   });
  // }

  getUserProfilePicture(): string | null {
    return null;
  }
}