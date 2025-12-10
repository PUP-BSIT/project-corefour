import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ClaimService } from '../../../core/services/claim-service';
import { Claim } from '../../../models/claim-model';
import { 
  SearchBarComponent 
} from '../../../share-ui-blocks/search-bar/search-bar';
import { 
  ClaimFormModal 
} from '../../../modal/claim-form-modal/claim-form-modal';

type SortOption = 'all' | 'az' | 'date';

@Component({
  selector: 'app-claim-status-page',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    SearchBarComponent, 
    DatePipe, 
    ClaimFormModal
  ],
  templateUrl: './claim-status-page.html',
  styleUrl: './claim-status-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimStatusPage implements OnInit {
  private claimService = inject(ClaimService);

  protected claims = signal<Claim[]>([]);
  protected searchQuery = signal(''); 
  protected currentSort = signal<SortOption>('all');
  protected isLoading = signal(true);
  
  protected selectedClaim = signal<Claim | null>(null);

  protected filteredClaims = computed(() => {
    let data = this.claims();
    const query = this.searchQuery().toLowerCase();
    const sortType = this.currentSort();

    if (query) {
      data = data.filter((claim) =>
        (claim.item_name || '').toLowerCase().includes(query) ||
        claim.claim_id.toString().includes(query) ||
        (claim.admin_remarks || '').toLowerCase().includes(query)
      );
    }

    return [...data].sort((a, b) => {
      if (sortType === 'az') {
        return (a.item_name || '').localeCompare(b.item_name || '');
      }
      if (sortType === 'date') {
        return new Date(b.created_at).getTime() - 
               new Date(a.created_at).getTime();
      }
      return 0;
    });
  });

  ngOnInit(): void {
    this.loadClaims();
  }

  protected loadClaims(): void {
    this.isLoading.set(true);

    this.claimService.getAllClaims().pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (data) => {
        this.claims.set(data);
      },
      error: (err) => {
        console.error('Failed to load claims', err);
      }
    });
  }

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  protected setSort(option: SortOption): void {
    this.currentSort.set(option);
  }

  protected onViewDetails(claimId: number): void {
    const claim = this.claims().find(c => c.claim_id === claimId);
    if (claim) {
      this.selectedClaim.set(claim);
    }
  }

  protected onCloseModal(): void {
    this.selectedClaim.set(null);
  }

  protected onStatusChanged(): void {
    this.loadClaims();
  }
}