import { Component, OnInit, inject, signal } from '@angular/core';
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

import { ItemService } from '../../../core/services/item-service';
import { UserService } from '../../../core/services/user-service';
import { Report } from '../../../models/item-model';
import { User } from '../../../models/user-model';

type TabType = 'all' | 'found' | 'lost';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ReportItemGrid,
    EditProfileModal,
    DeleteReportModal
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss'
})
export class ProfilePage implements OnInit {
  private itemService = inject(ItemService);
  private userService = inject(UserService);

  activeTab$ = new BehaviorSubject<TabType>('all');

  showEditModal = false;
  showDeleteModal = false;

  updateError: string | null = null;
  itemToDelete: Report | null = null;

  currentUser$: Observable<User | null>;
  
  displayedItems = signal<Report[]>([]);
  isItemsLoading = signal(false);

  private refreshUser$ = new BehaviorSubject<void>(undefined);

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
      this.activeTab$
    ]).pipe(
      tap(() => this.isItemsLoading.set(true)),
      switchMap(([user, tab]) => {
        if (!user) return of([]);
        return this.fetchReportsByTab(tab).pipe(
          map(reports => 
            reports.filter(r => r.user_id === user.user_id)
          )
        );
      })
    ).subscribe({
      next: (items) => {
        this.displayedItems.set(items);
        this.isItemsLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading items', err);
        this.isItemsLoading.set(false);
      }
    });
  }

  private fetchReportsByTab(tab: TabType): Observable<Report[]> {
    if (tab === 'all') {
      return combineLatest([
        this.itemService.getReports({ type: 'lost' }),
        this.itemService.getReports({ type: 'found' })
      ]).pipe(
        map(([lost, found]) => [...lost, ...found])
      );
    } else {
      return this.itemService.getReports({ type: tab });
    }
  }

  setActiveTab(tab: TabType): void {
    this.activeTab$.next(tab);
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

        this.displayedItems.update(items => 
          items.filter(item => item.report_id !== idToDelete)
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
}