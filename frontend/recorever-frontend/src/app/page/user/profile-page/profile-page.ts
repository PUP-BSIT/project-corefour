import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, switchMap, catchError, shareReplay, tap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

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

import { Report, ReportFilters } from '../../../models/item-model';
import { User } from '../../../models/user-model';

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
export class ProfilePage implements OnInit {
  private itemService = inject(ItemService);
  private userService = inject(UserService);

  activeTab$ = new BehaviorSubject<TabType>('all');
  activeStatus$ = new BehaviorSubject<string>('');
  private refreshUser$ = new BehaviorSubject<void>(undefined);
  currentUser$: Observable<User | null>;

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
    this.currentUser$ = this.refreshUser$.pipe(
      switchMap(() => this.userService.getProfile()),
      catchError(() => of(null)),
      shareReplay(1)
    );
  }

  ngOnInit(): void {
    combineLatest([
      this.currentUser$,
      this.activeTab$,
      this.activeStatus$
    ]).pipe(
      tap(() => this.isItemsLoading.set(true)),
      switchMap(([user, tab, status]) => {
        if (!user) return of([]);

        return this.fetchReportsByTab(tab, user.user_id, status).pipe(
          map((items: Report[]) => {
            return items;
          })
        );
      })
    ).subscribe({
      next: (items: Report[]) => {
        this.displayedItems.set(items);
        this.isItemsLoading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error loading items', err);
        this.isItemsLoading.set(false);
      }
    });
  }

  private fetchReportsByTab(
    tab: TabType,
    userId: number,
    status: string
  ): Observable<Report[]> {

    const filter: ReportFilters = {
      user_id: userId,
      ...(tab !== 'all' && { type: tab }),
      ...(status && { status: status as any })
    };

    return this.itemService.getReports(filter).pipe(
      map((reports: Report[]) => reports)
    );
  }

  setActiveTab(tab: TabType): void {
    this.activeTab$.next(tab);
  }

  setActiveStatus(status: string): void {
    this.activeStatus$.next(status);
  }

  clearStatusFilter(): void {
    this.activeStatus$.next('');
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

  getUserProfilePicture(): string | null {
    return null;
  }
}