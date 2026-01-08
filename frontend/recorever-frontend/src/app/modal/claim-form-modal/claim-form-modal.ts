import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
  ChangeDetectionStrategy,
  computed
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule
} from '@angular/forms';
import {
  switchMap,
  finalize,
  tap,
  debounceTime,
  distinctUntilChanged,
  map,
  filter
} from 'rxjs/operators';
import { of } from 'rxjs';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent
} from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';

import { Claim } from '../../models/claim-model';
import { Report } from '../../models/item-model';
import { User } from '../../models/user-model';
import { ClaimService } from '../../core/services/claim-service';
import { ItemService } from '../../core/services/item-service';
import { UserService } from '../../core/services/user-service';
import { AdminService } from '../../core/services/admin-service';
import { StatusBadge, ItemStatus } from '../../share-ui-blocks/status-badge/status-badge';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../core/services/toast-service';

export enum ClaimStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  CLAIMED = 'claimed',
  REJECTED = 'rejected'
}

@Component({
  selector: 'app-claim-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatRadioModule,
    StatusBadge
  ],
  providers: [DatePipe],
  templateUrl: './claim-form-modal.html',
  styleUrl: './claim-form-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimFormModal implements OnInit {
  private claimService = inject(ClaimService);
  private itemService = inject(ItemService);
  private userService = inject(UserService);
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);
  private toastService = inject(ToastService);

  @Input({ required: true }) claimData!: Claim | Report;
  @Input() isReadOnly: boolean = false;
  @Input() isArchive: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<string>();
  @Output() unarchive = new EventEmitter<void>();

  protected readonly ClaimStatus = ClaimStatus;

  protected readonly STATUS_OPTIONS = [
    { value: ClaimStatus.PENDING, label: 'Pending' },
    { value: ClaimStatus.APPROVED, label: 'Verified' },
    { value: ClaimStatus.CLAIMED, label: 'Claimed' },
    { value: ClaimStatus.REJECTED, label: 'Rejected' }
  ];

  protected claimForm: FormGroup;
  protected activeClaim = signal<Claim | null>(null);
  protected activeReport = signal<Report | null>(null);
  protected report = signal<Report | null>(null);
  protected reportOwnerName = signal<string>('Loading...');
  protected isLoading = signal(true);
  protected isSaving = signal(false);
  protected activeImageIndex = signal(0);
  protected isDropdownOpen = signal(false);
  protected filteredUsers = signal<User[]>([]);
  protected isSearchingUsers = signal(false);
  protected matchingLostReports = signal<Report[]>([]);
  protected isSearchingReports = signal(false);
  protected selectedLostReportId = signal<number | null>(null);

  protected isReportType = computed(() => 'type' in this.claimData);

  get displayDate(): Date | string {
    if (this.isReportType()) {
      return (this.claimData as Report).date_reported;
    }
    return (this.claimData as Claim).created_at;
  }

  protected displayStatus = computed((): ItemStatus => {
    const currentStatus = this.report()?.status;
    if (currentStatus === 'approved') {
      return 'Verified';
    }
    if (currentStatus === 'matched') {
      return 'Matched';
    }
    if (currentStatus === 'claimed') {
      return 'Claimed';
    }
    if (currentStatus === 'rejected') {
      return 'Rejected';
    }
    return 'Pending';
  });

  protected referenceCodeValue = computed((): string => {
    const r = this.report();
    if (!r) return 'N/A';
    return r.surrender_code || r.claim_code || 'N/A';
  });

  protected photoUrls = computed((): string[] => {
    const report = this.report();
    if (!report) return [];
    if (report.images && report.images.length > 0) {
      return report.images.map(img => img.imageUrl);
    }
    if (report.photoUrls && report.photoUrls.length > 0) {
      return report.photoUrls;
    }
    return [];
  });

  protected currentImageUrl = computed((): string => {
    const urls = this.photoUrls();
    if (urls.length === 0) {
      return 'assets/temp-photo-item.png';
    }
    const index = this.activeImageIndex() % urls.length;
    const url = urls[index];
    if (url && url.startsWith('http')) {
      return url.replace('http://', 'https://');
    }
    const secureBaseUrl = environment.apiUrl.replace('http://', 'https://');
    return `${secureBaseUrl}/image/download/${url}`;
  });

  constructor() {
    this.claimForm = this.fb.group({
      claimantName: ['', {
        validators: [Validators.required],
        updateOn: 'change'
      }],
      claimDate: [{ value: '', disabled: true }],
      contactEmail: ['', {
        validators: [Validators.email],
        updateOn: 'change'
      }],
      contactPhone: [''],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupUserSearch();
  }

  private setupUserSearch(): void {
    if (this.isReadOnly) return;

    this.claimForm.get('claimantName')?.valueChanges.pipe(
      map(value => typeof value === 'string' ? value.trim() : ''),
      tap(term => {
        if (!term) {
          this.filteredUsers.set([]);
          this.isSearchingUsers.set(false);
          this.matchingLostReports.set([]);
          this.selectedLostReportId.set(null);
        }
      }),
      filter(term => term.length > 0), 
      debounceTime(500), 
      distinctUntilChanged(),
      tap(() => this.isSearchingUsers.set(true)),
      switchMap(term => this.userService.searchUsers(term).pipe(
        finalize(() => this.isSearchingUsers.set(false))
      ))
    ).subscribe({
      next: users => this.filteredUsers.set(users),
      error: () => this.isSearchingUsers.set(false)
    });
  }

  protected displayUserFn(user: User): string {
    return user && user.name ? user.name : '';
  }

  protected onUserSelected(event: MatAutocompleteSelectedEvent): void {
    const user: User = event.option.value;

    this.claimForm.patchValue({
      contactEmail: user.email,
      contactPhone: user.phone_number
    });

    this.fetchMatchingLostReports(user.user_id);
  }

  private fetchMatchingLostReports(userId: number): void {
    const currentFoundItem = this.report();
    if (!currentFoundItem) return;

    this.isSearchingReports.set(true);
    this.matchingLostReports.set([]);
    this.selectedLostReportId.set(null);

    this.itemService.getPotentialMatches(currentFoundItem.report_id, userId)
      .pipe(
      finalize(() => this.isSearchingReports.set(false))
    ).subscribe({
      next: (matches) => {
        this.matchingLostReports.set(matches);
      },
      error: () => this.toastService
          .showError('Failed to fetch matching reports')
    });
  }

  protected getUserAvatar(user: User): string {
    if (!user.profile_picture) return '';
    if (user.profile_picture.startsWith('http')) return user.profile_picture;
    const secureBaseUrl = environment.apiUrl.replace('http://', 'https://');
    return `${secureBaseUrl}/image/download/${user.profile_picture}`;
  }

  private loadData(): void {
    this.isLoading.set(true);
    const data = this.claimData;

    if ('type' in data) {
      const report = data as Report;
      this.activeReport.set(report);
      this.report.set(report);

      const todayStr = this.datePipe.transform(new Date(), 'mediumDate');
      this.claimForm.patchValue({ claimDate: todayStr });

      if (this.isArchive && report.status === 'claimed') {
        this.claimService.getClaimByReportId(report.report_id).pipe(
          tap((claim: Claim) => {
            if (claim) {
              this.activeClaim.set(claim);
              this.patchFormForExistingClaim(claim);
            }
          }),
          switchMap(() => this.userService.getUserById(report.user_id)),
          finalize(() => this.isLoading.set(false))
        ).subscribe({
          next: (user) => 
            this.reportOwnerName.set(user?.name || 'Unknown User'),
          error: () => this.isLoading.set(false)
        });
      } else {
        this.userService.getUserById(report.user_id).pipe(
          finalize(() => this.isLoading.set(false))
        ).subscribe({
          next: (user) => 
            this.reportOwnerName.set(user?.name || 'Unknown User'),
          error: (err) => console.error('Error loading report owner', err)
        });
      }
    } else {
      const claim = data as Claim;
      this.activeClaim.set(claim);
      this.itemService.getReports({ type: 'found' }).pipe(
        switchMap((reports) => {
          const foundReport = reports.items.find(r => r.report_id === claim.report_id);
          this.report.set(foundReport || null);
          this.patchFormForExistingClaim(claim);
          return foundReport ? this.userService
              .getUserById(foundReport.user_id) : of(null);
        }),
        finalize(() => this.isLoading.set(false))
      ).subscribe({
        next: (owner) => {
          if (owner) this.reportOwnerName.set(owner.name || 'Unknown User');
        },
        error: (err) => console.error('Error loading claim data', err)
      });
    }
  }

  private patchFormForExistingClaim(claim: Claim): void {
    const formattedDate = 
        this.datePipe.transform(claim.created_at, 'mediumDate') || '';
    this.claimForm.patchValue({
      claimantName: claim.claimant_name || '',
      claimDate: formattedDate,
      contactEmail: claim.contact_email || '',
      contactPhone: claim.contact_phone || '',
      remarks: claim.admin_remarks || ''
    });

    if (this.isReadOnly) {
      this.claimForm.disable();
    }
  }

  protected onStatusOptionClick(status: string): void {
    if (this.isReadOnly) return;
    if (status === ClaimStatus.CLAIMED) {
      this.toastService.showError('Please fill out Claimant Details and click' +
          '"Submit" to mark this item as Claimed.');
      this.closeDropdown();
      return;
    }
    this.updateStatus(status);
  }

  protected isStatusDisabled(status: string): boolean {
    return status === ClaimStatus.CLAIMED || this.isReadOnly;
  }

  protected getOptionTooltip(status: string): string {
    return status === ClaimStatus.CLAIMED
      ? 'Please fill out Claimant Details and click "Submit"' +
          'to mark this item as Claimed.'
      : '';
  }

  protected toggleDropdown(event: Event): void {
    event.stopPropagation();
    if (this.isReadOnly) return;
    this.isDropdownOpen.update(v => !v);
  }

  protected closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  protected updateStatus(newStatus: string): void {
    this.isSaving.set(true);
    const reportId = this.report()?.report_id;
    if (reportId) {
      this.adminService.updateReportStatus(reportId, newStatus).pipe(
        tap(() => {
          this.report.update(r => r ? {
              ...r, status: newStatus as Report['status'] } : null);
        }),
        finalize(() => {
          this.isSaving.set(false);
          this.closeDropdown();
          this.statusChange.emit(newStatus);
        })
      ).subscribe();
    } else {
      this.isSaving.set(false);
    }
  }

  protected saveItemDetails(): void {
    if (this.isReadOnly) return;
    const currentStatus = this.report()?.status.toLowerCase();

    if (currentStatus === 'pending' || currentStatus === 'rejected') {
      this.toastService.showError(
        'Cannot submit a claim for reports that are Pending or Rejected.'
      );
      return;
    }

    if (this.claimForm.invalid) {
      this.claimForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValues = this.claimForm.getRawValue();

    const cName = typeof formValues.claimantName === 'object'
      ? formValues.claimantName.name
      : formValues.claimantName;

    if (this.activeReport()) {
      const report = this.activeReport()!;
      const payload = {
        report_id: report.report_id,
        claimant_name: cName,
        contact_email: formValues.contactEmail,
        contact_phone: formValues.contactPhone,
        admin_remarks: formValues.remarks,
        matching_lost_report_id: this.selectedLostReportId()
      };

      this.claimService.createManualClaim(payload).pipe(
        tap(() => {
          this.report.update(r => r ? { ...r, status: ClaimStatus.CLAIMED }
              : null);
        }),
        finalize(() => {
          this.isSaving.set(false);
          this.statusChange.emit(ClaimStatus.CLAIMED);
          this.onClose();
        })
      ).subscribe();
    } else if (this.activeClaim()) {
       this.isSaving.set(false);
       this.onClose();
    }
  }

  protected onUnarchive(): void {
    this.unarchive.emit();
  }

  protected nextImage(event: Event): void {
    event.stopPropagation();
    const len = this.photoUrls().length;
    if (len > 0) this.activeImageIndex.update((i) => (i + 1) % len);
  }

  protected prevImage(event: Event): void {
    event.stopPropagation();
    const len = this.photoUrls().length;
    if (len > 0) this.activeImageIndex.update((i) => (i - 1 + len) % len);
  }

  onClose(): void {
    this.close.emit();
  }
}