import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  EventEmitter,
  Output,
} from '@angular/core';
import {
  CommonModule,
  TitleCasePipe,
  DatePipe,
} from '@angular/common';
import { Report } from '../../models/item-model';
import { AdminService } from '../../core/services/admin-service';
import { UserService } from '../../core/services/user-service';
import { User } from '../../models/user-model';
import { HttpErrorResponse } from '@angular/common/http';
import {
  tap,
  finalize,
  catchError,
} from 'rxjs';
import { throwError } from 'rxjs';
import {
  ItemStatus,
} from '../../share-ui-blocks/status-badge/status-badge';

type AdminStatus =  'approved' | 'claimed' | 'closed' | 'matched' | 'rejected';

@Component({
  selector: 'app-report-detail-modal',
  standalone: true,
  imports: [CommonModule, TitleCasePipe, DatePipe],
  templateUrl: './report-detail-modal.html',
  styleUrls: ['./report-detail-modal.scss'],
})

export class ReportDetailModal implements OnInit {
  private adminService = inject(AdminService);
  private userService = inject(UserService);

  @Input({ required: true }) report!: Report;

  @Output() close = new EventEmitter<void>();

  @Output() statusUpdated = new EventEmitter<Report>();

  protected isDropdownOpen = signal(false);
  protected isSubmitting = signal(false);
  protected submissionError = signal<string | null>(null);
  protected userName = signal<string>('Loading...');

  protected readonly statusOptions: AdminStatus[] = [
    'approved',
    'claimed',
    'rejected',
  ];

  ngOnInit(): void {
    this.fetchUserName(this.report.user_id);
  }

  private fetchUserName(userId: number): void {
    this.userService.getUserById(userId).subscribe({
      next: (user: User) => {
        this.userName.set(user.name || `User ${userId}`);
      },
      error: () => {
        this.userName.set(`User ${userId} (Error)`);
      },
    });
  }

  protected getDisplayStatus(status: Report['status']): ItemStatus {
    switch (status) {
      case 'approved':
        return 'Verified'
      case 'matched':
        return 'Matched';
      case 'claimed':
        return 'Claimed';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      default:
        return 'Pending';
    }
  }

  protected toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen.update((v) => !v);
  }

  protected updateReportStatus(newStatus: AdminStatus): void {
    if (this.report.status === newStatus || this.isSubmitting()) {
      return;
    }

    this.isDropdownOpen.set(false);
    this.isSubmitting.set(true);
    this.submissionError.set(null);

    this.adminService
      .updateReportStatus(this.report.report_id, newStatus)
      .pipe(
        tap(() => {
          const updatedReport: Report = {
            ...this.report,
            status: newStatus,
          };
          this.report = updatedReport;
          this.statusUpdated.emit(updatedReport);
        }),
        finalize(() => this.isSubmitting.set(false)),
        catchError((err: HttpErrorResponse) => {
          const errorMsg = err.error?.message
              || err.error?.error
              || 'Failed to update status.';
          this.submissionError.set(errorMsg);
          return throwError(() => err);
        })
      )
      .subscribe();
  }

  protected getCodeButtonLabel(): string {
    return (this.report.type === 'lost' || this.report.claim_code)
      ? 'View Ticket ID'
      : 'View Reference Code';
  }

  protected onTicketClick(): void {
    if (this.report.claim_code || this.report.surrender_code) {
      this.statusUpdated.emit(this.report);
    }
  }

  protected onClose(): void {
    this.close.emit();
  }

  protected getUnresolvedClass(status: Report['status']): string {
    return status === 'claimed' ? 'resolved' : 'unresolved';
  }
}