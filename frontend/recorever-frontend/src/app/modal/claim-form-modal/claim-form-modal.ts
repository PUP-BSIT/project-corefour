import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { 
  ReactiveFormsModule, 
  FormBuilder, 
  FormGroup 
} from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { switchMap, finalize, catchError } from 'rxjs/operators';

import { Claim } from '../../models/claim-model';
import { Report } from '../../models/item-model';
import { User } from '../../models/user-model';
import { ClaimService } from '../../core/services/claim-service';
import { ItemService } from '../../core/services/item-service';
import { UserService } from '../../core/services/user-service';

@Component({
  selector: 'app-claim-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './claim-form-modal.html',
  styleUrl: './claim-form-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimFormModal implements OnInit {
  private claimService = inject(ClaimService);
  private itemService = inject(ItemService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  @Input({ required: true }) claimData!: Claim; 
  @Output() close = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<void>();

  protected claimForm: FormGroup;
  protected activeClaim = signal<Claim | null>(null);
  protected report = signal<Report | null>(null);
  protected claimant = signal<User | null>(null);
  protected reportOwnerName = signal<string>('Loading...');
  protected isLoading = signal(true);
  protected isSaving = signal(false);
  protected activeImageIndex = signal(0);
  protected isDropdownOpen = signal(false);
  
  protected images = signal<string[]>([
    'assets/temp-photo-main.png', 
    'assets/temp-photo-item.png'
  ]);

  constructor() {
    this.claimForm = this.fb.group({
      claimantName: [''],
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
    const current = this.claimData;
    this.activeClaim.set(current);

    forkJoin({
      reports: this.itemService.getReports({ type: 'found' }),
      claimantUser: this.userService.getUserById(current.user_id).pipe(
        catchError(() => of(null))
      )
    }).pipe(
      switchMap(({ reports, claimantUser }) => {
        this.claimant.set(claimantUser);

        const datePipe = new DatePipe('en-US');
        const formattedDate = 
            datePipe.transform(current.created_at, 'mediumDate') || '';

        this.claimForm.patchValue({
            claimantName: claimantUser?.name || 'Unknown',
            claimDate: formattedDate,
            contactEmail: claimantUser?.email || '',
            contactPhone: claimantUser?.phone_number || '',
            remarks: current.admin_remarks || ''
        });

        const foundReport = reports.find(
          (r) => r.report_id === current.report_id
        );
        this.report.set(foundReport || null);

        return foundReport 
          ? this.userService.getUserById(foundReport.user_id)
          : of(null);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (owner) => {
        if (owner) {
          this.reportOwnerName.set(owner.name || 'Unknown User');
        }
      },
      error: (err) => console.error('Error loading modal data', err)
    });
  }

  protected toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen.update(v => !v);
  }

  protected closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  protected updateStatus(newStatus: string): void {
    const claim = this.activeClaim();
    if (!claim) return;

    this.isSaving.set(true);
    const remarks = this.claimForm.get('remarks')?.value || '';
    
    this.claimService.updateClaimStatus(
      claim.claim_id, 
      newStatus, 
      remarks
    ).pipe(
      switchMap(() => {
        this.activeClaim.update(c => c ? { 
            ...c, status: newStatus as Claim['status'] } : null);
        this.statusChange.emit();
        return of(true);
      }),
      finalize(() => {
        this.isSaving.set(false);
        this.closeDropdown();
      })
    ).subscribe();
  }

  protected saveItemDetails(): void {
    if (this.claimForm.invalid) return;

    this.isSaving.set(true);
    const claim = this.activeClaim();
    
    if (claim) {
      const remarks = this.claimForm.get('remarks')?.value || '';
      this.claimService.updateClaimStatus(
        claim.claim_id,
        claim.status,
        remarks
      ).pipe(
        finalize(() => {
          this.isSaving.set(false);
          this.onClose();
        })
      ).subscribe();
    } else {
      this.isSaving.set(false);
      this.onClose();
    }
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