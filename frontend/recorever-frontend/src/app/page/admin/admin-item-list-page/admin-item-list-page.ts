import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReportItemGrid } from '../../../share-ui-blocks/report-item-grid/report-item-grid';
import { ItemService } from '../../../core/services/item-service';
import { Report, ReportFilters } from '../../../models/item-model';
import { map, switchMap, catchError, of, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/auth-service';

@Component({
  selector: 'app-admin-item-list-page',
  standalone: true,
  imports: [CommonModule, ReportItemGrid],
  templateUrl: './admin-item-list-page.html',
  styleUrl: './admin-item-list-page.scss',
})
export class AdminItemListPage implements OnInit {
  private route = inject(ActivatedRoute);
  private itemService = inject(ItemService);
  private authService = inject(AuthService);

  currentUser = toSignal(this.authService.currentUser$);
  currentUserId = computed<number | null>(() =>
      this.currentUser()?.user_id ?? null);

  reports = signal<Report[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  pageTitle = signal<string>('Item List');

  ngOnInit(): void {
    this.route.data.pipe(
      tap(() => {
        this.isLoading.set(true);
        this.error.set(null);
      }),
      switchMap((data) => {
        let filters: ReportFilters;
        let title: string;

        const status = data['status'] as ReportFilters['status'];
        const type = data['type'] as 'lost' | 'found';

        if (data['type'] && data['status']) {
          filters = {
            type: data['type'] as 'lost' | 'found',
            status: data['status'] as ReportFilters['status']
          };

          if (data['status'] === 'matched') {
            title = 'Archive: Resolved Items (Lost & Matched)';
          } else if (data['status'] === 'claimed') {
            title = 'Archive: Claimed Items (Found & Claimed)';
          } else {
            title = `${(type as string).charAt(0).toUpperCase() +
                (type as string).slice(1)} Items`;
          }

        } else if (data['itemType']) {filters = {
            type: data['itemType'] as 'lost' | 'found',
            status: 'approved'
          };
          title = `${(data['itemType'] as string).charAt(0).toUpperCase() +
              (data['itemType'] as string).slice(1)} Items (Approved)`;
        } else {
          this.pageTitle.set('Admin Item List');
          return of([] as Report[]);
        }

        this.pageTitle.set(title);

        return this.itemService.getReports(filters).pipe(
          catchError((err) => {
            console.error('Error fetching admin reports:', err);
            return of([] as Report[]);
          })
        );
      }),
      tap(() => this.isLoading.set(false)),
      catchError(() => {
        this.error.set('Failed to load reports.');
        this.isLoading.set(false);
        return of([] as Report[]);
      })
    )
    .subscribe({
      next: (reports: Report[]) => {
        this.reports.set(reports);
      }
    });
  }

  public onTicketClick(item: Report): void {
    console.log('Ticket clicked for', item.report_id);
  }

  public onEditClick(item: Report): void {
    console.log('Edit clicked for', item.report_id);
  }

  public onDeleteClick(item: Report): void {
    console.log('Delete clicked for', item.report_id);
  }
}