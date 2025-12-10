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
import { firstValueFrom } from 'rxjs';

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

  @Input({ required: true }) claimId!: number;
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
    'assets/temp-photo-item.png',
  ]);

  constructor() {
    this.claimForm = this.fb.group({
      claimedBy: [''],
      remarks: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.isLoading.set(true);
    try {
      const allClaims = await firstValueFrom(this.claimService.getAllClaims());
      const current = allClaims.find((c) => c.claim_id === this.claimId);

      if (!current) {
        this.onClose();
        return;
      }
      this.activeClaim.set(current);

      const reportData = await firstValueFrom(
        this.itemService.getReports({ type: 'found' })
      );
      const foundReport = reportData.find(
        (r) => r.report_id === current.report_id
      );
      this.report.set(foundReport || null);

      this.claimForm.patchValue({
        remarks: current.admin_remarks || '', 
        claimedBy: '' 
      });

      if (foundReport) {
        const user = await firstValueFrom(
          this.userService.getUserById(foundReport.user_id)
        );
        this.reportOwnerName.set(user?.name || 'Unknown User');
      }

      const sameItemClaims = allClaims.filter(
        (c) => c.report_id === current.report_id
      );
      const relatedWithNames = await Promise.all(
        sameItemClaims.map(async (c) => {
          let name = 'Unknown';
          if(c.user_id) {
             try {
                const u = await firstValueFrom(
                        this.userService.getUserById(c.user_id));
                name = u?.name || 'Unknown';
             } catch(e) {}
          }
          return { claim: c, userName: name, code: c.claim_code || 'N/A' };
        })
      );
      this.relatedClaims.set(relatedWithNames);

    } catch (err) {
      console.error('Error loading modal data', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected onContainerClick(event: Event): void {
    this.closeDropdowns();
  }

  protected toggleDropdown(event: Event, claimId: number): void {
    event.stopPropagation();
    if (this.openDropdownId() === claimId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(claimId);
    }
  }

  protected closeDropdowns(): void {
    this.openDropdownId.set(null);
  }

  protected async updateStatus(
    claim: Claim, 
    newStatus: string
  ): Promise<void> {
    try {
      if (newStatus === 'approved') {
        await firstValueFrom(this.claimService.approveClaim(claim.claim_id));
      } else if (newStatus === 'rejected') {
        await firstValueFrom(this.claimService.rejectClaim(claim.claim_id));
      } else if (newStatus === 'pending') {
        await firstValueFrom(this.claimService.restoreClaim(claim.claim_id));
      } else if (newStatus === 'claimed') {
        await firstValueFrom(this.claimService.markAsClaimed(claim.claim_id));
      }

      await this.loadData();
      this.statusChange.emit();
      this.openDropdownId.set(null);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  }

  protected async saveItemDetails(): Promise<void> {
    if (this.claimForm.invalid) return;

    this.isSaving.set(true);
    const formValues = this.claimForm.value;
    console.log('Saving Form Data:', formValues);

    await new Promise((resolve) => setTimeout(resolve, 500));
    this.isSaving.set(false);
    this.closeDropdowns();
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