import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, switchMap, catchError, shareReplay } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { ReportItemGrid } from '../../../share-ui-blocks/report-item-grid/report-item-grid';
import { EditProfileModal } from '../../../modal/edit-profile-modal/edit-profile-modal';

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
    EditProfileModal
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss'
})
export class ProfilePage implements OnInit {
  private itemService = inject(ItemService);
  private userService = inject(UserService);

  activeTab$ = new BehaviorSubject<TabType>('all');

  showEditModal = false;
  updateError: string | null = null;

  currentUser$: Observable<User | null>;
  displayedItems$: Observable<Report[]> = of([]);

  private refreshUser$ = new BehaviorSubject<void>(undefined);

  constructor() {
    this.currentUser$ = this.refreshUser$.pipe(
      switchMap(() => this.userService.getProfile()),
      catchError(() => of(null)),
      shareReplay(1)
    );
  }

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.displayedItems$ = combineLatest([
      this.currentUser$,
      this.activeTab$
    ]).pipe(
      switchMap(([user, tab]) => {
        if (!user) return of([]);

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
      }),
      switchMap(reports =>
        combineLatest([of(reports), this.currentUser$])
      ),
      map(([reports, user]) => {
        if (!user) return [];
        return reports.filter(r => r.user_id === user.user_id);
      })
    );
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
        } else if (typeof err.error === 'string') {
          this.updateError = err.error;
        } else {
          this.updateError = 'Failed to update. Please try again.';
        }
      }
    });
  }

  onDeleteItem(item: Report): void {
    // TODO: Implement delete Modal
  }

  onEditItem(item: Report): void {
    console.log('Edit item requested:', item);
    // TODO: Implement Edit Modal
  }
}