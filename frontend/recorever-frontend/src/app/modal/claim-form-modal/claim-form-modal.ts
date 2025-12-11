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
import { forkJoin, of, timer, Observable } from 'rxjs';
import { map, switchMap, finalize, catchError } from 'rxjs/operators';

import { Claim } from '../../models/claim-model';
import { Report } from '../../models/item-model';
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
  
  protected relatedClaims = signal<
    { claim: Claim; userName: string; code: string }[]
  >([]);
  
  protected reportOwnerName = signal<string>('Loading...');
  protected isLoading = signal(true);
  protected isSaving = signal(false);
  protected activeImageIndex = signal(0);
  protected openDropdownId = signal<number | null>(null);
  
  protected images = signal<string[]>([
    'assets/temp-photo-main.png', 
    'assets/temp-photo-item.png'
  ]);

  constructor() {
    this.claimForm = this.fb.group({
      claimedBy: [''],
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

    this.claimForm.patchValue({
      remarks: current.admin_remarks || '', 
      claimedBy: '' 
    });

    forkJoin({
      reports: this.itemService.getReports({ type: 'found' }),
      claims: this.claimService.getClaimsForReport(current.report_id)
    }).pipe(
      switchMap(({ reports, claims }) => {
        const foundReport = reports.find(
            (r) => r.report_id === current.report_id
        );
        this.report.set(foundReport || null);

        const user$ = foundReport 
            ? this.userService.getUserById(foundReport.user_id)
            : of(null);

        const mappedClaims$ = claims.length > 0 
            ? forkJoin(claims.map(c => this.mapClaimUser(c)))
            : of([]);

        return forkJoin({
            owner: user$,
            mappedClaims: mappedClaims$
        });
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({ owner, mappedClaims }) => {
        if (owner) {
            this.reportOwnerName.set(owner.name || 'Unknown User');
        }
        this.relatedClaims.set(mappedClaims);
      },
      error: (err) => console.error('Error loading modal data', err)
    });
  }

  private mapClaimUser(c: Claim): Observable<{ 
      claim: Claim; userName: string; code: string 
  }> {
    if (c.user_name) {
        return of({ 
            claim: c, 
            userName: c.user_name, 
            code: c.claim_code || 'N/A' 
        });
    }
    return this.userService.getUserById(c.user_id).pipe(
        map(u => ({ 
            claim: c, 
            userName: u?.name || 'Unknown', 
            code: c.claim_code || 'N/A' 
        })),
        catchError(() => of({ 
            claim: c, 
            userName: 'Unknown', 
            code: c.claim_code || 'N/A' 
        }))
    );
  }

  protected toggleDropdown(event: Event, claimId: number): void {
    event.stopPropagation();
    this.openDropdownId.update(id => id === claimId ? null : claimId);
  }

  protected closeDropdowns(): void {
    this.openDropdownId.set(null);
  }

  protected updateStatus(claim: Claim, newStatus: string): void {
    this.isSaving.set(true);
    const remarks = this.claimForm.get('remarks')?.value || '';
    
    this.claimService.updateClaimStatus(
        claim.claim_id, 
        newStatus, 
        remarks
    ).pipe(
        switchMap(() => {
            this.statusChange.emit();
            this.loadData(); 
            return of(true);
        }),
        finalize(() => {
            this.isSaving.set(false);
            this.openDropdownId.set(null);
        })
    ).subscribe({
        error: (err) => console.error('Failed to update status', err)
    });
  }

  protected saveItemDetails(): void {
    if (this.claimForm.invalid) return;

    this.isSaving.set(true);
    timer(500).pipe(
        finalize(() => {
            this.isSaving.set(false);
            this.closeDropdowns();
        })
    ).subscribe();
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