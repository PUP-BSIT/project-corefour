import { 
  Component, 
  OnInit, 
  inject, 
  signal, 
  computed, 
  ViewChild, 
  ElementRef, 
  AfterViewInit, 
  OnDestroy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, BehaviorSubject, combineLatest, of, Subject } from 'rxjs';
import { 
  map,
  switchMap, 
  catchError, 
  shareReplay,
  tap, 
  takeUntil, 
  startWith
} from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

import {
  ReportItemGrid
} from '../../../share-ui-blocks/report-item-grid/report-item-grid';
import {
  EditProfileModal
} from '../../../modal/edit-profile-modal/edit-profile-modal';
import {
  DeleteReportModal
} from '../../../modal/delete-report-modal/delete-report-modal';
import {
  CodesModal
  } from '../../../modal/codes-modal/codes-modal';
import {
 ItemDetailModal
} from '../../../modal/item-detail-modal/item-detail-modal';

import { ItemService } from '../../../core/services/item-service';
import { UserService } from '../../../core/services/user-service';

import { PaginatedResponse, Report, ReportFilters } from '../../../models/item-model';
import { User } from '../../../models/user-model';
import { ActivatedRoute } from '@angular/router';

type TabType = 'all' | 'found' | 'lost';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ReportItemGrid,
    EditProfileModal,
    DeleteReportModal,
    CodesModal,
    ItemDetailModal
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss'
})
export class ProfilePage implements OnInit, AfterViewInit, OnDestroy {
  private itemService = inject(ItemService);
  private userService = inject(UserService);
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);

  loggedInUser$ = this.userService.currentUser$;

  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  private observer!: IntersectionObserver;
  
  currentPage = signal(1);
  totalPages = signal(1);
  pageSize = signal(10);

  activeTab$ = new BehaviorSubject<TabType>('all');
  activeStatus$ = new BehaviorSubject<string>('');
  private refreshTrigger$ = new Subject<void>();
  private refreshUser$ = new BehaviorSubject<void>(undefined);
  currentUser$: Observable<User | null>;
  isOwnProfile$: Observable<boolean>;

  displayedItems = signal<Report[]>([]);
  isItemsLoading = signal(false);

  showEditModal = false;
  showDeleteModal = false;
  updateError: string | null = null;
  itemToDelete: Report | null = null;

  viewCodeItem = signal<Report | null>(null);
  selectedItem = signal<Report | null>(null);

  codeModalTitle = computed(() => {
    const item = this.viewCodeItem();
    if (!item) return '';

    return 'Reference Code';
  });

  codeModalValue = computed(() => {
    const item = this.viewCodeItem();
    if (!item) return '';

    if (item.type === 'lost') {
      return 'Pending';
    }

    return item.surrender_code || 'N/A';
  });

  constructor() {
    this.currentUser$ = combineLatest([
      this.route.paramMap,
      this.refreshUser$.pipe(startWith(undefined))
    ]).pipe(
      switchMap(([params]) => {
        const userId = params.get('id');
        if (userId) {
          return this.userService.getUserById(+userId); 
        }
        return this.userService.getProfile();
      }),
      catchError(() => of(null)),
      shareReplay(1)
    );

    this.isOwnProfile$ = combineLatest([
      this.currentUser$, 
      this.userService.currentUser$.pipe(startWith(null))
    ]).pipe(
      map(([profileUser, loggedInUser]: [User | null, User | null]): boolean => {
        if (!profileUser || !loggedInUser) return false;
        return profileUser.user_id === loggedInUser.user_id;
      }),
      shareReplay(1)
    );
  }

  ngOnInit(): void {
    combineLatest([
      this.currentUser$,
      this.activeTab$,
      this.activeStatus$,
      this.isOwnProfile$
    ]).pipe(
      switchMap(([user, tab, status, isOwn]) => 
        this.refreshTrigger$.pipe(
          startWith(undefined),
          tap(() => this.isItemsLoading.set(true)),
          switchMap(() => {
            if (!user) return of({ items: [], totalPages: 0, totalItems: 0, currentPage: 1 });
            
            const filter: ReportFilters = {
              user_id: user.user_id,
              page: this.currentPage(),
              size: this.pageSize(),
              status: (!isOwn && !status) ? 'approved' : (status as any),
              ...(tab !== 'all' && { type: tab as any }),
            };
            return this.itemService.getReports(filter);
          }),
          catchError(() => of({ items: [], totalPages: 0, totalItems: 0, currentPage: 1 }))
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.displayedItems.update(existing => 
        this.currentPage() === 1 ? res.items : [...existing, ...res.items]
      );
      this.totalPages.set(res.totalPages);
      this.isItemsLoading.set(false);
    });
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !this.isItemsLoading() && this.currentPage() < this.totalPages()) {
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
    this.displayedItems.set([]);
  }

  setActiveTab(tab: TabType): void {
    this.activeTab$.next(tab);
    this.resetPagination();
  }

  setActiveStatus(status: string): void {
    this.activeStatus$.next(status);
    this.resetPagination();
  }

  clearStatusFilter(): void {
    this.activeStatus$.next('');
    this.resetPagination();
  }

  handleSaveProfile(event: { user: User, file: File | null }): void {
    const { user, file } = event;
    this.updateError = null;

    this.userService.updateProfile(user, file).subscribe({
      next: () => {
        this.showEditModal = false;
        this.refreshUser$.next();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Update failed', err);
        if (err.error && err.error.error) {
          this.updateError = err.error.error;
        } else {
          this.updateError = 'Failed to update. Please try again.';
        }
      }
    });
  }

  onCardClick(item: Report): void {
    this.selectedItem.set(item);
  }

  onDeleteItem(item: Report): void {
    this.itemToDelete = item;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.itemToDelete) return;

    const idToDelete = this.itemToDelete.report_id;

    this.itemService.deleteReport(idToDelete).subscribe({
      next: () => {
        console.log('Item deleted successfully');

        this.displayedItems.update((items: Report[]) =>
          items.filter((item: Report) => item.report_id !== idToDelete)
        );

        this.showDeleteModal = false;
        this.itemToDelete = null;
      },
      error: (err: unknown) => {
        console.error('Failed to delete', err);
        this.showDeleteModal = false;
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.itemToDelete = null;
  }

  onEditItem(item: Report): void {
    console.log('Edit item requested:', item);
  }

  onViewCode(item: Report): void {
    this.viewCodeItem.set(item);
  }

  onModalEdit(): void {
    const item = this.selectedItem();
    if (item) {
      this.selectedItem.set(null);
      this.onEditItem(item);
    }
  }

  onModalDelete(): void {
    const item = this.selectedItem();
    if (item) {
      this.selectedItem.set(null);
      this.onDeleteItem(item);
    }
  }

  onModalViewCode(): void {
    const item = this.selectedItem();
    if (item) {
      this.selectedItem.set(null);
      this.onViewCode(item);
    }
  }

  getUserProfilePicture(user: User | null): string {
    if (user && user.profile_picture) {
      const baseUrl = environment.apiUrl.replace('http://', 'https://');
      return `${baseUrl}/image/download/${user.profile_picture}`;
    }

    return 'assets/profile-avatar.png';
  }
}