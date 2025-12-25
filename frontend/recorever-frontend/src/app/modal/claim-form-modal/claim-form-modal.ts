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
  Validators 
} from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { switchMap, finalize, catchError, tap } from 'rxjs/operators';

import { Claim } from '../../models/claim-model';
import { Report } from '../../models/item-model';
import { ClaimService } from '../../core/services/claim-service';
import { ItemService } from '../../core/services/item-service';
import { UserService } from '../../core/services/user-service';
import { AdminService } from '../../core/services/admin-service';

@Component({
  selector: 'app-claim-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
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

  @Input({ required: true }) claimData!: Claim | Report; 
  @Output() close = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<string>();

  protected readonly STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Verified' },
    { value: 'claimed', label: 'Claimed' },
    { value: 'rejected', label: 'Denied' }
  ];

  protected onStatusOptionClick(status: string): void {
    if (status === 'claimed') {
      alert('Please fill out Claimant Details and click "Submit" to mark this item as Claimed.');
      this.closeDropdown();
      return;
    }

    this.updateStatus(status);
  }

  protected isStatusDisabled(status: string): boolean {
    return status === 'claimed';
  }

  protected claimForm: FormGroup;
  
  protected activeClaim = signal<Claim | null>(null);
  protected activeReport = signal<Report | null>(null);
  protected report = signal<Report | null>(null); 
  protected reportOwnerName = signal<string>('Loading...'); 
  
  protected isLoading = signal(true);
  protected isSaving = signal(false);
  protected activeImageIndex = signal(0);
  protected isDropdownOpen = signal(false);
  
  protected images = signal<string[]>([
    'assets/temp-photo-main.png', 
    'assets/temp-photo-item.png'
  ]);

  protected isReportType = computed(() => 'type' in this.claimData);
  
  get displayDate(): Date | string {
    if (this.isReportType()) {
      return (this.claimData as Report).date_reported;
    }
    return (this.claimData as Claim).created_at;
  }

  constructor() {
    this.claimForm = this.fb.group({
      claimantName: ['', Validators.required],
      claimDate: [''],
      contactEmail: [''],
      contactPhone: [''],
      remarks: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
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

      this.userService.getUserById(report.user_id).pipe(
        finalize(() => this.isLoading.set(false))
      ).subscribe({
        next: (user) => this.reportOwnerName.set(user?.name || 'Unknown User'),
        error: (err) => console.error('Error loading report owner', err)
      });
    } 
    else {
      const claim = data as Claim;
      this.activeClaim.set(claim);
      
      this.itemService.getReports({ type: 'found' }).pipe(
        switchMap((reports) => {
          const foundReport = reports.items.find(r => r.report_id === claim.report_id);
          this.report.set(foundReport || null);
          this.patchFormForExistingClaim(claim);

          return foundReport 
            ? this.userService.getUserById(foundReport.user_id)
            : of(null);
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
    const formattedDate = this.datePipe.transform(claim.created_at, 'mediumDate') || '';
    this.claimForm.patchValue({
        claimantName: claim.claimant_name || '',
        claimDate: formattedDate,
        contactEmail: claim.contact_email || '',
        contactPhone: claim.contact_phone || '',
        remarks: claim.admin_remarks || ''
    });
  }

  protected updateStatus(newStatus: string): void {
    this.isSaving.set(true);
    
    const reportId = this.report()?.report_id;

    if (reportId) {
      this.adminService.updateReportStatus(reportId, newStatus).pipe(
        tap(() => {
          this.report.update(r => r ? { ...r, status: newStatus as any } : null);
        }),
        finalize(() => {
          this.isSaving.set(false);
          this.closeDropdown();
          this.statusChange.emit(newStatus); 
        })
      ).subscribe();
    } else {
      console.error("No report ID found to update");
      this.isSaving.set(false);
    }
  }

  protected saveItemDetails(): void {
    if (this.claimForm.invalid) {
      this.claimForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValues = this.claimForm.getRawValue();

    if (this.activeReport()) {
      const report = this.activeReport()!;
      
      const payload = {
        report_id: report.report_id,
        claimant_name: formValues.claimantName,
        contact_email: formValues.contactEmail,
        contact_phone: formValues.contactPhone,
        admin_remarks: formValues.remarks
      };

      this.claimService.createManualClaim(payload).pipe(
        tap(() => {
          this.report.update(r => r ? { ...r, status: 'claimed' } : null);
        }),
        finalize(() => {
          this.isSaving.set(false);
          this.statusChange.emit('claimed');
          this.onClose();
        })
      ).subscribe();
    } 
    else if (this.activeClaim()) {
       this.isSaving.set(false);
       this.onClose();
    }
  }

  protected toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen.update(v => !v);
  }

  protected closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  protected nextImage(): void {
    this.activeImageIndex.update((i) => (i + 1) % this.images().length);
  }

  protected prevImage(): void {
    this.activeImageIndex.update(
      (i) => (i - 1 + this.images().length) % this.images().length
    );
  }

  onClose(): void {
    this.close.emit();
  }
}